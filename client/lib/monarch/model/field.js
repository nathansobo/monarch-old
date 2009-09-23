constructor("Model.Field", {
  initialize: function(fieldset, column) {
    this.fieldset = fieldset;
    this.column = column;
  },

  clone_pending_field: function(fieldset) {
    var pending_field = new Model.Field(fieldset, this.column)
    pending_field._value = this._value;
    pending_field.pending = true;
    return pending_field;
  },

  value: function(value) {


    if (arguments.length == 1) {
      if (this._value != value) {
        var old_value = this._value;
        this._value = this.column.convert_for_storage(value);
        if (this.pending) {
          this.dirty = true;
        } else {
          this.fieldset.field_updated(this, old_value, this._value);
        }
      }
      return this._value;
    } else {
      return this._value;
    }
  },

  value_wire_representation: function() {
    return this.column.convert_for_wire(this.value());
  }
});
