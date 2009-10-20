module Model
  module Relations
    class Projection < Relations::Relation

      attr_reader :operand, :projected_columns_by_name
      delegate :joined_tables, :to => :operand

      def initialize(operand, columns, &block)
        @operand, @columns = operand, columns
        @projected_columns_by_name = ActiveSupport::OrderedHash.new
        columns.each do |projected_column|
          projected_columns_by_name[projected_column.name] = projected_column
        end
        class_eval(&block) if block
      end

      def columns
        projected_columns_by_name.values
      end

      def column(column_or_name)
        case column_or_name
        when String, Symbol
          projected_columns_by_name[column_or_name]
        when ProjectedColumn
          column_or_name
        end
      end
      
      def record_class
        return @record_class if @record_class
        @record_class = Class.new(Tuple)
        @record_class.relation = self
        @record_class
      end

      def build_sql_query(sql_query=SqlQuery.new)
        sql_query.select_clause_columns = columns
        operand.build_sql_query(sql_query)
      end

      def build_record_from_database(field_values)
        record_class.new(field_values)
      end
    end
  end
end
