class Domain
  class << self
    def instance
      @instance ||= new
    end

    delegate :new_set, :sets_by_name, :load_fixtures, :clear_tables, :to => :instance
  end

  attr_reader :sets_by_name
  def initialize
    @sets_by_name = {}
  end

  def new_set(name, tuple_class)
    sets_by_name[name] = Relations::Set.new(name, tuple_class)
  end

  #TODO: test
  def load_fixtures
    sets.each {|set| set.load_fixtures}
  end

  #TODO: test
  def clear_tables
    sets.each {|set| set.clear_table}
  end

  def sets
    sets_by_name.values
  end
end