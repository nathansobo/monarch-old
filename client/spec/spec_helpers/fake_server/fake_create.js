Monarch.constructor("FakeServer.FakeCreate", {
  type: "create",
  
  constructor_initialize: function() {
    this.id_counter = 1;
  },

  initialize: function(url, table, field_values, fake_server) {
    this.url = url;
    this.fake_server = fake_server;
    this.command = new Monarch.Http.CreateCommand(table, field_values, "create_" + this.constructor.id_counter++);
    this.table_name = this.command.table_name;
    this.command_id = this.command.command_id;
    this.future = this.command.future;
  },

  complete_and_trigger_before_events: function(field_values) {
    this.command.complete_and_trigger_before_events(field_values);
  },

  trigger_after_events: function() {
    this.command.trigger_after_events();
  },

  wire_representation: function() {
    return this.command.wire_representation();
  },

  simulate_success: function(server_field_values) {
    var batch_response = {};
    batch_response[this.command.table_name] = {};

    batch_response[this.command.table_name][this.command.command_id] = server_field_values || this.wire_representation();
    this.fake_server.last_batch.simulate_success(batch_response);
    this.fake_server.remove_request(this);
  }
});
