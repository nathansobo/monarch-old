module Model
  module Relations
    class Union < Relation
      delegate :build_record_from_database, :column, :to => "operands.first"
      attr_reader :operands
      
      def initialize(operands, &block)
        super(&block)
        @operands = operands
      end

      def surface_tables
        operands.inject([]) do |acc, operand|
          acc | operand.surface_tables
        end
      end

      def build_sql_query(query=Sql::Select.new)
        Sql::Union.new(operands.map {|o| o.build_sql_query(query.clone)})
      end

      protected

      def subscribe_to_operands

        operands.each do |operand|
          operand_subscriptions.add(operand.on_insert do |tuple|
            if !more_than_one_exists_in_union?(tuple)
              on_insert_node.publish(tuple)
            end
          end)
        end

      end

      def more_than_one_exists_in_union?(tuple)
        sum = 0
        predicate = hash_to_predicate(tuple.field_values_by_column_name)
        operands.each do |operand|
          sum += operand.where(predicate).size
          return true if sum > 1
        end
        return false
      end
    end
  end
end
