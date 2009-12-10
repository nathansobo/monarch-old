(function(Monarch) {

Monarch.constructor("Monarch.Http.UpdateCommand", Monarch.Http.Command, {
  initialize: function(record) {
    this.record = record;
    this.table_name = this.record.table().global_name;
    this.command_id = record.id();
    this.future = new Monarch.Http.RepositoryUpdateFuture();
  },

  wire_representation: function() {
    return ['update', this.table_name, this.command_id, this.record.local_fieldset.dirty_wire_representation()];
  },

  complete: function(field_values_from_server, requested_at) {
    this.record.remote_fieldset.update(field_values_from_server, requested_at);
  },

  handle_failure: function(errors_by_field_name) {
    if (errors_by_field_name) this.record.populate_fields_with_errors(errors_by_field_name);
    this.future.trigger_on_failure(this.record);
  }
});

})(Monarch);
