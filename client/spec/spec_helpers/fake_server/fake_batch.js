Monarch.constructor("FakeServer.FakeBatch", {
  type: "batch",

  initialize: function(fake_server) {
    this.fake_server = fake_server;
    this.commands = {};
  },

  add_command: function(command) {
    if (!this.commands[command.table_name]) this.commands[command.table_name] = {};
    this.commands[command.table_name][command.command_id] = command;
  },

  find_update: function(record) {
    var commands_for_table = this.commands[record.table().global_name];
    if (!commands_for_table) return null;
    return commands_for_table[record.id()];
  },

  simulate_success: function(server_response) {
    if (!server_response) server_response = this.generate_fake_server_response_from_commands();

    Repository.pause_events();
    this.for_each_batched_command(function(table_name, command_id, command) {
      command.complete_and_trigger_before_events(server_response[table_name][command_id]);
    });
    Repository.resume_events()
    this.for_each_batched_command(function(command) {
      command.trigger_after_events();
    });

    this.fake_server.remove_request(this);
  },

  generate_fake_server_response_from_commands: function() {
    var fake_server_response = {};
    this.for_each_batched_command(function(table_name, command_id, command) {
      if (!fake_server_response[table_name]) fake_server_response[table_name] = {};
      fake_server_response[table_name][command_id] = command.response_wire_representation();
    })
    return fake_server_response;
  },

  for_each_batched_command: function(fn) {
    Monarch.Util.each(this.commands, function(table_name, commands_by_id) {
      Monarch.Util.each(commands_by_id, function(id, command) {
        if (fn.length == 3) {
          fn(table_name, id, command);
        } else {
          fn(command)
        }
      });
    });
  }
});
