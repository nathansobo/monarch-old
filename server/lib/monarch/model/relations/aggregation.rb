module Model
  module Relations
    class Aggregation < Relation
      attr_reader :operand, :expressions

      def initialize(operand, expressions)
        @operand, @expressions = operand, expressions
      end

#      def columns
#        expressions
#      end

      def build_sql_query(query=SqlQuery.new)
        query.select_clause_columns = expressions
        operand.build_sql_query(query)
      end
    end
  end
end
