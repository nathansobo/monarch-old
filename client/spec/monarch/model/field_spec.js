//= require "../../monarch_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("Model.Field", function() {
    use_local_fixtures();

    var record, field;
    before(function() {
      record = User.find('jan');
    });

    describe("#value(value)", function() {
      context("when the #column's type is 'datetime'", function() {
        before(function() {
          field = record.field('signed_up_at')
          expect(field.column.type).to(equal, 'datetime');
        });

        context("when a Date object is assigned", function() {
          it("assigns the Date object without converting it", function() {
            var date = new Date();
            field.value(date);
            expect(field.value()).to(equal, date);
          });
        });

        context("when an integer is assigned", function() {
          it("converts the integer to a Date object", function() {
            var date = new Date();
            var millis = date.getTime();
            field.value(millis);
            
            var value = field.value();
            expect(value instanceof Date).to(be_true);
            expect(field.value()).to(equal, date);
          });
        });
      });
    });

    describe("#wire_representation", function() {
      context("when the #column's type is 'datetime'", function() {
        it("returns the milliseconds integer for the Field's #value or null", function() {
          expect(field.value_wire_representation()).to(equal, field.value().getTime());
          field.value(null);
          expect(field.value_wire_representation()).to(equal, null);
        });
      });
    });
  });
}});
