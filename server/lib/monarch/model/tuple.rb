module Model
  class Tuple
    class << self
      attr_accessor :relation
    end
    delegate :relation, :to => "self.class"
    delegate :column, :to => :relation

    def get_field_value(column_or_name)
      field(column_or_name).value
    end

    def field(column_or_name)
      fields_by_column[column(column_or_name)]
    end

    def fields
      fields_by_column.values
    end

    def field_values_by_column_name
      fields_by_column.inject({}) do |result, column_field_pair|
        result[column_field_pair[0].name] = column_field_pair[1].value
        result
      end
    end

    def inspect
      field_values_by_column_name.inspect
    end

    def wire_representation
      wire_representation = {}
      fields_by_column.each do |column, field|
        wire_representation[column.name.to_s] = field.value_wire_representation
      end
      wire_representation
    end

    protected
    def initialize_fields
      @fields_by_column = {}
      relation.columns.each do |column|
        fields_by_column[column] = Field.new(self, column)
      end
    end
  end
end
