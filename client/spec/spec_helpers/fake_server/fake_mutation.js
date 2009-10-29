Monarch.constructor("FakeServer.FakeMutation", {
  constructor_initialize: function() {
    this.id_counter = 1;
  },

  initialize: function(url, command, fake_server) {
    this.url = url;
    this.fake_server = fake_server;
    this.command = command;

    this.table = command.table;
    this.record = command.record;
    this.field_values = command.wire_representation();

    this.type = Monarch.Inflection.underscore(command.constructor.basename).split("_")[0];
    this.table_name = command.table_name;
    this.command_id = command.command_id;
    this.future = command.future;
  },

  complete_and_trigger_before_events: function(field_values) {
    this.command.complete_and_trigger_before_events(field_values);
  },

  trigger_after_events: function() {
    this.command.trigger_after_events();
  },

  response_wire_representation: function() {
    var wire_representation = this.command.wire_representation();
    if (this.type == "create" && !wire_representation.id) {
      wire_representation.id = (this.constructor.id_counter++).toString();
    }
    return wire_representation;
  },

  simulate_success: function(fake_response_wire_representation) {
    var batch_response = {};
    batch_response[this.command.table_name] = {};
    batch_response[this.command.table_name][this.command.command_id] = fake_response_wire_representation || this.response_wire_representation();
    this.fake_server.last_batch.simulate_success(batch_response);
    this.fake_server.remove_request(this);
  }
});
