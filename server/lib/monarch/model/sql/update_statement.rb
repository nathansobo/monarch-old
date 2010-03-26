module Model
  module Sql
    class UpdateStatement
      attr_reader :target_table_ref, :set_clause_assignments, :from_clause_table_ref, :where_clause_predicates
      def initialize(target_table_ref, set_clause_assignments, from_clause_table_ref, where_clause_predicates)
        @target_table_ref = target_table_ref
        @set_clause_assignments = set_clause_assignments
        @from_clause_table_refs = [from_clause_table_ref]
        @where_clause_predicates = where_clause_predicates
      end

      def to_sql
        ["update",
         target_table_ref.name,
         "set",
         set_clause_assignments_sql,
         where_clause_sql
        ].join(" ")
      end

      protected
      def set_clause_assignments_sql
        set_clause_assignments.map do |column_ref, expression|
          "#{column_ref.name} = #{expression.to_sql}"
        end.sort.join(", ")
      end

      def where_clause_sql
        return nil unless where_clause_predicates
        "where " + where_clause_predicates.map do |predicate|
          predicate.to_sql
        end.sort.join(" and ")
      end
    end
  end
end
