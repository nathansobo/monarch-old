module Model
  module Relations
    class Projection < Relations::Relation

      attr_reader :operand, :concrete_columns_by_name
      delegate :tables, :to => :operand

      def initialize(operand, concrete_columns, &block)
        super(&block)
        @operand, @concrete_columns = operand, concrete_columns
        @concrete_columns_by_name = ActiveSupport::OrderedHash.new
        concrete_columns.each do |projected_column|
          concrete_columns_by_name[projected_column.name] = projected_column
        end
      end

      def concrete_columns
        concrete_columns_by_name.values
      end

      def operand_projected_columns
        concrete_columns.map {||}
      end

      def column(column_or_name)
        case column_or_name
        when String, Symbol
          concrete_columns_by_name[column_or_name]
        when ProjectedColumn
          column_or_name
        end
      end

      def surface_tables
        nil
      end
      
      def tuple_class
        return @tuple_class if @tuple_class
        @tuple_class = Class.new(Tuple)
        @tuple_class.relation = self
        @tuple_class
      end

      def build_sql_query(sql_query=Sql::Select.new)
        sql_query.select_clause_columns = concrete_columns unless sql_query.has_explicit_select_clause_columns?
        operand.build_sql_query(sql_query)
      end

      def build_record_from_database(field_values)
        tuple_class.new(field_values)
      end

      def ==(other)
        return false unless other.instance_of?(self.class)
        operand == other.operand && concrete_columns_by_name == other.concrete_columns_by_name
      end

      protected
      def subscribe_to_operands
        operand_subscriptions.add(operand.on_insert do |tuple|
          on_insert_node.publish(projected_tuple(tuple))
        end)
        
        operand_subscriptions.add(operand.on_update do |tuple, changeset|
          projected_tuple = projected_tuple(tuple)
          projected_changeset = projected_changeset(projected_tuple, changeset)

          on_update_node.publish(projected_tuple(tuple), projected_changeset) unless projected_changeset.empty?
        end)

      end

      def projected_tuple(tuple)
        field_values = {}
        concrete_columns_by_name.each do |name, projected_column|
          field_values[name] = tuple.field(projected_column.column).value
        end
        tuple_class.new(field_values)
      end

      def projected_changeset(projected_tuple, changeset)

        
        concrete_columns.each do

        end


      end
    end
  end
end
