(function(Monarch) {

_.constructor("Monarch.Model.Relations.Table", Monarch.Model.Relations.Relation, {
  numOperands: 0,

  initialize: function(globalName, recordConstructor) {
    this.globalName = globalName;
    this.recordConstructor = recordConstructor;
    this.columnsByName = {};
    this.syntheticColumnsByName = {};
    this.defineColumn('id', 'key');
    this.sortSpecifications = [this.column("id").asc()];
    this.storedTuples = this.buildSkipList();
    this.tuplesById = {};

    this.initializeEventsSystem();
    this.onPauseEventsNode = new Monarch.SubscriptionNode();
    this.onResumeEventsNode = new Monarch.SubscriptionNode();
  },

  defineColumn: function(name, type) {
    return this.columnsByName[name] = new Monarch.Model.Column(this, name, type);
  },

  defineSyntheticColumn: function(name, definition) {
    return this.syntheticColumnsByName[name] = new Monarch.Model.SyntheticColumn(this, name, definition);
  },

  defaultOrderBy: function() {
    this.sortSpecifications = this.extractSortSpecsFromArguments(arguments).concat([this.column("id").asc()]);
    this.comparator = this.buildComparator();
    this.storedTuples = this.buildSkipList();
  },

  build: function(fieldValues) {
    return new this.recordConstructor(fieldValues, this);
  },

  create: function(fieldValues) {
    return Server.create(this.build(fieldValues));
  },

  createFromRemote: function(fieldValues) {
    var record = new this.recordConstructor(null, this);
    record.remotelyCreated(fieldValues);
    return record;
  },

  remove: function(record) {
    delete this.tuplesById[record.id()];
    this.tupleRemovedRemotely(record);
  },

  tupleInsertedRemotely: function($super, record) {
    this.tuplesById[record.id()] = record;
    $super(record);
  },

  tuples: function() {
    return this.storedTuples.values();
  },

  find: function(predicateOrId) {
    if (_.isString(predicateOrId) || _.isNumber(predicateOrId)) {
      var record = this.tuplesById[predicateOrId]
      return (record && record.locallyDestroyed) ? null : record;
    } else if (predicateOrId) {
      return this.where(predicateOrId).first();
    } else {
      throw new Error("You called find with null id");
    }
  },

  fetch: function($super, id) {
    if (arguments.length === 1){
      return $super();
    } else {
      return this.where({id: id}).fetch();
    }
  },

  findOrFetch: function(id, additionalRelations) {
    var promise = new Monarch.Promise();
    var record = this.find(id);
    if (record) {
      promise.triggerSuccess(record, false);
    } else {
      var relationsToFetch = [this.where({id: id})];
      if (additionalRelations) relationsToFetch = relationsToFetch.concat(additionalRelations);
      Server.fetch(relationsToFetch).success(function() {
        var record = this.find(id);
        if (record) {
          promise.triggerSuccess(record, true);
        } else {
          promise.triggerInvalid();
        }
      }, this);
    }
    return promise;
  },

  column: function(name) {
    return this.columnsByName[name] || this.syntheticColumnsByName[name];
  },

  surfaceTables: function() {
    return [this];
  },

  wireRepresentation: function() {
    return {
      type: 'table',
      name: this.globalName
    };
  },

  pauseEvents: function() {
    this.onInsertNode.pauseEvents();
    this.onRemoveNode.pauseEvents();
    this.onUpdateNode.pauseEvents();
    this.onPauseEventsNode.publish();
  },

  resumeEvents: function() {
    this.onInsertNode.resumeEvents();
    this.onRemoveNode.resumeEvents();
    this.onUpdateNode.resumeEvents();
    this.onResumeEventsNode.publish();
  },

  onPauseEvents: function(callback, context) {
    return this.onPauseEventsNode.subscribe(callback, context);
  },

  onResumeEvents: function(callback, context) {
    return this.onResumeEventsNode.subscribe(callback, context);
  },
  
  updateContents: function(dataset) {
    _.each(dataset, function(fieldValues, id) {
      var extantRecord = this.find(id);
      if (extantRecord) {
        extantRecord.remotelyUpdated(fieldValues);
      } else {
        this.createFromRemote(fieldValues)
      }
    }, this);
  },
  
  deltaContents: function(dataset) {
    this.each(function(record) {
      if (!dataset[record.id()]) {
        record.remotelyDestroyed();
      }
    });
    this.updateContents(dataset);
  },
  
  loadFixtures: function(fixtureDefinitions) {
    _.each(fixtureDefinitions, function(properties, id) {
      var fieldValues = _.extend({id: id}, properties)
      this.createFromRemote(fieldValues);
    }, this);
  },

  clear: function() {
    this.storedTuples = this.buildSkipList();
    this.tuplesById = {}
    this.onInsertNode = new Monarch.SubscriptionNode();
    this.onRemoveNode = new Monarch.SubscriptionNode();
    this.onUpdateNode = new Monarch.SubscriptionNode();
    this.onPauseEventsNode = new Monarch.SubscriptionNode();
    this.onResumeEventsNode = new Monarch.SubscriptionNode();
  },

  cloneSchema: function() {
    var clone = new Monarch.Model.Relations.Table(this.globalName, this.recordConstructor);
    clone.columnsByName = this.columnsByName;
    return clone;
  },

  evaluateInRepository: function(repository) {
    return repository.tables[this.globalName];
  },

  isEqual: function(other) {
    return this === other;
  }
});

})(Monarch);
