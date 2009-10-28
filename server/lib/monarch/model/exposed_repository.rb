module Model
  class ExposedRepository < ::Http::Resource
    class << self
      def expose(name, &relation_definition)
        exposed_relation_definitions_by_name[name] = relation_definition
      end

      def exposed_relation_definitions_by_name
        @exposed_relation_definitions_by_name ||= HashWithIndifferentAccess.new
      end
    end

    def get(params)
      relation_wire_representations = JSON.parse(params[:relations])
      [200, headers, { :successful => true, :data => fetch(relation_wire_representations)}.to_json]
    end

    def post(params)
      if params[:create]
        handle_create(JSON.parse(params[:create]))
      elsif params[:update]
        handle_update(JSON.parse(params[:update]))
      elsif params[:destroys]
        handle_destroys(JSON.parse(params[:destroys]))  
      end
    end

    def resolve_table_name(name)
      if relation = exposed_relations_by_name[name]
        return relation
      end
      relation_definition = exposed_relation_definitions_by_name[name]
      raise "No table named #{name} defined in #{inspect}" unless relation_definition
      relation = instance_eval(&relation_definition)
      relation.exposed_name = name
      exposed_relations_by_name[name] = relation
    end
    
    protected

    def handle_create(create_commands_by_table)
      table_name = create_commands_by_table.keys.first
      create_commands_by_echo_id = create_commands_by_table.values.first
      echo_id = create_commands_by_echo_id.keys.first
      field_values = create_commands_by_echo_id.values.first

      relation = resolve_table_name(table_name)
      new_record = relation.create(field_values)

      data = {
        'create' => {
          new_record.table.global_name => {
            echo_id => new_record.wire_representation
          }
        }
      }

      [200, headers, { 'successful' => true, 'data' => data}.to_json]
    end

    def handle_update(update_commands_by_table)
      table_name = update_commands_by_table.keys.first
      update_commands_by_record_id = update_commands_by_table.values.first
      id = update_commands_by_record_id.keys.first
      field_values = update_commands_by_record_id.values.first

      relation = resolve_table_name(table_name)
      record = relation.find(id)
      updated_field_values = record.update(field_values)
      record.save

      data = {
        'update' => {
          record.table.global_name => {
            record.id => updated_field_values
          }
        }
      }

      [200, headers, { 'successful' => true, 'data' => data}.to_json]
    end

    def handle_destroys(destroys)
      destroy = destroys.first


      id = destroy['id']
      relation = build_relation_from_wire_representation(destroy['relation'])
      record = relation.find(id)
      relation.destroy(id)

      data = {
        'destroys' => {
          record.table.global_name => [id]  
        }
      }

      [200, headers, { 'successful' => true, 'data' => data }.to_json]
    end

    def headers
      { 'Content-Type' => 'application/json' }
    end

    def fetch(relation_wire_representations)
      dataset = {}
      relation_wire_representations.each do |representation|
        build_relation_from_wire_representation(representation).add_to_relational_dataset(dataset)
      end
      dataset
    end

    def build_relation_from_wire_representation(representation)
      Relations::Relation.from_wire_representation(representation, self)
    end

    def exposed_relations_by_name
      @exposed_relations_by_name ||= HashWithIndifferentAccess.new
    end

    def exposed_relation_definitions_by_name
      self.class.exposed_relation_definitions_by_name
    end
  end
end
