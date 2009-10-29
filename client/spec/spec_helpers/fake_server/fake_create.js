Monarch.constructor("FakeServer.FakeCreate", {
  type: "create",
  
  constructor_initialize: function() {
    this.id_counter = 1;
  },

  initialize: function(url, relation, field_values, fake_server) {
    this.url = url;
    this.relation = relation;
    this.field_values = field_values;
    this.future = new Monarch.Http.RepositoryUpdateFuture();
    this.fake_server = fake_server;
  },

  simulate_success: function(server_field_values) {
    var self = this;
    if (!server_field_values) server_field_values = {};
    var field_values = jQuery.extend({}, this.field_values, {id: (this.constructor.id_counter++).toString()}, server_field_values);
    var new_record = new this.relation.record_constructor(field_values);

    this.relation.insert(new_record, {
      before_events: function() { self.future.trigger_before_events(new_record); },
      after_events: function() { self.future.trigger_after_events(new_record); }
    });
    this.record = new_record;

    this.fake_server.remove_request(this);
  }
});
