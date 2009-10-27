(function(Monarch, jQuery) {

Monarch.constructor("Monarch.Http.Server", {
  fetch: function(relations) {
    var fetch_future = new Monarch.Http.RepositoryUpdateFuture();

    start = new Date().getTime();

    Server.get(Repository.origin_url, {
      relations: Monarch.Util.map(relations, function(relation) {
        return relation.wire_representation();
      })
    })
      .on_success(function(data) {
        Repository.pause_events();
        Repository.update(data);
        fetch_future.trigger_before_events();
        Repository.resume_events();
        fetch_future.trigger_after_events();
      });

    return fetch_future;
  },

  create: function(relation, field_values) {
    var record = new relation.record_constructor(field_values);
    var table = record.table();
    var create_future = new Monarch.Http.RepositoryUpdateFuture();

    Server.post(Repository.origin_url, {
      creates: [{relation: table.wire_representation(), field_values: record.wire_representation(), echo_id: "hard_coded_echo_id"}]
    })
      .on_success(function(data) {
        var field_values = Monarch.Util.values(data.creates[table.global_name])[0];
        record.local_update(field_values);
        table.insert(record, {
          before_events: function() {
            create_future.trigger_before_events(record);
          },
          after_events: function() {
            create_future.trigger_after_events(record);
          }
        });
    });

    return create_future;
  },

  update: function(record, values_by_method_name) {
    var push_future = new Monarch.Http.RepositoryUpdateFuture();
    var table = record.table();

    record.start_pending_changes();
    record.local_update(values_by_method_name);
    var pending_fieldset = record.active_fieldset;
    record.restore_primary_fieldset();

    Server.post(Repository.origin_url, {
      updates: [{
        id: record.id(),
        relation: table.wire_representation(),
        field_values: pending_fieldset.wire_representation()
      }]
    })
      .on_success(function(data) {
        var field_values = data.updates[table.global_name][record.id()];
        pending_fieldset.update(field_values);
        pending_fieldset.commit({
          before_events: function() {
            push_future.trigger_before_events();
          },
          after_events: function() {
            push_future.trigger_after_events();
          }
        });
      });

    return push_future;

  },

  destroy: function(record) {
    return record.push_destroy();
  },

  post: function(url, data) {
    return this.request('POST', url, data);
  },

  get: function(url, data) {
    return this.request('GET', url, data);
  },

  put: function(url, data) {
    return this.request('PUT', url, data);
  },

  delete_: function(url, data) {
    var url_encoded_data = jQuery.param(this.stringify_json_data(data));
    return this.request('DELETE', url + "?" + url_encoded_data);
  },

  request: function(type, url, data) {
    var future = new Monarch.Http.AjaxFuture();
    jQuery.ajax({
      url: url,
      type: type,
      dataType: 'json',
      data: data ? this.stringify_json_data(data) : null,
      success: function(response) {
        future.handle_response(response);
      }
    });
    return future;
  },

  stringify_json_data: function(data) {
    var stringified_data = {};
    Monarch.Util.each(data, function(key, value) {
      if (typeof value == "object") value = JSON.stringify(value);
      stringified_data[key] = value;
    });
    return stringified_data;
  }
});

})(Monarch, jQuery);
