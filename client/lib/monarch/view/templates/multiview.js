constructor("View.Templates.Multiview", View.Template, {
  content: function(subview_templates_by_name) {
    var b = this.builder;
    b.div(function() {
      Util.each(subview_templates_by_name, function(name, template) {
        b.subview('subviews', name, template);
      })
    });
  },
  
  view_properties: {
    initialize: function() {
      jQuery.extend(this, this.subviews);
    },

    hide_all_except: function() {
      var names = Util.to_array(arguments);
      Util.each(this.subviews, function(subview_name, subview) {
        if (Util.contains(names, subview_name)) {
          subview.show();
        } else {
          subview.hide();
        }
      });
    }
  }
});
