module Model
  class Field
    attr_reader :record, :column, :value, :validation_errors

    delegate :name, :to => :column

    def initialize(record, column)
      @record, @column = record, column
      mark_clean
    end

    def value=(value)
      new_value = column.convert_value_for_storage(value)
      if @value != new_value
        @value = new_value
        mark_dirty
      end
    end

    def value_wire_representation
      column.convert_value_for_wire(value)
    end

    def to_sql
      value.to_sql
    end

    def dirty?
      @dirty
    end

    def mark_clean
      @dirty = false
      @validation_errors = []
    end

    def mark_validated
      @validated = true
    end

    def validated?
      @validated
    end

    def valid?
      validation_errors.empty?
    end

    protected
    def mark_dirty
      @dirty = true
      @validated = false
    end
  end
end
