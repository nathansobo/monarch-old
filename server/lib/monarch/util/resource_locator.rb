module Util
  class ResourceLocator
    attr_reader :root

    def new_root_resource
      Resources::Root.new
    end

    def locate(path, params)
      session_id = params[:session_id]
      comet_client = params[:comet_client]

      root = new_root_resource
      assign_session_id_or_comet_client(root, session_id, comet_client)
      path_parts(path).inject(root) do |resource, child_resource_name|
        if resource
          next_resource = resource.locate(child_resource_name)
          raise "no subresource named #{child_resource_name}" unless next_resource
          assign_session_id_or_comet_client(next_resource, session_id, comet_client)
          next_resource
        else
          nil
        end
      end
    end

    protected
    def path_parts(path)
      path.split('/').reject { |part| part == "" }
    end

    def assign_session_id_or_comet_client(resource, session_id, comet_client)
      resource.current_session_id = session_id if session_id
      resource.current_comet_client = comet_client if comet_client
    end
  end
end
