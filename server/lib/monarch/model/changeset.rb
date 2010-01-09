module Model
  class Changeset
    attr_reader :record, :old_state, :dirty_fields
    alias :new_state :record

    def initialize(record, dirty_fields)
      @record, @dirty_fields = record, dirty_fields
      @old_state = OldRecordState.new(record)
      dirty_fields.each do |field|
        old_state[field] = field.remote_value
      end
    end

    def wire_representation
      wire_representation = {}
      dirty_fields.each do |field|
        wire_representation[field.name.to_s] = field.value_wire_representation
      end
      wire_representation
    end

    protected

    class OldRecordState
      def initialize(record)
        @record = record
        @old_field_values_by_column_name = {}
      end

      def []=(field, old_value)
        old_field_values_by_column_name[field.name] = old_value
      end

      def evaluate(term)
        if term.is_a?(Column)
          if old_field_values_by_column_name.has_key?(term.name)
            old_field_values_by_column_name[term.name]
          else
            record.evaluate(term)
          end
        else
          term
        end
      end

      protected
      attr_reader :record, :old_field_values_by_column_name
    end

  end
end
