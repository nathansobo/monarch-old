module Model
  class CompositeTuple < Tuple
    class << self
      attr_accessor :relation
    end

    delegate :surface_tables, :to => :relation
    attr_reader :constituent_records_by_table
    
    def initialize(field_values_or_tuples)
      @constituent_records_by_table = {}

      if field_values_or_tuples.instance_of?(Array)
        flatten_to_records(field_values_or_tuples).each do |tuple|
          constituent_records_by_table[tuple.table] = tuple
        end
      else
        surface_tables.each do |table|
          constituent_records_by_table[table] = build_constituent_record(table, field_values_or_tuples)
        end
      end
    end

    def [](table_or_record_class)
      constituent_records_by_table[table_or_record_class.table]
    end

    def inspect
      constituent_records_by_table_name = {}
      constituent_records_by_table.each do |table, record|
        constituent_records_by_table_name[table.global_name] = record
      end
      constituent_records_by_table_name.inspect
    end

    def constituent_records
      constituent_records_by_table.values
    end

    def sorted_constituent_records
      sorted_tables = constituent_records_by_table.keys.sort_by {|table| table.global_name.to_s}
      sorted_tables.map do |table|
        constituent_records_by_table[table]
      end
    end

    def field(column_or_name)
      constituent_records.each do |record|
        field = record.field(column_or_name)
        return field if field
      end
      nil
    end

    def hash
      sorted_constituent_records.hash
    end

    def eql?(other)
      other.hash == hash
    end

    protected
    def build_constituent_record(table, field_values)
      table_specific_field_values = {}
      field_values.each do |field_name, value|
        table_specific_field_name = field_name.to_s.gsub!("#{table.global_name}__", "")
        if table_specific_field_name
          table_specific_field_values[table_specific_field_name.to_sym] = value
        end
      end
      table.build_record_from_database(table_specific_field_values)
    end

    def flatten_to_records(composite_tuples)
      composite_tuples.map {|composite_tuple| composite_tuple.constituent_records }.flatten
    end
  end
end
