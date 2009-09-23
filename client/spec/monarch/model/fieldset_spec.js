//= require "../../monarch_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("Model.Fieldset", function() {
    describe("#initialize(record)", function() {
      use_example_domain_model();
      
      it("instantiates a Field in #fields_by_column_name for each Column on the given Records's .table", function() {
        var record = new Blog();
        var fieldset = new Model.Fieldset(record);
        var name_field = fieldset.field('name');
        var user_id_field = fieldset.field('user_id');

        expect(name_field).to(be_an_instance_of, Model.Field);
        expect(name_field.fieldset).to(equal, fieldset);
        expect(name_field.column).to(equal, Blog.name);

        expect(user_id_field).to(be_an_instance_of, Model.Field);
        expect(user_id_field.fieldset).to(equal, fieldset);
        expect(user_id_field.column).to(equal, Blog.user_id);
      });
    });
  });
}});
