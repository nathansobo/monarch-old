//= require "../../../monarch_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("Monarch.Model.Relations.Difference", function() {
    use_local_fixtures();
    
    var left_operand, right_operand, difference;
    before(function() {
      left_operand = User.table;
      right_operand = User.where(User.age.eq(28));
      expect(left_operand.records()).to_not(be_empty);
      expect(right_operand.records()).to_not(be_empty);

      difference = new Monarch.Model.Relations.Difference(left_operand, right_operand);
    });


    describe("#records", function() {
      it("returns the records in the left operand which do not correspond to records with the same id in the right operand", function() {
        var difference_records = difference.records();

        expect(difference_records).to_not(be_empty);
        expect(difference_records.length).to(equal, left_operand.size() - right_operand.size());

        Util.each(difference_records, function(record) {
          expect(right_operand.find(record.id())).to(be_null);
        });
      });
    });
  });
}});
