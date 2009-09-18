constructor("Model.Relations.Relation", {
  has_operands: true,

  initialize_events_system: function() {
    this.on_insert_node = new SubscriptionNode();
    this.on_remove_node = new SubscriptionNode();
    this.on_update_node = new SubscriptionNode();
    if (this.has_operands) {
      this.operands_subscription_bundle = new SubscriptionBundle();
      this.unsubscribe_from_operands_when_this_relation_no_longer_has_subscribers();
    }
  },

  where: function(predicate) {
    return new Model.Relations.Selection(this, predicate);
  },

  each: function(fn) {
    Util.each(this.all(), fn);
  },

  is_empty: function() {
    return this.all().length == 0;
  },

  first: function() {
    return this.all()[0];
  },
  
  on_insert: function(on_insert_callback) {
    this.subscribe_to_operands_if_needed();
    return this.on_insert_node.subscribe(on_insert_callback);
  },

  on_remove: function(on_remove_callback) {
    this.subscribe_to_operands_if_needed();
    return this.on_remove_node.subscribe(on_remove_callback);
  },

  on_update: function(on_update_callback) {
    this.subscribe_to_operands_if_needed();
    return this.on_update_node.subscribe(on_update_callback);
  },

  has_subscribers: function() {
    return !(this.on_insert_node.is_empty() && this.on_remove_node.is_empty() && this.on_update_node.is_empty());
  },

  fetch: function() {
    return Repository.fetch([this]);
  },

  memoize_records: function() {
    this.records = this.all();
  },

  record_inserted: function(record) {
    this.records.push(record)
    this.on_insert_node.publish(record);
  },

  record_removed: function(record) {
    Util.remove(this.records, record);
    this.on_remove_node.publish(record);
  },

  record_updated: function(record, update_data) {
    this.on_update_node.publish(record, update_data);
  },

  contains: function(record) {
    var records = this.all();
    for(var i = 0; i < records.length; i++) {
      if (records[i] == record) return true;
    }
    return false;
  },

  subscribe_to_operands_if_needed: function() {
    if (this.has_operands && !this.has_subscribers()) this.subscribe_to_operands();
  },

  unsubscribe_from_operands_when_this_relation_no_longer_has_subscribers: function() {
    var self = this;
    var unsubscribe_callback = function() {
       if (!self.has_subscribers()) self.unsubscribe_from_operands();
    };

    this.on_insert_node.on_unsubscribe(unsubscribe_callback);
    this.on_remove_node.on_unsubscribe(unsubscribe_callback);
    this.on_update_node.on_unsubscribe(unsubscribe_callback);
  },

  unsubscribe_from_operands: function() {
    this.operands_subscription_bundle.destroy_all();
    this.records = null;
  }
});
