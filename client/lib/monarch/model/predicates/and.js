(function(Monarch, jQuery) {

Monarch.constructor("Monarch.Model.Predicates.And", Monarch.Model.Predicates.Predicate, {
  initialize: function(operands) {
    this.operands = operands;
  },

  evaluate: function(record) {
    return Monarch.Util.all(this.operands, function(operand) {
      return operand.evaluate(record);
    });
  },

  wire_representation: function() {
    return {
      type: "and",
      operands: Monarch.Util.map(this.operands, function(operand) {
        return operand.wire_representation();
      })
    };
  }
});

})(Monarch, jQuery);
