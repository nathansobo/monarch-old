module Model
  class JoinRecord
    class << self
      attr_accessor :joined_tables
    end

    delegate :joined_tables, :to => "self.class"
    attr_reader :constituent_records_by_table, :relation
    
    def initialize(field_values)
      @constituent_records_by_table = {}
      joined_tables.each do |table|
        constituent_records_by_table[table] = build_constituent_record(table, field_values)
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
  end
end
