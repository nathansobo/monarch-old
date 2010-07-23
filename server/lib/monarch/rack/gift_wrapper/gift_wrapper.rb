class GiftWrapper

  attr_reader :load_path

  def initialize
    @load_path = []
  end

  def mount(physical_path_prefix, web_path_prefix)
    load_path.push(Location.new(self, physical_path_prefix, web_path_prefix))
  end

  def require_js(*paths)
    required = []
    paths.each do |path|
      js_file = resolve_from_load_path("#{path}.js")
      js_file.expand_require_graph(required)
    end
    required
  end

  def resolve_web_path(web_path_to_resolve)
    most_specific_location =
      load_path.
      sort_by {|location| location.web_path.length}.
      reverse.
      find {|location| location.matches_web_path(web_path_to_resolve)}

    most_specific_location.resolve_web_path(web_path_to_resolve) if most_specific_location
  end

  def resolve_physical_path(physical_path_to_resolve)
    most_specific_location =
      load_path.
      sort_by {|location| location.physical_path.length}.
      reverse.
      find {|location| location.matches_physical_path(physical_path_to_resolve)}

    most_specific_location.resolve_physical_path(physical_path_to_resolve) if most_specific_location
  end

  def resolve_from_load_path(path_to_resolve)
    load_path.each do |location|
      if js_file = location.resolve_from_load_path(path_to_resolve)
        return js_file
      end
    end
    raise "File #{path_to_resolve} not found on load path"
  end

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

  class JsFile
    RELATIVE_REQUIRE_REGEX = /^\/\/= require\s+['"]([^'"]+)['"].*/
    LOAD_PATH_REQUIRE_REGEX = /^\/\/= require\s+<([^>]+)>.*/

    attr_reader :location
    delegate :gift_wrapper, :web_path, :physical_path, :to => :location

    def initialize(location)
      @location = location
    end

    def expand_require_graph(requires)
      return if requires.any? {|js_file| js_file.physical_path == physical_path}
      each_line do |line|
        if match = RELATIVE_REQUIRE_REGEX.match(line)
          relative_require(match[1], requires)
        elsif match = LOAD_PATH_REQUIRE_REGEX.match(line)
          load_path_require(match[1], requires)
        end
      end
      requires.push(self)
    end

    protected

    def relative_require(relative_path, requires)
      relative_physical_path = File.expand_path("#{File.dirname(physical_path)}/#{relative_path}.js")
      js_file = JsFile.new(gift_wrapper.resolve_physical_path(relative_physical_path))
      js_file.expand_require_graph(requires)
    end

    def load_path_require(relative_path, requires)
      gift_wrapper.resolve_from_load_path("#{relative_path}.js").expand_require_graph(requires)
    end

    def each_line(&block)
      File.open(physical_path, "r") do |file|
        file.lines.each(&block)
      end
    end
  end
end