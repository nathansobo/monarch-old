(function(Monarch) {

Monarch.constructor("Monarch.Model.Fieldset", {
  field: function(column_or_name) {
    var column_name = (typeof column_or_name == 'string') ? column_or_name : column_or_name.name;
    return this.fields_by_column_name[column_name] || this.synthetic_fields_by_column_name[column_name];
  },

  // protected

  initialize_synthetic_fields: function() {
    var self = this;
    this.synthetic_fields_by_column_name = {};
    Monarch.Util.each(this.record.table().synthetic_columns_by_name, function(column_name, column) {
      var signal = column.definition.call(self.record);
      self.synthetic_fields_by_column_name[column_name] = new Monarch.Model.SyntheticField(self, column, signal);
      self[column_name] = function() {
        var field = self.field(column_name);
        return field.value.apply(field, arguments);
      }
    });
  },

  generate_field_accessor: function(column_name) {
    this[column_name] = function() {
      var field = this.field(column_name);
      return field.value.apply(field, arguments);
    }
  }
});

})(Monarch);
