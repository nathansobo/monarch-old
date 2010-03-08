Monarch.constructor("FakeServer.FakeSubscribe", {
  type: "subscribe",

  constructorInitialize: function() {
    this.idCounter = 1;
  },

  initialize: function(url, relations, fakeServer) {
    this.url = url;
    this.relations = relations;
    this.fakeServer = fakeServer;
    this.future = new Monarch.Http.AjaxFuture();
  },

  simulateSuccess: function() {
    this.future.triggerSuccess(Monarch.Util.map(this.relations, function(relation) {
      return new Monarch.Http.RemoteSubscription("fakeSubscription" + this.constructor.idCounter++, relation);
    }));
    this.fakeServer.removeRequest(this);
  }
});