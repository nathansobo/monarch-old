(function(Monarch) {

Monarch.constructor("Monarch.Model.SyntheticField", Monarch.Model.Field, {
  initialize: function(record, column, signal) {
    this.record = record;
    this.signal = signal;
    this.column = column;
    this.on_update_node = new Monarch.SubscriptionNode();

    this.signal.on_remote_update(function(new_value, old_value) {
      this.record.remote_fieldset.field_updated(this, new_value, old_value);
      if (this.record.remote_fieldset.update_events_enabled) this.on_update_node.publish(this, new_value, old_value)
    }.bind(this));
  },

  value: function(value) {
    if (arguments.length == 0) {
      return this.signal.local_value();
    } else if (this.column.setter) {
      this.column.setter.call(this.record, value);
    } else {
      throw new Error("No setter method defined on the synthetic column " + this.column.name);
    }
  }
});

})(Monarch);
