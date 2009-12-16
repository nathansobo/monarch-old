(function(Monarch) {

Monarch.constructor("Monarch.Model.Relations.InnerJoin", Monarch.Model.Relations.Relation, {

  initialize: function(left_operand, right_operand, predicate) {
    this.left_operand = left_operand;
    this.right_operand = right_operand;
    this.predicate = predicate;
    this.initialize_events_system();
  },

  all_tuples: function() {
    if (this._tuples) return this._tuples;

    var cp = this.cartesian_product();
    window.debug = true;

    return Monarch.Util.select(cp, function(composite_tuple) {
      return this.predicate.evaluate(composite_tuple);
    }.bind(this));
  },

  wire_representation: function() {
    return {
      type: "inner_join",
      left_operand: this.left_operand.wire_representation(),
      right_operand: this.left_operand.wire_representation(),
      predicate: this.predicate.wire_representation()
    };
  },

  // private

  cartesian_product: function() {
    var product = [];
    var self = this;
    Monarch.Util.each(self.left_operand.all_tuples(), function(left_tuple) {
      Monarch.Util.each(self.right_operand.all_tuples(), function(right_tuple) {
        product.push(new Monarch.Model.CompositeTuple(left_tuple, right_tuple));
      });
    })
    return product;
  },

//  evaluate_in_repository: function(repository) {
//    return new Monarch.Model.Relations.Selection(this.operand.evaluate_in_repository(repository), this.predicate);
//  },

//  primary_table: function() {
//    return this.operand.primary_table();
//  },

//  column: function(name) {
//    return this.operand.column(name);
//  },

  // private

  subscribe_to_operands: function() {
    var self = this;
  }
});

})(Monarch);
