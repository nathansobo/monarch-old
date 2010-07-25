dir = File.dirname(__FILE__)
require "digest/sha1"
require "#{dir}/gift_wrapper/location"
require "#{dir}/gift_wrapper/js_file"
require "#{dir}/gift_wrapper/require_context"

class GiftWrapper
  attr_reader :load_path
  attr_accessor :development_mode, :package_dir

  def initialize
    @load_path = []
    @development_mode = false
  end

  def mount(physical_path_prefix, web_path_prefix)
    load_path.push(Location.new(self, physical_path_prefix, web_path_prefix))
  end

  def require_js(*paths)
    context = RequireContext.new(development_mode)
    walk_require_graph(paths, context)
    context.required_web_paths
  end

  def combine_js(*paths)
    raise "Package dir not assigned" unless package_dir
    context = RequireContext.new(true)
    walk_require_graph(paths, context)

    digest = Digest::SHA1.hexdigest(context.combined_content)
    File.open("#{package_dir}/combined.#{digest}.js", "w") do |file|
      file.write(context.combined_content)
    end
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

  protected

  def walk_require_graph(paths, context)
    paths.each do |path|
      js_file = resolve_from_load_path("#{path}.js")
      js_file.expand_require_graph(context)
    end
  end
end