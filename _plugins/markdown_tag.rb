module Jekyll
  class MarkdownTag < Liquid::Tag
    attr_reader :template
    def initialize(tag_name, template, tokens)
      super
      @template = template.strip
    end

    def render(context)
      dir = File.dirname(__FILE__)
      path = File.expand_path("#{dir}/../_includes/#{template}")
      raise "No file found at #{path}" unless File.exist?(path)
      Maruku.new(File.read(path)).to_html
    end
  end
end

Liquid::Template.register_tag('markdown', Jekyll::MarkdownTag)