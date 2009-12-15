(function(Monarch) {

Monarch.constructor("Monarch.Model.ConcreteField", Monarch.Model.Field, {
  on_update: function(update_callback) {
    if (!this.on_update_node) this.on_update_node = new Monarch.SubscriptionNode();
    this.on_update_node.subscribe(update_callback);
  },

  // protected

  value_equals: function(value) {
    if (this.column.type == "datetime" && this._value && value) {
      return this._value.getTime() == value.getTime();
    }
    return this._value == value;
  }
});

})(Monarch);
