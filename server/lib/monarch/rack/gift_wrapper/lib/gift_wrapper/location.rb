class GiftWrapper
  class Location
    attr_reader :gift_wrapper, :physical_path, :web_path

    def initialize(gift_wrapper, physical_path, web_path)
      @gift_wrapper, @physical_path, @web_path = gift_wrapper, physical_path, web_path
    end

    def resolve_web_path(web_path_to_resolve)
      raise "Web path does not match this location's prefix" unless matches_web_path(web_path_to_resolve)
      resolved_physical_path = web_path_to_resolve.gsub(/^#{self.web_path}/, self.physical_path)
      Location.new(gift_wrapper, resolved_physical_path, web_path_to_resolve)
    end

    def resolve_physical_path(physical_path_to_resolve)
      raise "Physical path does not match this location's prefix" unless matches_physical_path(physical_path_to_resolve)
      resolved_web_path = physical_path_to_resolve.gsub(/^#{self.physical_path}/, self.web_path)
      Location.new(gift_wrapper, physical_path_to_resolve, resolved_web_path)
    end

    def resolve_from_load_path(path_to_resolve)
      relative_physical_path = File.expand_path("#{physical_path}/#{path_to_resolve}")
      if File.exist?(relative_physical_path)
        return JsFile.new(gift_wrapper.resolve_physical_path(relative_physical_path))
      end
    end

    def matches_web_path(web_path_to_match)
      web_path_to_match.starts_with?(self.web_path)
    end

    def matches_physical_path(physical_path_to_match)
      physical_path_to_match.starts_with?(self.physical_path)
    end
  end
end