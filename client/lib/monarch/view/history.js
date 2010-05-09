(function(Monarch, jQuery) {

_.constructor("Monarch.View.History", {
  hashchange: function(callback) {
    jQuery(window).bind('hashchange', callback);
    callback();
  },

  fragment: function(fragment) {
    return jQuery.param.fragment(fragment);
  }
});

})(Monarch, jQuery);
