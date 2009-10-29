Monarch.constructor("FakeServer.FakeBatch", {
  type: "batch",

  initialize: function(fake_server) {
    this.fake_server = fake_server;
    this.mutations = {};
  },

  find_update: function(record) {
    var mutations_for_table = this.mutations[record.table().global_name];
    if (!mutations_for_table) return null;
    return mutations_for_table[record.id()];
  },

  add_mutation: function(mutation) {
    mutation.batch = this;
    if (!this.mutations[mutation.table_name]) this.mutations[mutation.table_name] = {};
    this.mutations[mutation.table_name][mutation.command_id] = mutation;
  },

  simulate_success: function(server_response) {
    var self = this;
    if (!server_response) server_response = this.generate_fake_server_response();

    Repository.pause_events();
    this.for_each_batched_mutation(function(table_name, command_id, mutation) {
      if (server_response[table_name][command_id] === undefined) throw new Error("No server response value provided for command: " + table_name + ", " + command_id);
      mutation.complete_and_trigger_before_events(server_response[table_name][command_id]);
    });
    Repository.resume_events()
    this.for_each_batched_mutation(function(table_name, command_id, mutation) {
      mutation.trigger_after_events();
      self.fake_server.remove_request(mutation);
    });

    this.fake_server.remove_request(this);
  },

  generate_fake_server_response: function() {
    var fake_server_response = {};
    this.for_each_batched_mutation(function(table_name, command_id, mutation) {
      if (!fake_server_response[table_name]) fake_server_response[table_name] = {};
      fake_server_response[table_name][command_id] = mutation.response_wire_representation();
    })
    return fake_server_response;
  },

  for_each_batched_mutation: function(fn) {
    Monarch.Util.each(this.mutations, function(table_name, mutations_by_command_id) {
      Monarch.Util.each(mutations_by_command_id, function(command_id, mutation) {
        fn(table_name, command_id, mutation);
      });
    });
  }
});
