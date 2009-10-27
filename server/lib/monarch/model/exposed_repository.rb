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
      if params[:creates]
        handle_creates(JSON.parse(params[:creates]))
      elsif params[:updates]
        handle_updates(JSON.parse(params[:updates]))
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

    def handle_creates(creates)
      create = creates.first
      relation = build_relation_from_wire_representation(create['relation'])
      field_values = create['field_values']
      new_record = relation.create(field_values)

      data = {
        'creates' => {
          new_record.table.global_name => {
            new_record.id => new_record.wire_representation.merge('echo_id' => create['echo_id'])
          }
        }
      }

      [200, headers, { 'successful' => true, 'data' => data}.to_json]
    end

    def handle_updates(updates)
      update = updates.first
      id = update['id']
      relation = build_relation_from_wire_representation(update['relation'])
      field_values = update['field_values']
      record = relation.find(id)
      updated_field_values = record.update(field_values)
      record.save

      data = {
        'updates' => {
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
