constructor("Model.Field", {
  initialize: function(fieldset, column) {
    this.fieldset = fieldset;
    this.column = column;
    this.on_update_node = new SubscriptionNode();
  },

  clone_pending_field: function(fieldset) {
    var pending_field = new Model.Field(fieldset, this.column)
    pending_field._value = this._value;
    pending_field.pending = true;
    return pending_field;
  },

  value: function(value) {
    if (arguments.length == 1) {
      if (this._value != value) return this.assign_value(value);
    } else {
      return this._value;
    }
  },

  assign_value: function(value) {
    var old_value = this._value;
    this._value = this.column.convert_for_storage(value);
    if (this.pending) {
      this.dirty = true;
    } else {
      this.fieldset.field_updated(this, old_value, this._value);
      if (this.fieldset.update_events_enabled) this.on_update_node.publish(this._value, old_value)
    }
    return this._value;
  },

  signal: function(optional_transformer) {
    return new Model.Signal(this, optional_transformer);
  },
  
  on_update: function(update_callback) {
    this.on_update_node.subscribe(update_callback);
  },

  value_wire_representation: function() {
    return this.column.convert_for_wire(this.value());
  }
});
