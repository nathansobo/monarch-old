require File.expand_path("#{File.dirname(__FILE__)}/../../../monarch_spec_helper")

module Model
  module Relations
    describe Union do
      attr_reader :operand_1, :operand_2

      def union
        return @union if @union
        @operand_1 = BlogPost.where(BlogPost[:blog_id].eq("grain"))
        @operand_2 = BlogPost.where(BlogPost[:blog_id].eq("vegetable"))
        @union = Union.new([operand_1, operand_2])
      end

      describe "#all" do
        it "returns the results of executing the union query" do
           Set.new(union.all).should == Set.new(operand_1.all | operand_2.all)
        end
      end

      describe "#to_sql" do
        it "generates the union of sql queries corresponding to the operands" do
          union.to_sql.should == "#{operand_1.to_sql} union #{operand_2.to_sql}"
        end

        context "if the union is nested within a larger query" do
          it "pushes the operations that are above the union in the relation tree into the union's subqueries for performance" do
            Blog.join_to(union).where(Blog[:user_id].eq("jan")).project(BlogPost).to_sql.should == %{
              select distinct
                blog_posts.id as id,
                blog_posts.title as title,
                blog_posts.body as body,
                blog_posts.blog_id as blog_id,
                blog_posts.created_at as created_at,
                blog_posts.featured as featured
              from
                blogs, blog_posts
              where
                blogs.user_id = \"jan\"
                and blogs.id = blog_posts.blog_id
                and blog_posts.blog_id = \"grain\"
              union
              select distinct
                blog_posts.id as id,
                blog_posts.title as title,
                blog_posts.body as body,
                blog_posts.blog_id as blog_id,
                blog_posts.created_at as created_at,
                blog_posts.featured as featured
              from
                blogs, blog_posts
              where
                blogs.user_id = \"jan\"
                and blogs.id = blog_posts.blog_id
                and blog_posts.blog_id = \"vegetable\"
            }.gsub(/\s+/, " ").strip
          end
        end
      end

      describe "event handling" do
        describe "propagation of operand events" do
          attr_reader :grain_blog, :vegetable_blog, :union, :on_insert_calls, :on_update_calls, :on_remove_calls,
                      :on_insert_subscription, :on_update_subscription, :on_remove_subscription

          before do
            @grain_blog = Blog.find('grain')
            @vegetable_blog = Blog.find('vegetable')
            @operand_1 = grain_blog.blog_posts.project(BlogPost[:title], BlogPost[:body])
            @operand_2 = vegetable_blog.blog_posts.project(BlogPost[:title], BlogPost[:body])
            @union = Union.new([operand_1, operand_2])

            @on_insert_calls = []
            @on_update_calls = []
            @on_remove_calls = []

            @on_insert_subscription = union.on_insert do |record|
              on_insert_calls.push(record)
            end
            @on_update_subscription = union.on_update do |record, changeset|
              on_update_calls.push([record, changeset])
            end
            @on_remove_subscription = union.on_remove do |record|
              on_remove_calls.push(record)
            end
          end

          after do
            on_insert_subscription.destroy
            on_update_subscription.destroy
            on_remove_subscription.destroy
          end

          describe "when a tuple is inserted into an operand" do
            it "triggers #on_insert events if there are not already matching tuples in any of the union's operands" do
              grain_blog.blog_posts.create(:title => "Hash rocket", :body => "The macro don't work")

              projected_tuple = operand_1.find(BlogPost[:title].eq("Hash rocket"))
              on_insert_calls.should == [projected_tuple]

              grain_blog.blog_posts.create(:title => "Hash rocket", :body => "The macro don't work")
              on_insert_calls.length.should == 1

              vegetable_blog.blog_posts.create(:title => "Hash rocket", :body => "The macro don't work")
              on_insert_calls.length.should == 1

              vegetable_blog.blog_posts.create(:title => "Hash rocket", :body => "Slightly different")
              on_insert_calls.length.should == 2

              on_update_calls.should be_empty
              on_remove_calls.should be_empty
            end
          end
        end
      end
    end
  end
end
