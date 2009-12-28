(function(Monarch) {

Monarch.constructor("Monarch.Model.LocalField", Monarch.Model.ConcreteField, {
  initialize: function(fieldset, column) {
    this.fieldset = fieldset;
    this.column = column;
    this.validation_errors = [];
  },

  remote_field: function(remote_field) {
    if (arguments.length == 0) {
      return this._remote_field
    } else {
      return this._remote_field = remote_field;
    }
  },

  dirty: function() {
    return this._dirty;
  },

  mark_dirty: function() {
    if (!this._dirty) {
      this._dirty = true;
      this.fieldset.field_marked_dirty();
    }
  },

  mark_clean: function() {
    if (this._dirty) {
      this._dirty = false;
      this.fieldset.field_marked_clean();
    }
  },

  not_modified_after: function(date) {
    return !this.last_modified_at || this.last_modified_at.getTime() <= date.getTime();
  },

  signal: function(optional_transformer) {
    return new Monarch.Model.Signal(this, this.remote_field(), optional_transformer);
  },

  value_wire_representation: function() {
    return this.column.convert_value_for_wire(this.value());
  },

  valid: function() {
    return this.validation_errors.length == 0;
  },

  // private
  
  value_assigned: function(new_value, old_value) {
    if (this.value_equals(this._remote_field.value())) {
      this.mark_clean();
    } else {
      this.mark_dirty();
    }
    if (this.on_remote_update_node) this.on_remote_update_node.publish(new_value, old_value);
  }
});

})(Monarch);
