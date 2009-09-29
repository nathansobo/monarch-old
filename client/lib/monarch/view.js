//= require "view/template"
//= require "view/builder"
//= require "view/jquery.monarch"
//= require "view/templates"
//= require "view/history"

module("View", {
  build: function(content_fn) {
    return View.Template.build(content_fn);
  }
});
