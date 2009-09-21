constructor("Queue", {
  initialize: function(segment_size, delay) {
    this.segment_size = segment_size || 1;
    this.delay = delay || 0;
    this.fns = [];
  },

  add: function(fn) {
    this.fns.push(fn)
  },

  add_atomic: function(fn) {
    fn.atomic = true;
    this.fns.push(fn)
  },

  start: function() {
    var self = this;
    var delay = this.delay;
    var segment_size = this.segment_size;
    var fns = this.fns;

    var process_next_segment = function() {
//      var start = new Date().getTime();
      for (var i = 0; i < segment_size && fns.length > 0; i++) {
        var fn = fns.shift()
        fn();
        if (fn.atomic) break;
      }
//      console.debug(new Date().getTime() - start);
      if (fns.length > 0) setTimeout(function() { process_next_segment(); }, delay);
    };

    process_next_segment();
  },

  clear: function() {
    this.fns.length = 0;
  }
})
