(function(Monarch) {

Monarch.constructor("Monarch.Http.CreateCommand", Monarch.Http.Command, {
  initialize: function(table, field_values, command_id) {
    this.table = table;
    this.table_name = table.global_name;
    this.field_values = field_values;
    this.command_id = command_id;
    this.future = new Monarch.Http.RepositoryUpdateFuture();
  },

  wire_representation: function() {
    this.record = new this.table.record_constructor(this.field_values);
    return this.record.wire_representation();
  },

  complete: function(field_values_from_server) {
    this.record.local_update(field_values_from_server);
    this.table.insert(this.record);
  }
});

})(Monarch);
