module Model
  class SqlQuery
    attr_reader :from_tables, :conditions
    attr_writer :projected_tables

    def initialize
      @from_tables = []
      @conditions = []
    end

    def to_sql
      "select #{projected_columns_sql} from #{from_tables_sql}#{where_clause_sql}"
    end

    def where_clause_sql
      if conditions.empty?
        ""
      else
        " where #{conditions.map {|c| c.to_sql}.join(" and ")}"
      end
    end

    def projected_columns_sql
      if projected_tables.size > 1
        all_columns = projected_tables.map {|table| table.columns }.flatten
        all_columns.map {|c| c.to_aliased_sql }.join(", ")
      else
        projected_tables.first.columns.map {|c| c.to_sql}.join(", ")
      end
    end

    def from_tables_sql
      from_tables.map {|s| s.global_name}.join(", ")
    end

    def add_from_table(table)
      from_tables.push(table)
    end

    def add_condition(predicate)
      conditions.push(predicate)
    end

    def projected_tables
      @projected_tables || from_tables
    end
  end
end
