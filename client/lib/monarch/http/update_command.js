(function(Monarch) {

Monarch.constructor("Monarch.Http.UpdateCommand", Monarch.Http.Command, {
  initialize: function(record, values_by_method_name) {
    this.record = record;
    this.table_name = this.record.table().global_name;
    this.command_id = record.id();
    this.values_by_method_name = values_by_method_name;
    this.future = new Monarch.Http.RepositoryUpdateFuture();
  },

  wire_representation: function() {
    this.record.start_pending_changes();
    this.record.local_update(this.values_by_method_name);
    this.pending_fieldset = this.record.active_fieldset;
    this.record.restore_primary_fieldset();
    return this.pending_fieldset.wire_representation();
  },

  complete: function(field_values_from_server) {
    this.pending_fieldset.update(field_values_from_server);
    this.pending_fieldset.commit();
  }
});

})(Monarch);
