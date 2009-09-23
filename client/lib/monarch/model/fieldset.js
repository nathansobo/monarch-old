constructor("Model.Fieldset", {
  initialize: function(record) {
    if (!record) return;

    this.record = record;
    this.fields_by_column_name = {};
    var table = this.record.constructor.table;
    for (var column_name in table.columns_by_name) {
      this.fields_by_column_name[column_name] = new Model.Field(this, table.columns_by_name[column_name]);
    }
    this.enable_update_events();
  },

  clone_pending_fieldset: function() {
    var pending_fieldset = new Model.Fieldset();
    pending_fieldset.record = this.record;
    pending_fieldset.fields_by_column_name = {};
    for (var column_name in this.fields_by_column_name) {
      pending_fieldset.fields_by_column_name[column_name] = this.fields_by_column_name[column_name].clone_pending_field(pending_fieldset);
    }
    return pending_fieldset;
  },


  disable_update_events: function() {
    this.update_events_enabled = false;
  },

  enable_update_events: function() {
    this.update_events_enabled = true;
  },

  begin_batch_update: function() {
    this.batched_updates = {};
  },

  finish_batch_update: function() {
    var batched_updates = this.batched_updates;
    this.batched_updates = null;

    if (Util.keys(batched_updates).length > 0) {
      this.record.table().record_updated(this.record, batched_updates);
    }
  },

  field_updated: function(field, old_value, new_value) {
    if (!this.update_events_enabled) return;

    var change_data = {};
    change_data[field.column.name] = {
      column: field.column,
      old_value: old_value,
      new_value: new_value
    };

    if (this.batched_updates) {
      jQuery.extend(this.batched_updates, change_data);
    } else {
      this.record.table().record_updated(this.record, change_data);
    }
  },

  wire_representation: function() {
    var wire_representation = {};
    Util.each(this.fields_by_column_name, function(column_name, field) {
      wire_representation[column_name] = field.value();
    });
    return wire_representation;
  },

  field: function(column) {
    if (typeof column == 'string') {
      return this.fields_by_column_name[column];
    } else {
      return this.fields_by_column_name[column.name];
    }
  }
});
