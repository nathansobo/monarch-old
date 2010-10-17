---
title: Monarch
layout: default
---

#Monarch#

Monarch is a framework for developing single-page web applications. It consists of a pure javascript client-side library, as well as a server-side Sinatra extension designed to interoperate with that client.

##Overview##
Monarch's most unique feature is its model framework, which is based entirely on the relational model. It includes a client-side relational database and a relational-algebra-based API for querying it. Much like in ActiveRecord, client side models are expressed in terms of tables, columns, and foreign key relationships. Monarch models support the familiar `hasMany` and `belongsTo` macros, as well as more complex relationships defined via algebraic expressions.

{% highlight javascript %}
_.constructor("BlogPost", Monarch.Model.Record, {
  constructorInitialize: function() {
    this.columns({
      blogId: 'key',
      title: 'key',
      body: 'string',      
    })
    
    this.belongsTo('blog');
    this.hasMany('comments');
    this.hasMany('commenters', { 
      through: 'comments',
      constructorName: 'User'
      joinColumn: 'userId',
    });
  }  
});


var post = BlogPost.find(1);
post.comments().each(function(comment) {
  console.debug(comment.body());
});
{% endhighlight %}

But unlike ActiveRecord, the Monarch API also has support for events. You can attach handlers for insert, update, and remove events on any relation.

{% highlight javascript %}
post.comments().onInsert(function(comment) {
  console.debug("New comment added:", comment.body());
});

post.comments().onUpdate(function(comment, changes) {
  console.debug("Comment changed:");
  console.debug("was:", changes.body.oldValue);
  console.debug("is now:", changes.body.newValue);  
});

post.comments().onRemove(function(comment), function() {
  console.debug(comment.body(), "removed")
});
{% endhighlight %}

This allows you to specify event streams declaratively, letting the framework take care of the details. In the example above, insert and remove events could fire for multiple reasons. Either a comment was created or destroyed, or a comment's `blogPostId` key could be updated to move it from one post to another.


##Model##

###Defining Record Constructors###

Define record constructors by inheriting from Monarch.Model.Record. In the constructor's initialize method, use constructor methods to define columns and relationships with other types of records.


{% highlight javascript %}
_.constructor("BlogPost", Monarch.Model.Record, {
  constructorInitialize: function() {
    this.columns({
      blogId: 'key',
      title: 'key',
      body: 'string',      
    })
    
    this.belongsTo('blog');
    this.hasMany('comments');
  }  
});
{% endhighlight %}


Some of the examples that follow are in the form `ConstructorName.method()`, but their suggested use is in the constructor initialize method as above.

####columns(nameTypeHash)
Defines columns on the record constructor's associated client-side table. Pass a hash with column names as its keys and their types as its values. Supported types are:

* key, for foreign keys to other records
* integer
* float
* string
* datetime, which will coerce integer timestamps to javascript date objects

####belongsTo(name, options)####
Defines a one-to-one relationship with another table. Instance records will have an accessor method for records in the associated table.


{% highlight javascript %}
// Assuming BlogPost.belongsTo('blog')
record.blogId() // => 1
var newBlog = Blog.find(2);
record.blog(newBlog);
record.blogId() // => 2
record.blog() === newBlog // => true
{% endhighlight %}

##### Options #####
constructorName: if the name of the constructor cannot be inferred from the foreign key, you must specify it. For example, if a key 'creatorId' refers to a user, you must specify { constructorName: 'User' }.

####hasMany(name, options)####
Defines a one to many relationship with another table. Instance records will have a reader method that returns the appropriate relation based on the current record's id.

##### Options #####
orderBy: order the resulting relation by passing a single ordering condition or an array of multiple conditions. Conditions are formatted "columnName [asc|desc], with ascending as the default. For example: `User.hasMany("pets", {orderBy: "birthDate desc"}")`.

table: if the table name can't be inferred from the name of the relationship, you need to specify it. For example: `User.hasMany("pets", {table: "animals"})

key: if the foreign key on the target table does not refer to the current table by name, you need to specify it. For example: `User.hasMany("pets", {table: "animals", key: "ownerId"})`

####relatesToMany(name, definition)####
Defines arbitrary relational algebra expressions that are associated with instance records. The following example expresses a complex relation involving multiple joins, a need that couldn't be anticipated by a macro like hasMany or hasMany through:


{% highlight javascript %}
User.relatesToMany("samePetTypeOwners", function() {
  return this.pets().
    joinTo(Species).
    joinTo(Animal).
    join(User).on({ownerId: 'id'});
});
{% endhighlight %}

####syntheticColumn(name, definition)####
Defines a synthetic column, which is a column that only exists on the client side model and is never involved in communications with the server. Synthetic columns are defined in terms of signals. For example, you might define a synthetic column called fullName, which concatenated the firstName and lastName fields. Whenever the first or last name were updated, change events would also fire for the fullName, allowing you to subscribe to it like any other column.


{% highlight javascript %}

User.syntheticColumn('fullName', function() {
  return this.signal('firstName', 'lastName', function(firstName, lastName) {
    return firstName + " " + lastName;
  };
});

{% endhighlight %}

###Methods On Tables And Relations###

####create(propertiesHash)####
Sends a create command to the server and returns a future. When the server responds that the record has been created, callbacks bound to future are triggered.


{% highlight javascript %}

Animal.create({ name: "fido", speciesId: 3 })
  .onSuccess(function(pet) {
    console.debug("Fido created! His id is", pet.id());
  });

{% endhighlight %}

Calling create as above sends a POST to "/repository/mutate" with the following data

{% highlight javascript %}
{ operations: [["create", "animals", {name: "fido", species_id: 3} ]]  }
{% endhighlight %}

The Monarch Sinatra extension can automatically authorize and perform this operation based on the current user's exposed repository, or you can roll your own server action to interpret the request.

See the section on the [[client server protocol]] for details.

####localCreate(propertiesHash)####
Creates a record locally, but does not send a request to the server yet. The record will be created remotely as soon as `#save` is called on it, and until that time it will not have an id. This is useful when you want to batch the creation of multiple objects. You can create them locally and then save them in a single operation with Server.save.












###Record Methods###



####Working With Relations####

####find(conditions)
Returns a single record based on the given conditions. Can be passed a single records id, a hash of column name and value pairs, or a predicate object.


{% highlight javascript %}
Animal.find(3); // using an id
Animal.find({name: "Fido"}); // using a hash of column name, value pairs
Animal.find(Animal.age.lt(3)); // using a predicate
{% endhighlight %}



to do:
add has many through
implement better combined signal api
get rid of onRemote events