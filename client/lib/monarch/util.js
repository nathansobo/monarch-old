(function(Monarch) {

Monarch.module("Monarch.Util", {
  each: function(array_or_hash, fn) {
    if (array_or_hash.length) {
      this.array_each(array_or_hash, fn);
    } else {
      this.hash_each(array_or_hash, fn);
    }
  },


  index_of: function(array, element) {
    for(var i = 0; i < array.length; i++) {
      if (array[i] == element) return i;
    }
    return -1;
  },

  contains: function(array, element) {
    return this.index_of(array, element) != -1;
  },

  array_each: function(array, fn) {
    for(var i = 0; i < array.length; i++) {
      fn.call(array[i], array[i], i);
    }
  },

  hash_each: function(hash, fn) {
    for (key in hash) {
      fn.call(hash[key], key, hash[key]);
    }
  },

  map: function(array, fn) {
    var new_array = [];
    this.each(array, function(element) {
      new_array.push(fn.call(element, element));
    });
    return new_array;
  },

  to_array: function(arguments_object) {
    return Array.prototype.slice.call(arguments_object, 0);
  },

  remove: function(array, element) {
    var record_index = array.indexOf(element);
    if (record_index == -1) return null;
    array.splice(record_index, 1);
    return element;
  },

  keys: function(hash, optional_each_function) {
    var keys = [];
    for (key in hash) keys.push(key);
    if (optional_each_function) {
      Monarch.Util.each(keys, optional_each_function);
    }
    return keys;
  },

  values: function(hash, optional_each_function) {
    var values = [];
    for (key in hash) values.push(hash[key]);
    if (optional_each_function) {
      Monarch.Util.each(values, optional_each_function);
    }
    return values;
  }
});

})(Monarch);
