require File.expand_path("#{File.dirname(__FILE__)}/../ce2_spec_helper")

module Relations
  describe Selection do

    describe "class methods" do
      describe ".from_wire_representation" do
        it "builds a Selection with an #operand resolved in the given subdomain" do
          subdomain = Group.find("dating")
          selection = Selection.from_wire_representation({
            "type" => "selection",
            "operand" => {
              "type" => "set",
              "name" => "answers"
            },
            "predicate" => {
              "type" => "eq",
              "left_operand" => {
                "type" => "attribute",
                "set" => "answers",
                "name" => "correct"
              },
              "right_operand" => {
                "type" => "scalar",
                "value" => true
              }
            }
          }, subdomain)

          selection.class.should == Relations::Selection
          selection.operand.should == subdomain.answers
          selection.predicate.class.should == Predicates::Eq
          selection.predicate.left_operand.should == Answer.correct
          selection.predicate.right_operand.should == true
        end
      end
    end

    describe "instance methods" do
      attr_reader :operand, :predicate, :selection, :predicate_2, :composite_selection
      before do
        @operand = Answer.set
        @predicate = Predicates::Eq.new(Answer.correct, false)
        @selection = Selection.new(operand, predicate)
        @predicate_2 = Predicates::Eq.new(Answer.body, "Barley")
        @composite_selection = Selection.new(selection, predicate_2)
      end

      describe "#tuples" do
        context "when #operand is a Set" do
          it "executes an appropriate SQL query against the database and returns Tuples corresponding to its results" do
            Answer.set.tuples.detect {|t| t.correct == true}.should_not be_nil
            tuples = selection.tuples
            tuples.should_not be_empty
            tuples.each do |tuple|
              tuple.correct.should be_false
            end
          end
        end

        context "when #operand is a Selection" do
          it "executes an appropriate SQL query against the database and returns Tuples corresponding to its results" do
            tuple = composite_selection.tuples.first
            tuple.should_not be_nil
            tuple.correct.should be_false
            tuple.body.should == 'Barley'
          end
        end
      end

      describe "#to_sql" do
        context "when #operand is a Set" do
          it "generates a query with an appropriate where clause" do
            selection.to_sql.should == "select #{operand.attributes.map {|a| a.to_sql}.join(", ")} from #{operand.global_name} where #{predicate.to_sql};"
          end
        end

        context "when #operand is another Selection" do
          it "generates a query with a where clause that has multiple conditions" do
            composite_selection.to_sql.should == "select #{operand.attributes.map {|a| a.to_sql}.join(", ")} from #{operand.global_name} where #{predicate_2.to_sql} and #{predicate.to_sql};"
          end
        end
      end
    end
  end
end