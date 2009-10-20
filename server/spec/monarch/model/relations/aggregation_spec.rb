require File.expand_path("#{File.dirname(__FILE__)}/../../../monarch_spec_helper")

module Model
  module Relations
    describe Aggregation do
      attr_reader :operand, :expressions, :aggregation
      before do
        @operand = User.table
        @expressions = [AggregationExpression.new("sum", User[:age]), AggregationExpression.new("max", User[:signed_up_at]).as("max_signed_up_at")]
        @aggregation = Aggregation.new(operand, expressions)
      end

      describe "#to_sql" do
        it "returns sql with the appropriate aggregation functions in the select clause" do
          aggregation.to_sql.should == "select sum(users.age), max(users.signed_up_at) as max_signed_up_at from users"
        end
      end
    end
  end
end
