(function(Monarch, jQuery) {

jQuery.fn.extend({
  appendView: function(contentFn) {
    this.append(Monarch.View.build(contentFn));
    return this;
  },

  view: function() {
    return this.data('view');
  },

  fieldValues: function() {
    var values = {};
    this.find("input,select,textarea").each(function() {
      var elt = jQuery(this);
      var name = elt.attr('name');
      if (!name) return;
      if (elt.is(':checkbox')) {
        values[name] = elt.attr('checked');
      } else {
        values[name] = elt.val();
      }
    });

    if (this.customFieldValues) {
      jQuery.extend(values, this.customFieldValues());
    }

    return values;
  },

  bindHtml: function(record, fieldName) {
    var subscription = this.data('bindHtmlSubscription');
    if (subscription) subscription.destroy();
    var field = record.field(fieldName);
    if (!field) throw new Error("No field named " + fieldName + " found.");
    this.html(htmlEscape(field.value()));

    var subscription = field.onUpdate(function(newValue) {
      this.html(htmlEscape(newValue));
    }, this);
    this.data('bindHtmlSubscription', subscription);

    this.attr('htmlIsBound', true);
  },

  fillVerticalSpace: function(spaceAtBottom, minHeight, property) {
    if (!minHeight) minHeight = 0;
    var height = $(window).height() - this.offset().top - (spaceAtBottom || 0);
    if (height < minHeight) {
      height = minHeight;
    }
    this.css(property || 'height', height);
  }
});

})(Monarch, jQuery);
