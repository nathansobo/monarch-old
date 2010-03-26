module Model
  module Expressions
    class AliasedColumn < ConcreteColumn
      attr_reader :column, :column_alias
      delegate :convert_value_for_storage, :convert_value_for_wire, :to_sql, :to => :column

      def initialize(column, column_alias)
        @column, @column_alias = column, column_alias
      end

      def derive(relation)
        DerivedColumn.new(relation, column, column_alias)
      end

      def eq(right_operand)
        Expressions::Eq.new(self, right_operand)
      end

      def name
        column_alias || column.name
      end

      def to_select_clause_sql
        "#{column.to_sql} as #{name}"
      end

      def sql_derived_column(table_ref)
        Sql::DerivedColumn.new(table_ref, column.sql_expression, name)
      end

      def ==(other)
        return false unless other.instance_of?(self.class)
        column == other.column && column_alias == other.column_alias
      end
    end
  end
end
