require File.expand_path("#{File.dirname(__FILE__)}/../../../monarch_spec_helper")

module Model
  module Relations
    describe InnerJoin do

      describe "class methods" do
        describe ".from_wire_representation" do
          it "builds an InnerJoin with its operands resolved in the given repository" do
            repository = UserRepository.new(User.find("jan"))
            representation = {
              "type" => "inner_join",
              "left_operand" => {
                "type" => "table",
                "name" => "blogs"
              },
              "right_operand" => {
                "type" => "table",
                "name" => "blog_posts"
              },
              "predicate" => {
                "type" => "eq",
                "left_operand" => {
                  "type" => "column",
                  "table" => "blogs",
                  "name" => "id"
                },
                "right_operand" => {
                  "type" => "column",
                  "table" => "blog_posts",
                  "name" => "blog_id"
                }
              }
            }

            join = InnerJoin.from_wire_representation(representation, repository)
            join.class.should == InnerJoin
            join.left_operand.should == repository.resolve_table_name(:blogs)
            join.right_operand.should == repository.resolve_table_name(:blog_posts)
            join.predicate.left_operand.should == Blog[:id]
            join.predicate.right_operand.should == BlogPost[:blog_id]
          end
        end
      end

      attr_reader :left_operand, :right_operand, :predicate, :join
      before do
        @left_operand = Blog.table
        @right_operand = BlogPost.table
        @predicate = Blog[:id].eq(BlogPost[:blog_id])
        @join = InnerJoin.new(left_operand, right_operand, predicate)
      end

      describe "#all" do
        it "instantiates a CompositeTuple for each of the all returned by the join" do
          composite_records = join.all
          composite_records.size.should == BlogPost.all.size

          composite_records.each do |composite_record|
            blog = composite_record[Blog]
            post = composite_record[BlogPost]
            post.blog.should == blog
          end
        end
      end

      describe "#to_sql" do
        it "generates a query" do
          join.to_sql.should == %{
            select distinct
              blogs.id as blogs__id,
              blogs.title as blogs__title,
              blogs.user_id as blogs__user_id,
              blog_posts.id as blog_posts__id,
              blog_posts.title as blog_posts__title,
              blog_posts.body as blog_posts__body,
              blog_posts.blog_id as blog_posts__blog_id,
              blog_posts.created_at as blog_posts__created_at,
              blog_posts.featured as blog_posts__featured
            from
              blogs, blog_posts
            where
              blogs.id = blog_posts.blog_id
          }.gsub(/[ \n]+/, " ").strip
        end
      end

      describe "#==" do
        it "structurally compares the receiver with the operand" do
          predicate_2 = Blog[:id].eq(BlogPost[:blog_id])
          join_2 = InnerJoin.new(left_operand, right_operand, predicate_2)
          join.should == join_2
        end
      end

      describe "event handling" do
        describe "propagation of operand events" do
          attr_reader :on_insert_calls, :on_update_calls, :on_remove_calls, :on_insert_subscription, :on_update_subscription, :on_remove_subscription
          before do
            @on_insert_calls = []
            @on_update_calls = []
            @on_remove_calls = []

            @on_insert_subscription = join.on_insert do |record|
              on_insert_calls.push(record)
            end
            @on_update_subscription = join.on_update do |record, changeset|
              on_update_calls.push([record, changeset])
            end
            @on_remove_subscription = join.on_remove do |record|
              on_remove_calls.push(record)
            end
          end

          describe "when a record is inserted into the left operand" do
            it "fires #on_insert events with all composite tuples that are now present in the join" do
              post_1 = BlogPost.create(:blog_id => "hotdogs")
              post_2 = BlogPost.create(:blog_id => "hotdogs")

              blog = Blog.unsafe_create(:id => "hotdogs")

              on_insert_calls.length.should == 2
              on_insert_calls[0][Blog].should == blog
              on_insert_calls[1][Blog].should == blog

              posts_from_insert_calls = on_insert_calls.map {|composite_tuple| composite_tuple[BlogPost]}
              posts_from_insert_calls.should include(post_1)
              posts_from_insert_calls.should include(post_2)

              on_update_calls.should be_empty
              on_remove_calls.should be_empty
            end
          end

          describe "when a record is inserted into the right operand" do
            it "fires #on_insert events with all composite tuples that are now present in the join" do
              blog_post = BlogPost.create(:blog_id => "grain")
              blog = Blog.find("grain")

              on_insert_calls.length.should == 1
              on_insert_calls.first[Blog].should == blog
              on_insert_calls.first[BlogPost].should == blog_post

              on_update_calls.should be_empty
              on_remove_calls.should be_empty
            end
          end

          describe "when a record in left operand is updated" do
            describe "when the update causes some composite tuples to become present in the join" do
              it "fires #on_insert events with all composite tuples that are now present in the join" do
                post_1 = BlogPost.create(:blog_id => "fun")
                post_2 = BlogPost.create(:blog_id => "fun")

                blog = Blog.unsafe_create(:id => "misery")
                blog.id = "fun"
                blog.save

                on_insert_calls.length.should == 2
                on_insert_calls.all? {|composite_tuple| composite_tuple[Blog] == blog }.should be_true
                Set.new(on_insert_calls.map {|composite_tuple| composite_tuple[BlogPost]}).should == Set.new([post_1, post_2])

                on_update_calls.should be_empty
                on_remove_calls.should be_empty
              end
            end

            describe "when the update causes some composite tuples to stop being present in the join" do
              it "fires #on_remove events with all composite tuples that were removed from the join" do
                blog = Blog.find("grain")
                grain_posts = blog.blog_posts
                blog.id = "crapola"
                blog.save

                on_insert_calls.should be_empty
                on_update_calls.should be_empty
                on_remove_calls.length.should == grain_posts.size
                on_remove_calls.all? {|composite_tuple| composite_tuple[Blog] == blog }.should be_true
                Set.new(on_remove_calls.map {|composite_tuple| composite_tuple[BlogPost]}).should == Set.new(grain_posts.all)
              end
            end

            describe "when the update causes some composite tuples that are already present to still be present in the join" do
              it "fires #on_update events with those composite tuples and the changeset" do
                blog = Blog.find("grain")
                grain_posts = blog.blog_posts
                blog.title = "Did you mean Barbie?"
                blog.save

                on_insert_calls.should be_empty

                on_update_calls.length.should == grain_posts.size
                on_update_calls.all? {|call| call[0][Blog] == blog && call[1].wire_representation == {"title" => "Did you mean Barbie?"}}.should be_true
                Set.new(on_update_calls.map {|call| call[0][BlogPost]}).should == Set.new(grain_posts.all)

                on_remove_calls.should be_empty
              end
            end

            describe "when the update causes some composite tuples to stop being present in the join and others to become present" do
              it "fires both #on_remove and #on_insert events" do
                post_1 = BlogPost.create(:blog_id => "fun")
                post_2 = BlogPost.create(:blog_id => "fun")

                blog = Blog.find("grain")
                grain_posts = blog.blog_posts
                blog.id = "fun"
                blog.save

                on_insert_calls.length.should == 2
                on_insert_calls.all? {|composite_tuple| composite_tuple[Blog] == blog }.should be_true
                Set.new(on_insert_calls.map {|composite_tuple| composite_tuple[BlogPost]}).should == Set.new([post_1, post_2])

                on_update_calls.should be_empty

                on_remove_calls.length.should == grain_posts.size
                on_remove_calls.all? {|composite_tuple| composite_tuple[Blog] == blog }.should be_true
                Set.new(on_remove_calls.map {|composite_tuple| composite_tuple[BlogPost]}).should == Set.new(grain_posts.all)
              end
            end
          end

          describe "when a record in right operand is updated" do
            describe "when the update causes some composite tuples to become present in the join" do
              it "fires #on_insert events with all composite tuples that are now present in the join" do
                post = BlogPost.create(:blog_id => "fun")
                blog = Blog.unsafe_create(:id => "misery")


                on_update_calls.should be_empty

                post.blog_id = "misery"
                post.save

                on_insert_calls.length.should == 1

                on_insert_calls.first[Blog].should == blog
                on_insert_calls.first[BlogPost].should == post

                on_update_calls.should be_empty
                on_remove_calls.should be_empty
              end
            end

            describe "when the update causes some composite tuples to stop being present in the join" do
              it "fires #on_remove events with all composite tuples that were removed from the join" do
                blog = Blog.find("grain")
                post = blog.blog_posts.first

                post.blog_id = "crapola"
                post.save

                on_insert_calls.should be_empty
                on_update_calls.should be_empty
                on_remove_calls.length.should == 1

                on_remove_calls.first[Blog].should == blog
                on_remove_calls.first[BlogPost].should == post
              end
            end
#
            describe "when the update causes some composite tuples that are already present to still be present in the join" do
              it "fires #on_update events with those composite tuples and the changeset" do
                blog = Blog.find("grain")
                post = blog.blog_posts.first
                post.body = "The sea lions have left the pier. Earthquake imminent?"
                post.save

                on_insert_calls.should be_empty

                on_update_calls.length.should == 1
                on_update_calls.first[0][Blog].should == blog
                on_update_calls.first[0][BlogPost].should == post
                on_update_calls.first[1].wire_representation.should == { 'body' => "The sea lions have left the pier. Earthquake imminent?" }


                on_remove_calls.should be_empty
              end
            end

            describe "when the update causes some composite tuples to stop being present in the join and others to become present" do
              it "fires both #on_remove and #on_insert events" do
                grain_blog = Blog.find("grain")
                vegetable_blog = Blog.find("vegetable")
                grain_post = grain_blog.blog_posts.first

                grain_post.blog_id = "vegetable"
                grain_post.save

                on_insert_calls.length.should == 1
                on_insert_calls.first[Blog].should == vegetable_blog
                on_insert_calls.first[BlogPost].should == grain_post

                on_update_calls.should be_empty

                on_remove_calls.length.should == 1
                on_remove_calls.first[Blog].should == grain_blog
                on_remove_calls.first[BlogPost].should == grain_post
              end
            end
          end

          describe "when a record is removed from the left operand" do
            it "fires #on_remove events with all composite tuples that were previously in the join" do
              grain_posts = BlogPost.where(BlogPost[:blog_id].eq("grain"))
              blog = Blog.find("grain")
              blog.destroy

              on_insert_calls.should be_empty
              on_update_calls.should be_empty

              on_remove_calls.length.should == grain_posts.size
              on_remove_calls.all? {|composite_tuple| composite_tuple[Blog] == blog}.should be_true
            end
          end

          describe "when a record is removed from the right operand" do
            it "fires #on_remove events with all composite tuples that were previously in the join" do
              blog = Blog.find("grain")
              blog_post = blog.blog_posts.first
              blog_post.destroy

              on_insert_calls.should be_empty
              on_update_calls.should be_empty

              on_remove_calls.length.should == 1
              on_remove_calls.first[Blog].should == blog
              on_remove_calls.first[BlogPost].should == blog_post
            end
          end
        end

        describe "subscription lifecycle" do
          it "subscribes to its operand the first time a subscription is made on the join and unsubscribes once the last subscription is destroyed" do
            subscription_1, subscription_2 = nil

            lambda do
              subscription_1 = join.on_insert { }
            end.should change {left_operand.num_subscriptions + right_operand.num_subscriptions}.by(6)

            lambda do
              subscription_2 = join.on_insert { }
            end.should_not change {left_operand.num_subscriptions + right_operand.num_subscriptions}

            lambda do
              subscription_1.destroy
            end.should_not change {left_operand.num_subscriptions + right_operand.num_subscriptions}

            lambda do
              subscription_2.destroy
            end.should change {left_operand.num_subscriptions + right_operand.num_subscriptions}.by(-6)
          end
        end
      end
    end
  end
end
