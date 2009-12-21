//= require <monarch>
//= require "spec_helpers/fake_server"
//= require "spec_helpers/example_domain_model"
//= require "spec_helpers/fixtures"

Screw.Unit(function(c) {
  c.init(function() {
    c.use_fake_server();
  });
});
