module Util
  class SubscriptionNode
    def initialize
      @subscriptions = []
      @events_paused = false
    end

    def subscribe(&proc)
      subscriptions.push(proc)
    end

    def publish(*args)
      if events_paused
        enqueued_events.push(args)
      else
        subscriptions.each { |proc| proc.call(*args) }
      end
    end

    def pause
      @events_paused = true
      @enqueued_events = []
    end

    def resume
      @events_paused = false
      enqueued_events.each do |event|
        publish(*event)
      end
      @enqueued_events = nil
    end

    def cancel
      @events_paused = false
      @enqueued_events = nil
    end

    protected
    attr_reader :subscriptions, :events_paused, :enqueued_events
  end
end
