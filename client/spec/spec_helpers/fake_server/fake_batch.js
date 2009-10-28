Monarch.constructor("FakeServer.FakeBatch", {
  initialize: function() {
    this.commands = {};
  },

  add_command: function(command) {
    command.add_to_batch_commands(this.commands);
  },

  find_update: function(record) {
    var commands_for_table = this.commands[record.table().global_name];
    if (!commands_for_table) return null;
    return commands_for_table[record.id()];
  }

});
