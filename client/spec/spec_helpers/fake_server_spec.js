//= require "../monarch_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("FakeServer", function() {
    use_example_domain_model();

    var fake_server;
    before(function() {
      fake_server = new FakeServer();
      fake_server.Repository.load_fixtures({
        users: {
          sharon: {
            full_name: "Sharon Ly"
          },
          stephanie: {
            full_name: "Stephanie Wambach"
          }
        },
        blogs: {
          guns: {
            name: "Guns, Ammo, and Me",
            user_id: "sharon"
          },
          aircraft: {
            name: "My Favorite Aircraft",
            user_id: "stephanie"
          }
        }
      });
    });

    describe("#fetch", function() {
      it("adds the a FakeFetch to a #fetches array, then executes the fetch against its fixture repository and triggers the returned future when #simulate_success is called on it", function() {
        var before_events_callback = mock_function("before delta events callback", function() {
          expect(User.find("sharon")).to_not(be_null);
          expect(insert_callback).to_not(have_been_called);
        });
        var insert_callback = mock_function("on insert callback");
        var after_events_callback = mock_function("after delta events callback", function() {
          expect(User.find("sharon")).to_not(be_null);
          expect(insert_callback).to(have_been_called, twice);
        });

        User.on_insert(insert_callback);


        expect(fake_server.fetches).to(be_empty);
        expect(User.find('sharon')).to(be_null);
        expect(Blog.find('guns')).to(be_null);

        Repository.origin_url = "/users/bob/sandbox"
        var future = fake_server.fetch([Blog.table, User.table]);

        future.before_events(before_events_callback);
        future.after_events(after_events_callback);

        expect(fake_server.fetches).to(have_length, 1);
        expect(User.find('sharon')).to(be_null);
        expect(Blog.find('guns')).to(be_null);

        fake_server.fetches.shift().simulate_success();

        expect(before_events_callback).to(have_been_called);
        expect(insert_callback).to(have_been_called);
        expect(after_events_callback).to(have_been_called);

        expect(User.find('sharon').full_name()).to(equal, 'Sharon Ly');
        expect(Blog.find('guns').user_id()).to(equal, 'sharon');
      });
    });

    describe("#simulate_fetch", function() {
      it("immediately fetches records from the FakeServer's repository to the local repository", function() {
        expect(Blog.records()).to(be_empty);
        fake_server.simulate_fetch([Blog.table]);
        expect(Blog.records()).to_not(be_empty);
      });
    });

    describe("mutation methods", function() {
      use_local_fixtures();


      describe("#create", function() {
        it("stores a fake create request for reference and creates a record when its success is simulated", function() {
          var insert_callback = mock_function("insert_callback");
          Blog.on_insert(insert_callback);

          var future = fake_server.create(Blog.table, {name: "King Crimson Songs I Like"});

          var before_events_callback = mock_function("before_events_callback", function(record) {
            expect(record.name()).to(equal, "King Crimson Songs I Like");
            expect(insert_callback).to_not(have_been_called);
          });

          var after_events_callback = mock_function("after_events_callback", function(record) {
            expect(record.name()).to(equal, "King Crimson Songs I Like");
            expect(insert_callback).to(have_been_called, with_args(record));
          });

          future
            .before_events(before_events_callback)
            .after_events(after_events_callback);

          expect(before_events_callback).to_not(have_been_called);
          expect(after_events_callback).to_not(have_been_called);

          expect(fake_server.creates.length).to(equal, 1);
          expect(fake_server.last_create).to(equal, fake_server.creates[0]);

          fake_server.last_create.simulate_success({
            user_id: "wil"
          });

          expect(fake_server.last_create).to(be_null);
          expect(fake_server.creates).to(be_empty);

          expect(before_events_callback).to(have_been_called);
          expect(after_events_callback).to(have_been_called);

          var record = Blog.find(Blog.name.eq("King Crimson Songs I Like"));
          expect(record.user_id()).to(equal, "wil");
        });

        it("maintains the 'creates' and 'last_create' values as request successes are simulated", function() {
          fake_server.create(Blog.table, {name: "Puff Daddy Songs I Moderately Dislike"});
          fake_server.create(Blog.table, {name: "Queen Songs I Used To Like"});
          fake_server.create(Blog.table, {name: "Slayer Songs My Death Metal Friend Likes"});

          expect(fake_server.creates.length).to(equal, 3);
          expect(fake_server.last_create === fake_server.creates[0]).to(be_false);
          fake_server.creates[0].simulate_success();
          expect(fake_server.last_create).to_not(be_null);
          expect(fake_server.creates.length).to(equal, 2);
          expect(fake_server.last_create === fake_server.creates[1]).to(be_true);

          fake_server.creates[1].simulate_success();
          expect(fake_server.last_create).to(equal, fake_server.creates[0]);
        });
      });

      describe("#update", function() {
        it("stores a fake update request for reference and updates the record when its success is simulated", function() {
          var update_callback = mock_function("update_callback");
          Blog.on_update(update_callback);

          var record = Blog.find("recipes");

          var future = fake_server.update(record, {name: "The Following Recipes Kinda Suck"});

          var before_events_callback = mock_function("before_events_callback", function(callback_record) {
            expect(callback_record).to(equal, record);
            expect(update_callback).to_not(have_been_called);
          });

          var after_events_callback = mock_function("after_events_callback", function(callback_record) {
            expect(callback_record).to(equal, record);
            expect(update_callback.most_recent_args[0] === record).to(be_true);
          });

          future
            .before_events(before_events_callback)
            .after_events(after_events_callback);

          expect(before_events_callback).to_not(have_been_called);
          expect(after_events_callback).to_not(have_been_called);
          expect(update_callback).to_not(have_been_called);

          expect(fake_server.updates.length).to(equal, 1);
          expect(fake_server.last_update).to(equal, fake_server.updates[0]);

          fake_server.last_update.simulate_success({
            name: "MOOO!"
          });
          expect(fake_server.last_update).to(be_null);
          expect(fake_server.updates).to(be_empty);

          expect(before_events_callback).to(have_been_called);
          expect(after_events_callback).to(have_been_called);

          expect(record.name()).to(equal, "MOOO!");
        });

        it("maintains the 'updates' and 'last_update' values as request successes are simulated", function() {
          var record = Blog.find("recipes");

          fake_server.update(record, {name: "Puff Daddy Songs I Moderately Dislike"});
          fake_server.update(record, {name: "Queen Songs I Used To Like"});
          fake_server.update(record, {name: "Slayer Songs My Death Metal Friend Likes"});

          expect(fake_server.updates.length).to(equal, 3);
          expect(fake_server.last_update === fake_server.updates[0]).to(be_false);
          fake_server.updates[0].simulate_success();
          expect(fake_server.last_update).to_not(be_null);
          expect(fake_server.updates.length).to(equal, 2);
          expect(fake_server.last_update === fake_server.updates[1]).to(be_true);

          fake_server.updates[1].simulate_success();
          expect(fake_server.last_update).to(equal, fake_server.updates[0]);
        });
      });

      describe("#destroy", function() {
        it("stores a fake destroy request for reference and destroys the record when its success is simulated", function() {
          var remove_callback = mock_function("remove_callback");
          Blog.on_remove(remove_callback);

          var record = Blog.find("recipes");

          var future = fake_server.destroy(record);

          var before_events_callback = mock_function("before_events_callback", function(callback_record) {
            expect(callback_record).to(equal, record);
            expect(remove_callback).to_not(have_been_called);
          });

          var after_events_callback = mock_function("after_events_callback", function(callback_record) {
            expect(callback_record).to(equal, record);
            expect(remove_callback.most_recent_args[0] === record).to(be_true);
          });

          future
            .before_events(before_events_callback)
            .after_events(after_events_callback);

          expect(before_events_callback).to_not(have_been_called);
          expect(after_events_callback).to_not(have_been_called);
          expect(remove_callback).to_not(have_been_called);

          expect(fake_server.destroys.length).to(equal, 1);
          expect(fake_server.last_destroy).to(equal, fake_server.destroys[0]);

          fake_server.last_destroy.simulate_success();
          expect(fake_server.last_destroy).to(be_null);
          expect(fake_server.destroys).to(be_empty);

          expect(before_events_callback).to(have_been_called);
          expect(after_events_callback).to(have_been_called);
        });

        it("maintains the 'destroys' and 'last_destroy' values as request successes are simulated", function() {
          var record_1 = User.find("jan");
          var record_2 = User.find("mike");
          var record_3 = User.find("wil");

          fake_server.destroy(record_1);
          fake_server.destroy(record_2);
          fake_server.destroy(record_3);

          expect(fake_server.destroys.length).to(equal, 3);
          expect(fake_server.last_destroy === fake_server.destroys[0]).to(be_false);
          fake_server.destroys[0].simulate_success();
          expect(fake_server.last_destroy).to_not(be_null);
          expect(fake_server.destroys.length).to(equal, 2);
          expect(fake_server.last_destroy === fake_server.destroys[1]).to(be_true);

          fake_server.destroys[1].simulate_success();
          expect(fake_server.last_destroy).to(equal, fake_server.destroys[0]);
        });
      });

      describe("#start_batch and #finish_batch", function() {

      });
    });

  });
}});
