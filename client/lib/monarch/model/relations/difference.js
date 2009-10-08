constructor("Monarch.Model.Relations.Difference", Monarch.Model.Relations.Relation, {
  initialize: function(left_operand, right_operand) {
    this.left_operand = left_operand;
    this.right_operand = right_operand;
  },

  records: function() {
    var self = this;
    var records = [];
    this.left_operand.each(function(record) {
      if (!self.right_operand.find(record.id())) records.push(record);
    });
    return records;
  }
});
