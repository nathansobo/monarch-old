Monarch.constructor("FakeServer.FakeDestroy", {
  type: "destroy",

  initialize: function(url, record, fake_server) {
    this.url = url;
    this.record = record;
    this.fake_server = fake_server;
    this.future = new Monarch.Http.RepositoryUpdateFuture();
  },

  simulate_success: function() {
    var self = this;
    this.record.table().remove(this.record, {
      before_events: function() { self.future.trigger_before_events(self.record); },
      after_events: function() { self.future.trigger_after_events(self.record); }
    });
    this.fake_server.remove_request(this);
  }
});
