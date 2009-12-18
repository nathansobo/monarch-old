(function(Monarch) {

//= require <jquery-1.3.2>
//= require <jquery.history>
//= require <jquery.cookie>
//= require <htmlescape>
//= require <underscore>
//= require <json>
//= require <md5>
//= require "monarch/language_extensions"
//= require "monarch/module_system"
//= require "monarch/util"
//= require "monarch/object"
//= require "monarch/subscription_node"
//= require "monarch/subscription"
//= require "monarch/subscription_bundle"
//= require "monarch/future"
//= require "monarch/queue"
//= require "monarch/inflection"
//= require "monarch/xml"
//= require "monarch/view"
//= require "monarch/http"
//= require "monarch/model"

Server = new Monarch.Http.Server();
Repository = new Monarch.Model.Repository();
History = new Monarch.View.History();

jQuery(function() {
  var client = new Monarch.Http.CometClient();
  client.connect();
});

})(Monarch);
