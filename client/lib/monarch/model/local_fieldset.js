(function(Monarch) {

Monarch.constructor("Monarch.Model.LocalFieldset", {
  initialize: function(record, remote_fieldset) {
    this.record = record;
    this.remote_fieldset = remote_fieldset;
    remote_fieldset.local_fieldset = this;

    this.initialize_local_fields();
    this.connect_local_and_remote_fields();
  },

  valid: function() {
    return Monarch.Util.all(this.fields_by_column_name, function(column_name, field) {
      return field.valid();
    });
  },

  all_validation_errors: function() {
    var all_validation_errors = [];
    Monarch.Util.each(this.fields_by_column_name, function(column_name, field) {
      all_validation_errors = all_validation_errors.concat(field.validation_errors);
    });
    return all_validation_errors;
  },

  field: function(column_or_name) {
    var column_name = (typeof column_or_name == 'string') ? column_or_name : column_or_name.name;
    return this.fields_by_column_name[column_name] || this.synthetic_fields_by_column_name[column_name];
  },

  dirty_wire_representation: function() {
    return this.wire_representation(true)
  },

  wire_representation: function(only_dirty) {
    var wire_representation = {};
    Monarch.Util.each(this.fields_by_column_name, function(column_name, field) {
      if (!only_dirty || field.dirty()) wire_representation[column_name] = field.value_wire_representation();
    });
    return wire_representation;
  },

  initialize_synthetic_fields: function() {
    this.synthetic_fields_by_column_name = {};
    Monarch.Util.each(this.record.table().synthetic_columns_by_name, function(column_name, column) {
      var signal = column.definition.call(this.record);
      this.synthetic_fields_by_column_name[column_name] = new Monarch.Model.SyntheticField(this.record, column, signal);
    }.bind(this));
  },

  populate_fields_with_errors: function(errors_by_field_name) {
    Monarch.Util.each(errors_by_field_name, function(field_name, errors) {
      this.field(field_name).validation_errors = errors;
    }.bind(this));
  },

  // private

  initialize_local_fields: function() {
    this.fields_by_column_name = {};
    Monarch.Util.each(this.record.table().columns_by_name, function(column_name, column) {
      this.fields_by_column_name[column_name] = new Monarch.Model.LocalField(this, column);
    }.bind(this));
  },

  connect_local_and_remote_fields: function() {
    Monarch.Util.each(this.fields_by_column_name, function(column_name, local_field) {
      var remote_field = this.remote_fieldset.field(column_name);
      local_field.remote_field(remote_field);
      remote_field.local_field(local_field);
    }.bind(this));
  }
});

})(Monarch);
