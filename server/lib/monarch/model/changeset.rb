module Model
  class Changeset
    attr_reader :record, :old_state, :dirty_fields
    alias :new_state :record

    def initialize(record, dirty_fields)
      @record, @dirty_fields = record, dirty_fields
      @old_state = OldRecordState.new(record)
      dirty_fields.each do |field|
        old_state.preserve_current_remote_value(field)
      end
    end

    def changed?(field_or_name)
      dirty_fields.include?(record.field(field_or_name))
    end

    def wire_representation
      wire_representation = {}
      dirty_fields.each do |field|
        wire_representation[field.name.to_s] = field.value_wire_representation
      end
      wire_representation
    end

    def inspect
      inspect_hash = {}
      dirty_fields.each do |field|
        inspect_hash[field.name] = {
          :old => old_state.field(field.name).value,
          :new => field.value
        }
      end
      inspect_hash.inspect
    end

    protected

    class OldRecordState
      delegate :column, :to => :record

      def initialize(record)
        @record = record
        @old_field_values_by_column_name = {}
      end

      def preserve_current_remote_value(field)
        old_field_values_by_column_name[field.name] = field.remote_value
      end

      def field(column_or_name)
        column = column(column_or_name)
        return nil unless column
        if old_field_values_by_column_name.has_key?(column.name)
          OldFieldState.new(old_field_values_by_column_name[column.name])
        else
          record.field(column)
        end
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

    class OldFieldState
      attr_reader :value

      def initialize(value)
        @value = value
      end
    end
  end
end
