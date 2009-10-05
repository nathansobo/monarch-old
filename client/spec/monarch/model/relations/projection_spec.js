//= require "../../../monarch_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("Model.Relations.Projection", function() {
    use_local_fixtures();
    
    var operand, projected_columns, projection;
    before(function() {
      operand = Blog.table;
      projected_columns = [new Model.ProjectedColumn(Blog.user_id), Blog.name.as('blog_name')];
      projection = new Model.Relations.Projection(operand, projected_columns);
    });


    describe("#records", function() {
      it("returns ProjectedRecords with fields corresponding only to the #projected_columns", function() {
        var projection_records = projection.records();
        var operand_records = operand.records();

        expect(projection_records).to_not(be_empty);
        expect(projection_records.length).to(equal, operand_records.length);

        Util.each(operand.records(), function(operand_record, index) {
          var projection_record = projection_records[index];
          expect(projection_record.user_id()).to(equal, operand_record.user_id());
          expect(projection_record.field(projection.column('blog_name')).value()).to(equal, operand_record.name());
          expect(projection_record.field('blog_name').value()).to(equal, operand_record.name());
          expect(projection_record.started_at).to(be_null);
        });
      });
    });
  });
}});
