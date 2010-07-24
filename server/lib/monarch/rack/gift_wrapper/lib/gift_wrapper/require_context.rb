class GiftWrapper
  class RequireContext
    attr_reader :development_mode, :requires, :combined_files, :combined_file_names

    def initialize(root_file_name, development_mode)
      @development_mode = development_mode
      @requires = []
      @combined_files = []
      @combined_file_names = []
      push_combined_file_name(root_file_name)
    end

    def add_require(js_file)
      if development_mode
        requires.push(js_file)
      else
        start_new_combined_file if combined_files.empty?
        combined_files.last.append(js_file)
      end
    end

    def already_required?(js_file)
      requires.any? {|required_file| required_file.physical_path == js_file.physical_path}
    end

    def required_web_paths
      requires.map(&:web_path)
    end

    def begin_combined_region(name)
      push_combined_file_name(name)
      start_new_combined_file
    end

    def end_combined_region
      combined_file_names.pop
    end

    def push_combined_file_name(name)
      combined_file_names.push(CombinedFileName.new(name))
    end

    def start_new_combined_file
      combined_files.push(JsFile.new())
    end
  end

  class CombinedFileName
    attr_reader :name, :count

    def initialize(name)
      @name = name
      @count = 0
    end
  end
end