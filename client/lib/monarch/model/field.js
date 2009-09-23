constructor("Model.Field", {
  initialize: function(fieldset, column) {
    this.fieldset = fieldset;
    this.column = column;
  },

  clone_pending_field: function(fieldset) {
    var pending_field = new Model.Field(fieldset, this.column)
    pending_field._value = this._value;
    return pending_field;
  },

  value: function(value) {
    if (value) {
      if (this._value != value) {
        var old_value = this._value;
        this._value = value;
        this.fieldset.field_updated(this, old_value, value);
      }
      return value;
    } else {
      return this._value;
    }
  }
});
