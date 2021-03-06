(function(Monarch) {_.constructor("Monarch.Model.Record", {
  constructorProperties: {
    initialize: function() {
      this.delegateConstructorMethods('find', 'fetch', 'findOrFetch', 'tuples', 'first', 'each', 'onEach', 'map', 'any',
                                      'onInsert', 'onUpdate', 'onRemove', 'onDirty', 'onClean', 'onInvalid', 'defaultOrderBy',
                                      'onValid', 'where', 'offset', 'contains', 'orderBy', 'project', 'union', 'difference',
                                      'empty', 'build', 'create', 'createFromRemote', 'fixture', 'clear', 'wireRepresentation',
                                      'size', 'table');
    },

    inherited: function(subconstructor) {
      subconstructor.table = new Monarch.Model.Relations.Table(this.determineGlobalName(subconstructor), subconstructor);
      subconstructor.generateColumnAccessors(subconstructor.table.column('id'));
      subconstructor.relationDefinitions = [];
      Repository.registerTable(subconstructor.table);
    },

    column: function(name, type) {
      this.generateColumnAccessors(this.table.defineColumn(name, type));
    },

    syntheticColumn: function(name, definition) {
      this.generateColumnAccessors(this.table.defineSyntheticColumn(name, definition));
    },

    columns: function(columnNameTypePairs) {
      for (var name in columnNameTypePairs) {
        this.column(name, columnNameTypePairs[name]);
      }
    },

    relatesToMany: function(name, definition) {
      var relationDefinition = new Monarch.Model.RelationDefinition(name, definition);
      this.relationDefinitions.push(relationDefinition);
      this.prototype[name] = function() {
        return this.relationsByName[name];
      };
      return relationDefinition;
    },

    hasMany: function(relationName, options) {
      var self = this;
      options = options || {};
      var conditions = options.conditions || {};
      var targetTableName = options.constructorName ? _.underscoreAndPluralize(options.constructorName) : _.underscoreAndPluralize(relationName);
      var foreignKeyColumnName = options.key || _.camelize(_.singularize(this.table.globalName), true) + "Id";

      return this.relatesToMany(relationName, function() {
        var targetTable = Repository.tables[targetTableName];
        conditions[foreignKeyColumnName] = this.id();
        var relation = targetTable.where(conditions);

        if (options.orderBy) relation = self.processHasManyOrderByOption(relation, options.orderBy);
        return relation;
      });
    },

    belongsTo: function(name, options) {
      if (!options) options = {};
      var keyName = name + "Id";
      var tableName = options.constructorName ?
        _.underscoreAndPluralize(options.constructorName) : _.underscoreAndPluralize(name);

      this.prototype[name] = function(model) {
        if (arguments.length == 0) {
          var id = this[keyName]();
          if (!id) return null;
          var table = Repository.tables[tableName];
          return table.find(id);
        } else {
          this[keyName](model.id());
          return model;
        }
      };
    },

    humanName: function() {
      return _.humanize(this.basename);
    },

    // private

    generateColumnAccessors: function(column) {
      if (column.name == "name") {
        this["name_"] = column; // name property of functions is read-only in webkit
      } else {
        this[column.name] = column;
      }

      this.prototype[column.name] = function() {
        var field = this.field(column.name);
        return field.value.apply(field, arguments);
      };
    },

    processHasManyOrderByOption: function(relation, orderBy) {
      if (orderBy instanceof Array) {
        return relation.orderBy.apply(relation, orderBy);
      } else {
        return relation.orderBy(orderBy);
      }
    },

    determineGlobalName: function(recordConstructor) {
      return _.pluralize(_.underscore(recordConstructor.basename));
    }
  },

  initialize: function(fieldValuesByColumnName, table) {
    this.table = table;
    this.remote = new Monarch.Model.RemoteFieldset(this);
    this.local = new Monarch.Model.LocalFieldset(this, this.remote);
    this.subscriptions = new Monarch.SubscriptionBundle();

    this.localVersion = 0;
    this.remoteVersion = 0;
    this.pendingVersion = 0;

    this.initializeSubscriptionNodes();
    this.subscribeToSelfMutations();
    if (fieldValuesByColumnName) this.localUpdate(fieldValuesByColumnName);
    this.local.updateEventsEnabled = true;
    this.remote.initializeSyntheticFields();
    this.local.initializeSyntheticFields();
    if (this.afterInitialize) this.afterInitialize();
  },

  toString: function() {
    return JSON.stringify(this.wireRepresentation());
  },

  fetch: function() {
    return this.table.where(this.table.column('id').eq(this.id())).fetch();
  },

  save: function() {
    return Server.update(this);
  },

  localUpdate: function(valuesByMethodName) {
    this.local.beginBatchUpdate();
    for (var methodName in valuesByMethodName) {
      if (this[methodName]) {
        this[methodName](valuesByMethodName[methodName]);
      }
    }
    this.local.finishBatchUpdate();
  },

  update: function(valuesByMethodName) {
    this.localUpdate(valuesByMethodName);
    return this.save();
  },

  destroy: function() {
    return Server.destroy(this);
  },

  remotelyCreated: function(fieldValues) {
    this.remote.update(_.camelizeKeys(fieldValues));
    this.isRemotelyCreated = true;
    this.remote.updateEventsEnabled = true;
    this.initializeRelations();
    this.table.tupleInsertedRemotely(this);
    this.onCreateNode.publish(this);
  },

  remotelyUpdated: function(fieldValues, version) {
    return this.remote.update(_.camelizeKeys(fieldValues), version);
  },

  remotelyDestroyed: function() {
    this.table.remove(this);
    this.onDestroyNode.publish(this);
  },

  onUpdate: function(callback, context) {
    return this.onUpdateNode.subscribe(callback, context);
  },

  onLocalUpdate: function(callback, context) {
    if (!this.onLocalUpdateNode) this.onLocalUpdateNode = new Monarch.SubscriptionNode();
    return this.onLocalUpdateNode.subscribe(callback, context);
  },

  onDestroy: function(callback, context) {
    return this.onDestroyNode.subscribe(callback, context);
  },

  onCreate: function(callback, context) {
    return this.onCreateNode.subscribe(callback, context)
  },

  onDirty: function(callback, context) {
    if (!this.onDirtyNode) this.onDirtyNode = new Monarch.SubscriptionNode();
    return this.onDirtyNode.subscribe(callback, context);
  },

  onClean: function(callback, context) {
    if (!this.onCleanNode) this.onCleanNode = new Monarch.SubscriptionNode();
    return this.onCleanNode.subscribe(callback, context);
  },

  onInvalid: function(callback, context) {
    if (!this.onInvalidNode) this.onInvalidNode = new Monarch.SubscriptionNode();
    return this.onInvalidNode.subscribe(callback, context);
  },

  onValid: function(callback, context) {
    if (!this.onValidNode) this.onValidNode = new Monarch.SubscriptionNode();
    return this.onValidNode.subscribe(callback, context);
  },

  valid: function() {
    return this.local.valid();
  },

  clearValidationErrors: function() {
    this.local.clearValidationErrors();
  },

  assignValidationErrors: function(errorsByFieldName) {
    this.local.assignValidationErrors(_.camelizeKeys(errorsByFieldName));
    if (this.onInvalidNode) this.onInvalidNode.publish();
    this.table.recordMadeInvalid(this);
  },

  allValidationErrors: function() {
    return this.local.allValidationErrors();
  },

  nextLocalVersion: function() {
    if (this.localVersion === this.pendingVersion) this.localVersion++;
    return this.localVersion;
  },

  nextPendingVersion: function() {
    this.pendingVersion = this.localVersion;
    return this.pendingVersion;
  },

  dirty: function() {
    return this.locallyDestroyed || !this.isRemotelyCreated || this.local.dirty();
  },

  dirtyWireRepresentation: function() {
    return this.local.dirtyWireRepresentation();
  },

  wireRepresentation: function() {
    return this.local.wireRepresentation();
  },

  inspect: function() {
    return [this.constructor.basename + " Record", this.wireRepresentation()];
  },

  field: function(column) {
    return this.local.field(column);
  },

  signal: function(column, optionalTransformer) {
    return this.field(column).signal(optionalTransformer);
  },

  evaluate: function(columnOrConstant) {
    if (columnOrConstant instanceof Monarch.Model.Column) {
      return this.field(columnOrConstant).value();
    } else {
      return columnOrConstant;
    }
  },

  record: function(table) {
    return this.table === table ? this : null;
  },

  pauseEvents: function() {
    this.onCreateNode.pauseEvents();
    this.onUpdateNode.pauseEvents();
    this.onDestroyNode.pauseEvents();
  },

  resumeEvents: function() {
    this.onCreateNode.resumeEvents();
    this.onUpdateNode.resumeEvents();
    this.onDestroyNode.resumeEvents();
  },

  madeDirty: function() {
    if (this.onDirtyNode) this.onDirtyNode.publish();
    this.table.recordMadeDirty(this);
  },

  madeClean: function() {
    if (this.onCleanNode) this.onCleanNode.publish();
    this.table.recordMadeClean(this);
  },

  cleanup: function() {
    this.subscriptions.destroy();
  },

  isEqual: function(other) {
    if (this.constructor !== other.constructor) return false;
    return this.id() === other.id();
  },

  hashCode: function() {
    return this.id();
  },

  // private
  initializeSubscriptionNodes: function() {
    this.onUpdateNode = new Monarch.SubscriptionNode();
    this.onDestroyNode = new Monarch.SubscriptionNode();
    this.onCreateNode = new Monarch.SubscriptionNode();

    this.subscriptions.add(this.table.onPauseEvents(function() {
      this.pauseEvents();
    }, this));

    this.subscriptions.add(this.table.onResumeEvents(function() {
      this.resumeEvents();
    }, this));
  },

  subscribeToSelfMutations: function() {
    this.onCreateNode.subscribe(function(changeset) {
      if (this.afterRemoteCreate) this.afterRemoteCreate();
    }, this);

    this.onUpdateNode.subscribe(function(changeset) {
      if (this.afterRemoteUpdate) this.afterRemoteUpdate(changeset);
    }, this);

    this.onDestroyNode.subscribe(function() {
      if (this.afterRemoteDestroy) this.afterRemoteDestroy();
      this.cleanup();
    }, this);
  },

  initializeRelations: function() {
    this.relationsByName = {};
    _.each(this.constructor.relationDefinitions, function(relationDefinition) {
      this.relationsByName[relationDefinition.name] = relationDefinition.build(this);
    }, this);
  }
});

})(Monarch);
