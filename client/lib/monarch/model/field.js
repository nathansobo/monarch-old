(function(Monarch) {

Monarch.constructor("Monarch.Model.Field", {
  on_remote_update: function(update_callback) {
    if (!this.on_remote_update_node) this.on_remote_update_node = new Monarch.SubscriptionNode();
    this.on_remote_update_node.subscribe(update_callback);
  }
});

})(Monarch);
