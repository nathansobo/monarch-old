(function(Monarch) {

Monarch.constructor("Monarch.Http.CreateCommand", Monarch.Http.Command, {

  constructor_initialize: function() {
    this.command_id_counter = 0;
  },

  initialize: function(record) {
    this.record = record;
    this.table = record.table();
    this.table_name = this.table.global_name;
    this.field_values = record.dirty_wire_representation();
    this.command_id = "create_" + this.constructor.command_id_counter++;
    this.future = new Monarch.Http.RepositoryUpdateFuture();
  },

  wire_representation: function() {
    return ['create', this.table_name, this.record.dirty_wire_representation()];
  },

  complete: function(field_values_from_server) {
    this.record.finalize_local_create(field_values_from_server);
  },

  handle_failure: function(errors_by_field_name) {
    if (errors_by_field_name) this.record.populate_fields_with_errors(errors_by_field_name);
    this.future.trigger_on_failure(this.record);
  }
});

})(Monarch);
