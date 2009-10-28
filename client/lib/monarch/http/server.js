(function(Monarch, jQuery) {

Monarch.constructor("Monarch.Http.Server", {
  initialize: function() {
    this._next_echo_id = 0;
    this.pending_create_commands_by_echo_id = {};
  },

  fetch: function(relations) {
    var fetch_future = new Monarch.Http.RepositoryUpdateFuture();

    start = new Date().getTime();

    this.get(Repository.origin_url, {
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

  next_echo_id: function() {
    return "echo_" + this._next_echo_id++;
  },

  create: function(table, field_values) {
    var create_command = new Monarch.Http.CreateCommand(table, field_values, this.next_echo_id());
    this.pending_create_commands_by_echo_id[create_command.echo_id] = create_command;
    this.perform_pending_mutations();
    return create_command.future;
  },

  perform_pending_mutations: function() {
    var self = this;
    var request_data = {};

    Monarch.Util.values(this.pending_create_commands_by_echo_id, function(create_command) {
      create_command.add_to_request_data(request_data);
    });

    this.post(Repository.origin_url, request_data).on_success(function(response_data) {
      self.handle_mutation_response(response_data)
    });
  },

  handle_mutation_response: function(response_data) {
    var self = this;
    Repository.pause_events();


    Monarch.Util.each(response_data.create, function(table_name, field_values_by_echo_id) {
      Monarch.Util.each(field_values_by_echo_id, function(echo_id, field_values) {
        self.pending_create_commands_by_echo_id[echo_id].complete_and_trigger_before_events(field_values);
      });
    });

    Repository.resume_events();
    Monarch.Util.values(this.pending_create_commands_by_echo_id, function(command) {
      command.trigger_after_events();
    });
    this.pending_create_commands_by_echo_id = {};
  },

  update: function(record, values_by_method_name) {
    var update_future = new Monarch.Http.RepositoryUpdateFuture();
    var table = record.table();
    record.start_pending_changes();
    record.local_update(values_by_method_name);
    var pending_fieldset = record.active_fieldset;
    record.restore_primary_fieldset();

    var update_commands_by_table = {};
    var update_commands_by_record_id = {};
    update_commands_by_record_id[record.id()] = pending_fieldset.wire_representation();
    update_commands_by_table[table.global_name] = update_commands_by_record_id;

    this.post(Repository.origin_url, {
      update: update_commands_by_table
    })
      .on_success(function(data) {
        var field_values = data.update[table.global_name][record.id()];
        pending_fieldset.update(field_values);
        pending_fieldset.commit({
          before_events: function() {
            update_future.trigger_before_events();
          },
          after_events: function() {
            update_future.trigger_after_events();
          }
        });
      });

    return update_future;

  },

  destroy: function(record) {
    var destroy_future = new Monarch.Http.RepositoryUpdateFuture();
    var self = this;
    var table = record.table();

    var destroy_commands_by_table = {};
    destroy_commands_by_table[table.global_name] = [record.id()];
    this.post(Repository.origin_url, {
      destroy: destroy_commands_by_table
    })
      .on_success(function() {
        table.remove(record, {
          before_events: function() {
            destroy_future.trigger_before_events(record);
          },
          after_events: function() {
            destroy_future.trigger_after_events(record);
          }
        });
      });

    return destroy_future;
  },

  start_batch: function() {
    this.batch_in_progress = true;
  },

  finish_batch: function() {
    this.batch_in_progress = false;
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
