(function(Monarch) {

Monarch.constructor("Monarch.Model.Relations.Relation", {
  hasOperands: true,
  _relation_: true,

  initializeEventsSystem: function() {
    this.onLocalUpdateNode = new Monarch.SubscriptionNode();
    this.onRemoteInsertNode = new Monarch.SubscriptionNode();
    this.onRemoteUpdateNode = new Monarch.SubscriptionNode();
    this.onRemoteRemoveNode = new Monarch.SubscriptionNode();
    this.onDirtyNode = new Monarch.SubscriptionNode();
    this.onCleanNode = new Monarch.SubscriptionNode();
    if (this.hasOperands) {
      this.operandsSubscriptionBundle = new Monarch.SubscriptionBundle();
      this.unsubscribeFromOperandsWhenThisNoLongerHasSubscribers();
    }
  },

  where: function(predicateOrConditionsHash) {
    var predicate;

    if (predicateOrConditionsHash.constructor.isPredicate) {
      predicate = predicateOrConditionsHash;
    } else {
      predicate = this.predicateFromHash(predicateOrConditionsHash);
    }
    return new Monarch.Model.Relations.Selection(this, predicate);

  },

  project: function() {
    if (arguments.length == 1) {
      var table;
      if (_.isFunction(arguments[0])) {
        table = arguments[0].table;
      } else if (arguments[0] instanceof Monarch.Model.Relations.Table) {
        table = arguments[0];
      }

      if (table) return new Monarch.Model.Relations.TableProjection(this, table);
    }

    var projectedColumns = Monarch.Util.map(Monarch.Util.toArray(arguments), function(arg) {
      if (arg instanceof Monarch.Model.ProjectedColumn) {
        return arg;
      } else if (arg instanceof Monarch.Model.Column) {
        return new Monarch.Model.ProjectedColumn(arg);
      } else {
        throw new Error("#project takes Columns or ProjectedColumns only");
      }
    });
    return new Monarch.Model.Relations.Projection(this, projectedColumns);
  },

  join: function(rightOperand) {
    if (typeof rightOperand === 'function') rightOperand = rightOperand.table;
    var leftOperand = this;
    return {
      on: function(predicate) {
        return new Monarch.Model.Relations.InnerJoin(leftOperand, rightOperand, predicate);
      }
    };
  },

  joinTo: function(rightOperand) {
    if (typeof rightOperand === 'function') rightOperand = rightOperand.table;
    var leftSurfaceTables = this.surfaceTables();
    var rightSurfaceTables = rightOperand.surfaceTables();
    var joinColumns = this.findJoinColumns(_.last(leftSurfaceTables), _.first(rightSurfaceTables));
    return this.join(rightOperand).on(joinColumns[0].eq(joinColumns[1]));
  },

  joinThrough: function(rightOperand) {
    if (typeof rightOperand === 'function') rightOperand = rightOperand.table;
    return this.joinTo(rightOperand).project(rightOperand);
  },

  orderBy: function() {
    var self = this;
    var orderByColumns = Monarch.Util.map(Monarch.Util.toArray(arguments), function(orderByColumn) {
      if (orderByColumn instanceof Monarch.Model.OrderByColumn) {
        return orderByColumn;
      } else if (orderByColumn instanceof Monarch.Model.Column) {
        return orderByColumn.asc();
      } else if (typeof orderByColumn == "string") {
        var parts = orderByColumn.split(/ +/);
        var columnName = parts[0];
        var direction = parts[1] || 'asc';
        if (direction == 'desc') {
          return self.column(columnName).desc();
        } else {
          return self.column(columnName).asc();
        }
      } else {
        throw new Error("You can only order by Columns, OrderByColumns, or 'columnName direction' strings");
      }
    });

    return new Monarch.Model.Relations.Ordering(this, orderByColumns);
  },

  difference: function(rightOperand) {
    return new Monarch.Model.Relations.Difference(this, rightOperand);
  },

  tuples: function() {
    return this.localTuples();
  },

  localTuples: function() {
    return Monarch.Util.select(this.allTuples(), function(record) {
      return !record.locallyDestroyed;
    });
  },

  dirtyTuples: function() {
    return Monarch.Util.select(this.allTuples(), function(record) {
      return record.dirty();
    });
  },

  dirty: function() {
    return this.dirtyTuples().length > 0;
  },

  each: function(fn) {
    _.each(this.tuples(), fn);
  },

  map: function(fn) {
    return Monarch.Util.map(this.tuples(), fn);
  },

  any: function(fn) {
    return Monarch.Util.any(this.tuples(), fn);
  },

  empty: function() {
    return this.tuples().length == 0;
  },

  first: function() {
    return this.tuples()[0];
  },

  last: function() {
    var tuples = this.tuples();
    return tuples[tuples.length-1];
  },

  find: function(predicateOrIdOrHash) {
    if (typeof predicateOrIdOrHash === "string") {
      return this.where(this.column('id').eq(predicateOrIdOrHash)).first();
    } else {
      return this.where(predicateOrIdOrHash).first();
    }
  },

  size: function() {
    return this.tuples().length;
  },

  at: function(i) {
    return this.tuples()[i];
  },

  onLocalUpdate: function(callback) {
    this.subscribeToOperandsIfNeeded();
    return this.onLocalUpdateNode.subscribe(callback);
  },

  onRemoteInsert: function(callback) {
    this.subscribeToOperandsIfNeeded();
    return this.onRemoteInsertNode.subscribe(callback);
  },

  onRemoteUpdate: function(callback) {
    this.subscribeToOperandsIfNeeded();
    return this.onRemoteUpdateNode.subscribe(callback);
  },

  onRemoteRemove: function(callback) {
    this.subscribeToOperandsIfNeeded();
    return this.onRemoteRemoveNode.subscribe(callback);
  },

  onDirty: function(callback) {
    this.subscribeToOperandsIfNeeded();
    return this.onDirtyNode.subscribe(callback);
  },

  onClean: function(callback) {
    this.subscribeToOperandsIfNeeded();
    return this.onCleanNode.subscribe(callback);
  },

  recordMadeDirty: function(record) {
    this.onDirtyNode.publish(record);
  },

  recordMadeClean: function(record) {
    this.onCleanNode.publish(record);
  },

  hasSubscribers: function() {
    return !(this.onRemoteInsertNode.empty() && this.onRemoteRemoveNode.empty()
        && this.onRemoteUpdateNode.empty() && this.onDirtyNode.empty() && this.onCleanNode.empty());
  },

  fetch: function() {
    return Server.fetch([this]);
  },

  subscribe: function() {
    return Server.subscribe([this]);
  },

  memoizeTuples: function() {
    this.Tuples = this.tuples();
  },

  tupleInsertedRemotely: function(record, options) {
    if (!this.contains(record)) {
      this.Tuples.push(record)
    }
    this.onRemoteInsertNode.publish(record);
  },

  tupleUpdatedRemotely: function(record, updateData) {
    this.onRemoteUpdateNode.publish(record, updateData);
  },

  tupleUpdatedLocally: function(record, updateData) {
    this.onLocalUpdateNode.publish(record, updateData);
  },

  tupleRemovedRemotely: function(record) {
    Monarch.Util.remove(this.Tuples, record);
    this.onRemoteRemoveNode.publish(record);
  },

  contains: function(record) {
    var tuples = this.tuples();
    for(var i = 0; i < tuples.length; i++) {
      if (tuples[i] == record) return true;
    }
    return false;
  },

  subscribeToOperandsIfNeeded: function() {
    if (this.hasOperands && !this.hasSubscribers()) {
      this.subscribeToOperands();
      this.memoizeTuples();
    }
  },

  unsubscribeFromOperandsWhenThisNoLongerHasSubscribers: function() {
    var self = this;
    var unsubscribeCallback = function() {
       if (!self.hasSubscribers()) self.unsubscribeFromOperands();
    };

    this.onRemoteInsertNode.onUnsubscribe(unsubscribeCallback);
    this.onRemoteRemoveNode.onUnsubscribe(unsubscribeCallback);
    this.onRemoteUpdateNode.onUnsubscribe(unsubscribeCallback);
    this.onDirtyNode.onUnsubscribe(unsubscribeCallback);
    this.onCleanNode.onUnsubscribe(unsubscribeCallback);
  },

  unsubscribeFromOperands: function() {
    this.operandsSubscriptionBundle.destroyAll();
    this.Tuples = null;
  },

  remoteSubscribe: function() {
    var subscribeFuture = new Monarch.Http.AjaxFuture();
    Server.subscribe([this]).onSuccess(function(remoteSubscriptions) {
      subscribeFuture.triggerSuccess(remoteSubscriptions[0]);
    });
    return subscribeFuture;
  },

  // private

  predicateFromHash: function(hash) {
    var self = this;
    var predicates = [];
    Monarch.Util.each(hash, function(key, value) {
      predicates.push(self.column(key).eq(value))
    });

    if (_.isEmpty(predicates)) throw new Error("No key value pairs provided for predication");

    if (predicates.length == 1) {
      return predicates[0];
    } else {
      return new Monarch.Model.Predicates.And(predicates);
    }
  },

  findJoinColumns: function(left, right) {
    var foreignKey;
    if (foreignKey = right.column(_.singularize(left.globalName) + "Id")) {
      return [left.column("id"), foreignKey];
    } else if (foreignKey = left.column(_.singularize(right.globalName) + "Id")) {
      return [foreignKey, right.column("id")];
    } else {
      throw new Error("No foreign key found for #joinTo operation");
    }
  }

});

})(Monarch);
