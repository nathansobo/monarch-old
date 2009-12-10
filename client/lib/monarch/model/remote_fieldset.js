(function(Monarch) {

Monarch.constructor("Monarch.Model.RemoteFieldset", Monarch.Model.Fieldset, {
  initialize: function(record) {
    this.record = record;
    this.initialize_remote_fields();
    this.local = null;
    this.batch_update_in_progress = false;
  },

  update: function(field_values, requested_at) {
    if (!requested_at) requested_at = new Date();
    this.batched_updates = {};

    Monarch.Util.each(field_values, function(column_name, field_value) {
      this.field(column_name).value(field_value, requested_at);
    }.bind(this));

    var changeset = this.batched_updates;
    this.batched_updates = null;
    if (this.update_events_enabled && Monarch.Util.keys(changeset).length > 0) {
      if (this.record.after_update) this.record.after_update(changeset);
      if (this.record.on_update_node) this.record.on_update_node.publish(changeset);
      this.record.table().record_updated(this.record, changeset);
    }

    this.update_events_enabled = true;
  },

  field_updated: function(field, new_value, old_value) {
    var change_data = {};
    change_data[field.column.name] = {
      column: field.column,
      old_value: old_value,
      new_value: new_value
    };

    Monarch.Util.extend(this.batched_updates, change_data);
  },

  // private

  initialize_remote_fields: function() {
    var self = this;
    this.fields_by_column_name = {};
    Monarch.Util.each(this.record.table().columns_by_name, function(column_name, column) {
      this.fields_by_column_name[column_name] = new Monarch.Model.RemoteField(this, column);
      this.generate_field_accessor(column_name);
    }.bind(this));
  }
});

})(Monarch);
