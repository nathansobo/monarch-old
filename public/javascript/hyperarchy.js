//= require <jquery-1.3.2>
//= require <htmlescape>
//= require <june>
//= require "lib/module_system"
//= require "lib/util"
//= require "lib/view"
//= require "app/models"
//= require "app/views"

$(function() {
  $("#placeholder").replaceWith(Views.Application.to_view());
});