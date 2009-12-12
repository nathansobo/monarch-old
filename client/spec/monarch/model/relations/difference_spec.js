//= require "../../../monarch_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("Monarch.Model.Relations.Difference", function() {
    use_local_fixtures();

    describe("#records", function() {
      var left_operand, right_operand, difference;
      before(function() {
        left_operand = User.table;
        right_operand = User.where(User.age.eq(28));
        expect(left_operand.records()).to_not(be_empty);
        expect(right_operand.records()).to_not(be_empty);

        difference = new Monarch.Model.Relations.Difference(left_operand, right_operand);
      });

      it("returns the records in the left operand which do not correspond to records with the same id in the right operand", function() {
        var difference_records = difference.records();

        expect(difference_records).to_not(be_empty);
        expect(difference_records.length).to(equal, left_operand.size() - right_operand.size());

        Monarch.Util.each(difference_records, function(record) {
          expect(right_operand.find(record.id())).to(be_null);
        });
      });
    });

    describe("event handling", function() {
      use_fake_server();

      var table_1, table_2, difference, record, insert_callback, update_callback, remove_callback;
      init(function() {
        left_operand = Blog.table;
        right_operand = Blog.table;
      });

      before(function() {
        difference = new Monarch.Model.Relations.Difference(left_operand, right_operand);

        insert_callback = mock_function("insert_callback");
        update_callback = mock_function("update_callback");
        remove_callback = mock_function("remove_callback");
        difference.on_insert(insert_callback);
        difference.on_update(update_callback);
        difference.on_remove(remove_callback);
      });

      function expect_no_callbacks_to_have_been_called() {
        expect(insert_callback).to_not(have_been_called);
        expect(update_callback).to_not(have_been_called);
        expect(remove_callback).to_not(have_been_called);
      }

      describe("when a record is inserted in the left operand", function() {
        context("if the record is not present in the right operand", function() {
          init(function() {
            right_operand = Blog.where({user_id: "jim"});
          });

          it("triggers insert callbacks with the record", function() {
            left_operand.create({user_id: "johan"})
              .after_events(function(record) {
                expect(insert_callback).to(have_been_called, with_args(record));
              });
          });
        });

        context("if the record is present in the right operand", function() {
          it("does not trigger any callbacks", function() {
            left_operand.create({});
            expect_no_callbacks_to_have_been_called();
          });
        });
      });

      describe("when a record is inserted in the right operand", function() {
        context("if the record is not present in the left operand", function() {
          init(function() {
            left_operand = Blog.where({user_id: "jim"});
          });

          it("does not trigger any callbacks", function() {
            right_operand.create({user_id: "johan"});
            expect_no_callbacks_to_have_been_called();
          });
        });

        context("if the record is present in the left operand", function() {
          init(function() {
            right_operand = Blog.where({user_id: "jim"});
          });

          it("triggers remove callbacks with the record", function() {
            left_operand.create({user_id: "willy"})
              .after_events(function(record) {
                record.update({user_id: "jim"})
                  .after_events(function() {
                    expect(remove_callback).to(have_been_called, with_args(record));
                  });
              });
          });
        });
      });

      describe("when a record is updated in the left operand", function() {
        context("if the record is not present in the right operand", function() {
          init(function() {
            right_operand = Blog.where({user_id: 'jim'});
          });

          it("triggers update callbacks with the record", function() {
            var record = left_operand.find('recipes');
            var user_id_before_update = record.user_id();
            record.update({user_id: "bingcrosby"});
            expect(update_callback).to(have_been_called, with_args(record, {user_id: {column: Blog.user_id, old_value: user_id_before_update, new_value: "bingcrosby" }}));
          });
        });

        context("if the record is present in the right operand", function() {
          it("does not trigger any callbacks", function() {
            var record = Blog.find('recipes');
            record.update({user_id: "mojo"});
            expect_no_callbacks_to_have_been_called();
          });
        });
      });

      describe("when a record is removed from the left operand", function() {
        context("if the record is not present in the right operand", function() {
          init(function() {
            right_operand = Blog.where({user_id: 'jim'});
          });

          it("triggers remove callbacks with the record", function() {
            var record = Blog.find('recipes');
            record.destroy();
            expect(remove_callback).to(have_been_called, with_args(record));
          });
        });

        context("if the record is present in the right operand", function() {
          it("does not trigger any callbacks", function() {
            var record = Blog.find('recipes');
            record.destroy();
            expect_no_callbacks_to_have_been_called();
          });
        });
      });

      describe("when a record is removed from the right operand", function() {
        context("if the record is not present in the left operand", function() {
          init(function() {
            left_operand = Blog.where({user_id: 'jim'});
          });

          it("does not trigger any callbacks", function() {
            var record = Blog.find('recipes');
            record.destroy();
            expect_no_callbacks_to_have_been_called();
          });
        });

        context("if the record is present in the left operand", function() {
          init(function() {
            right_operand = Blog.where({user_id: 'jan'});
          });

          it("triggers insert callbacks with the record", function() {
            var record = Blog.find({user_id: 'jan'});
            record.update({user_id: 'jonah'})
            expect(insert_callback).to(have_been_called, with_args(record));
          });
        });
      });
    });
  });
}});
