(function(Monarch) {

_.constructor("Monarch.Model.LocalField", Monarch.Model.ConcreteField, {
  propertyAccessors: ['remoteField'],

  initialize: function(fieldset, column) {
    this.fieldset = fieldset;
    this.column = column;
    this.record = this.fieldset.record;
    this.validationErrors = [];
    this.updateEventsEnabled = true;
    this.version = this.record.localVersion;
  },

  onRemoteUpdate: function(callback, context) {
    return this.remoteField().onUpdate(callback, context);
  },

  dirty: function() {
    return this.Dirty;
  },

  markDirty: function() {
    if (!this.Dirty) {
      this.Dirty = true;
      this.fieldset.fieldMarkedDirty();
    }
  },

  markClean: function() {
    this.clearValidationErrors();
    if (this.Dirty) {
      this.Dirty = false;
      this.fieldset.fieldMarkedClean();
    }
  },

  assignValidationErrors: function(errors) {
    this.validationErrors = errors;
  },

  clearValidationErrors: function() {
    var wasInvalid = !this.fieldset.valid();
    this.validationErrors = [];
    if (wasInvalid && this.fieldset.valid()) {
      if (this.record.onValidNode) this.record.onValidNode.publish();
      this.record.table.recordMadeValid(this.record);
    }
  },

  notModifiedAfter: function(date) {
    return !this.lastModifiedAt || this.lastModifiedAt.getTime() <= date.getTime();
  },

  signal: function(optionalTransformer) {
    return new Monarch.Model.Signal(this, this.remoteField(), optionalTransformer);
  },

  valueWireRepresentation: function() {
    return this.column.convertValueForWire(this.value());
  },

  valid: function() {
    return this.validationErrors.length == 0;
  },

  // private
  
  valueAssigned: function(newValue, oldValue) {
    if (!this.updateEventsEnabled) return;

    this.version = this.record.nextLocalVersion();

    if (this.valueIsEqual(this.remoteField().value())) {
      this.markClean();
    } else {
      this.markDirty();
    }

    var batchAlreadyInProgress = this.fieldset.batchInProgress;
    if (!batchAlreadyInProgress) this.fieldset.beginBatchUpdate();
    this.fieldset.fieldUpdated(this, newValue, oldValue);
    if (this.onUpdateNode) this.onUpdateNode.publish(newValue, oldValue);
    if (!batchAlreadyInProgress) this.fieldset.finishBatchUpdate();
  }
});

})(Monarch);
