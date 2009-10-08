//= require "xmpp/builder" 
//= require "xmpp/template" 

module("Monarch.Xmpp", {
  build: function(content_fn) {
    return Monarch.Xmpp.Template.build(content_fn);
  }
});
