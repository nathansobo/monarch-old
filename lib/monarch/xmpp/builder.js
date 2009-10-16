(function(Monarch) {

Monarch.constructor("Monarch.Xmpp.Builder", Monarch.Xml.Builder, {
  constructor_properties: {
    supported_tags: [
      "iq", "message", "presence", "show", "status", "body", "active", "composing", "paused", "query"
    ]
  }
})

})(Monarch);
