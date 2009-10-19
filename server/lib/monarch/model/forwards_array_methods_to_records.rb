# TODO: include a more exhaustive list here
module Model
  module ForwardsArrayMethodsToRecords
    def each(&block)
      records.each(&block)
    end

    def first
      records.first
    end
  end
end
