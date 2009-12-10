(function(Monarch) {

Monarch.constructor("Monarch.Http.Command", {
  complete_and_trigger_before_events: function(field_values_from_server) {
    this.complete(field_values_from_server);
    this.future.trigger_before_events(this.record);
  },

  trigger_before_events: function() {
    this.future.trigger_before_events(this.record);
  },

  trigger_after_events: function() {
    this.future.trigger_after_events(this.record);
  }
});

})(Monarch);
