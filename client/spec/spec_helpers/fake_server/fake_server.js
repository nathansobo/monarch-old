Monarch.constructor("FakeServer", Monarch.Http.Server, {
  initialize: function(auto_mutate) {
    this.posts = [];
    this.puts = [];
    this.deletes = [];
    this.gets = [];
    this.fetches = [];
    this.creates = [];
    this.updates = [];
    this.destroys = [];
    this.batches = [];

    this.auto_fetch = false;
    this.auto_mutate = (auto_mutate === undefined) ? true : auto_mutate;

    this.Repository = Repository.clone_schema();

    this.id_counter = 1;
  },

  fetch: function(relations) {
    var fake_fetch = new FakeServer.FakeFetch(Repository.origin_url, relations, this.Repository);
    if (this.auto_fetch) {
      fake_fetch.simulate_success();
    } else {
      this.last_fetch = fake_fetch;
      this.fetches.push(fake_fetch);
    }
    return fake_fetch.future;
  },

  simulate_fetch: function(relations) {
    this.fetch(relations);
    if (!this.auto_fetch) this.fetches.shift().simulate_success();
  },

  save: function() {
    var commands = Monarch.Util.map(this.extract_dirty_records(arguments), function(dirty_record) {
      return this.build_appropriate_command(dirty_record);
    }.bind(this));
    var batch = new FakeServer.FakeCommandBatch(Repository.origin_url, this, commands);
    return batch.perform();
  },

  post: function(url, data) {
    var fake_post = new FakeServer.FakeRequest('POST', url, data)
    this.last_post = fake_post;
    this.posts.push(fake_post);
    return fake_post.future;
  },

  get: function(url, data) {
    var fake_get = new FakeServer.FakeRequest('GET', url, data)
    this.last_get = fake_get;
    this.gets.push(fake_get);
    return fake_get.future;
  },

  put: function(url, data) {
    var fake_put = new FakeServer.FakeRequest('PUT', url, data)
    this.last_put = fake_put;
    this.puts.push(fake_put);
    return fake_put.future;
  },

  delete_: function(url, data) {
    var fake_delete = new FakeServer.FakeRequest('DELETE', url, data)
    this.last_delete = fake_delete;
    this.deletes.push(fake_delete);
    return fake_delete.future;
  },

  add_request: function(request) {
    var requests_array = this[Monarch.Inflection.pluralize(request.type)];
    requests_array.push(request);
    this["last_" + request.type] = request;
  },

  remove_request: function(request) {
    var requests_array = this[Monarch.Inflection.pluralize(request.type)];
    Monarch.Util.remove(requests_array, request);
    this["last_" + request.type] = requests_array[requests_array.length - 1];
  }
});
