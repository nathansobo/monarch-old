Monarch.constructor("FakeServer.FakeUpdate", {
  initialize: function(record, values_by_method_name) {
    this.record = record;
    this.record.start_pending_changes();
    this.record.local_update(values_by_method_name);
    this.pending_fieldset = this.record.active_fieldset;
    this.record.restore_primary_fieldset();
    this.field_values = this.pending_fieldset.wire_representation();
  },

  add_to_batch_commands: function(commands) {
    var table_name = this.record.table().global_name;
    if (!commands[table_name]) commands[table_name] = {};
    commands[table_name][this.record.id()] = this;
  }
});
