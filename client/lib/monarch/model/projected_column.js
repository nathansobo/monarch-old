constructor("Model.ProjectedColumn", {
  initialize: function(column, column_alias) {
    this.column = column;
    this.column_alias = column_alias;
  },

  name: function() {
    return this.column_alias || this.column.name;
  }
});
