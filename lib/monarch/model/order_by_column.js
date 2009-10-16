(function(Monarch) {

Monarch.constructor("Monarch.Model.OrderByColumn", {
  initialize: function(column, direction) {
    this.column = column;
    this.direction = direction;
    this.direction_coefficient = (direction == "desc") ? -1 : 1; 
  }
});

})(Monarch);
