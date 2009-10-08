//= require "view/template"
//= require "view/builder"
//= require "view/jquery.monarch"
//= require "view/templates"
//= require "view/history"

module("Monarch.View", {
  build: function(content_fn) {
    return Monarch.View.Template.build(content_fn);
  }
});
