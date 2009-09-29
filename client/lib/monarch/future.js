constructor("Future", {
  initialize: function() {
    this.on_complete_node = new SubscriptionNode();
  },

  on_complete: function(callback) {
    if (this.completed) {
      callback(this.value)
    } else {
      return this.on_complete_node.subscribe(callback);
    }
  },

  complete: function(value) {
    this.completed = true;
    this.value = value;
    this.on_complete_node.publish(value);
  }
});
