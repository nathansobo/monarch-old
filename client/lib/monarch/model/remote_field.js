(function(Monarch) {

Monarch.constructor("Monarch.Model.RemoteField", Monarch.Model.ConcreteField, {
  initialize: function(fieldset, column) {
    this.fieldset = fieldset;
    this.column = column;
  },

  local_field: function(local_field) {
    if (arguments.length == 0) {
      return this._local_field
    } else {
      return this._local_field = local_field;
    }
  },

  value: function(value, requested_at) {
    if (arguments.length == 0) {
      return this._value;
    } else {
      this.assign_value(value)
      if (this._local_field.clean() || this._local_field.not_modified_after(requested_at)) {
        this._local_field.value(value)
        this._local_field.mark_clean();
      }
      return value;
    }
  },

  on_update: function(update_callback) {
    if (!this.on_update_node) this.on_update_node = new Monarch.SubscriptionNode();
    this.on_update_node.subscribe(update_callback);
  },

  // private

  assign_value: function(value) {
    value = this.column.convert_value_for_field(value);
    if (!this.value_equals(value)) {
      var old_value = this._value;
      this._value = value;
      this.fieldset.field_updated(this, this._value, old_value);
      if (this.fieldset.update_events_enabled && this.on_update_node) this.on_update_node.publish(this._value, old_value)
    }
    return value;
  },

  value_equals: function(value) {
    if (this.column.type == "datetime" && this._value && value) {
      return this._value.getTime() == value.getTime();
    }
    return this._value == value;
  }
});

})(Monarch);
