//= require "../monarch_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("Inflection", function() {
    describe(".humanize", function() {
      it("breaks underscored or camelhumps words into space separated words", function() {
        expect(Inflection.humanize("fast_cars")).to(equal, "Fast Cars");
        expect(Inflection.humanize("FastCars")).to(equal, "Fast Cars");
      });
    });
  });
}});
