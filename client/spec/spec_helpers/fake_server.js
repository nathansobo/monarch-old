//= require "fake_server/fake_server"
//= require "fake_server/fake_batch"
//= require "fake_server/fake_update"

Screw.Unit(function(c) {
  c.use_fake_server = function() {
    var original_server;

    c.init(function() {
      original_server = Server;
      Server = new FakeServer();
    });

    c.after(function() {
      Server = original_server;
    })
  };
});
