constructor("Monarch.Model.Relations.Projection", Monarch.Model.Relations.Relation, {
  initialize: function(operand, projected_columns) {
    var self = this;
    this.operand = operand;
    this.projected_columns_by_name = {};
    Util.each(projected_columns, function(projected_column) {
      self.projected_columns_by_name[projected_column.name()] = projected_column;
    });

    this.record_constructor = ModuleSystem.constructor(Monarch.Model.ProjectionRecord);

    this.record_constructor.projected_columns_by_name = this.projected_columns_by_name;
    this.record_constructor.initialize_field_readers();
  },

  records: function() {
    var record_constructor = this.record_constructor;
    return this.operand.map(function(operand_record) {
      return new record_constructor(operand_record);
    });
  },

  column: function(name) {
    return this.projected_columns_by_name[name];
  }
});
