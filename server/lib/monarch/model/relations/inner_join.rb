module Model
  module Relations
    class InnerJoin < Relation
      class << self
        def from_wire_representation(representation, repository)
          left_operand = Relation.from_wire_representation(representation["left_operand"], repository)
          right_operand = Relation.from_wire_representation(representation["right_operand"], repository)
          predicate = Predicates::Predicate.from_wire_representation(representation["predicate"], repository)
          new(left_operand, right_operand, predicate)
        end
      end

      attr_reader :left_operand, :right_operand, :predicate
      def initialize(left_operand, right_operand, predicate)
        @left_operand, @right_operand, @predicate = left_operand, right_operand, predicate
      end

      def column(name)
        left_operand.column(name) || right_operand.column(name)
      end

      def joined_tables
        left_operand.joined_tables + right_operand.joined_tables
      end

      def record_class
        @record_class ||= Class.new(CompositeTuple)
        @record_class.joined_tables = joined_tables
        @record_class
      end

      def build_sql_query(query=SqlQuery.new)
        query.add_condition(predicate)
        left_operand.build_sql_query(query)
        right_operand.build_sql_query(query)
      end

      def build_record_from_database(field_values)
        record_class.new(field_values)
      end
    end
  end
end
