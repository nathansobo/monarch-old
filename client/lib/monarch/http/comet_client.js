(function(Monarch) {

Monarch.constructor("Monarch.Http.CometClient", {
  connect: function() {
    var self = this;
    var len = 0
    session_id = "fake_client_id";

    var xhr = jQuery.ajax({
      type: "post",
      url: Server.comet_hub_url,
      data: { comet_client_id: window.COMET_CLIENT_ID, transport: "xhr_stream" },
      complete: function() { self.connect() }
    });

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 3) {
        var data = Monarch.Util.trim(xhr.responseText.slice(len));
        len = xhr.responseText.length;
        if (data.length > 0) console.debug(data);
      }
    }
  }
});

})(Monarch);
