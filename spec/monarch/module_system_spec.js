//= require "../monarch_spec_helper"

Screw.Unit(function(c) { with(c) {
  describe("Monarch.ModuleSystem", function() {
    before(function() {
      Monarch.ModuleSystem.__disabled__Object = Monarch.ModuleSystem.Object;
      delete Monarch.ModuleSystem.Object;
    });

    after(function() {
      Monarch.ModuleSystem.Object = Monarch.ModuleSystem.__disabled__Object;
      delete Monarch.ModuleSystem.__disabled__Object;
      delete window.Foo;
    });


    describe(".constructor", function() {
      it("assigns a 'basename' property to the created constructor", function() {
        Monarch.ModuleSystem.constructor("Foo");
        expect(Foo.basename).to(equal, "Foo");
        Monarch.ModuleSystem.constructor("Foo.Bar");
        expect(Foo.Bar.basename).to(equal, "Bar");
      });

      context("when not given a name", function() {
        before(function() {
          Monarch.ModuleSystem.Object = Monarch.ModuleSystem.__disabled__Object;
        })

        it("creates an anonymous constructor which inherits from Object, defining the given properties on its prototype", function() {
          var constructor = Monarch.ModuleSystem.constructor({
            foo: "foo",
            bar: "bar"
          });

          expect(constructor.prototype instanceof Monarch.ModuleSystem.Object).to(be_true);
          expect(constructor.prototype.foo).to(equal, "foo");
          expect(constructor.prototype.bar).to(equal, "bar");
        });
      });

      context("when given a top-level name and a properties hash", function() {
        before(function() {
          Monarch.ModuleSystem.Object = Monarch.ModuleSystem.__disabled__Object;
        })

        it("creates a constructor with that name which inherits from Object, defining the given properties on its prototype", function() {
          expect(window['Foo']).to(be_undefined);

          Monarch.ModuleSystem.constructor("Foo", {
            foo: "foo",
            bar: "bar"
          });

          expect(Foo).to_not(be_undefined);
          expect(Foo.prototype instanceof Monarch.ModuleSystem.Object).to(be_true);
          expect(Foo.prototype.foo).to(equal, "foo");
          expect(Foo.prototype.bar).to(equal, "bar");
        });
      });

      context("when given a qualified name and a properties hash", function() {
        context("when no modules along the given path exist", function() {
          it("creates all modules along the path and creates the constructor at its terminus whose prototype has the given properties", function() {
            expect(window['Foo']).to(be_undefined);

            Monarch.ModuleSystem.constructor("Foo.Bar.Baz", {
              foo: "foo",
              bar: "bar"
            });

            expect(Foo).to_not(be_undefined);
            expect(Foo.Bar).to_not(be_undefined);
            expect(Foo.Bar.Baz).to_not(be_undefined);
            expect(Foo.Bar.Baz.prototype.foo).to(equal, "foo");
            expect(Foo.Bar.Baz.prototype.bar).to(equal, "bar");
          });
        });

        context("when modules along the given path exists, but not the terminus", function() {
          before(function() {
            Monarch.ModuleSystem.module("Foo", {
              foo: "foo"
            });
          });

          it("creates any module that does not yet exist, but leaves existing modules intact", function() {
            Monarch.ModuleSystem.constructor("Foo.Bar.Baz", {
              foo: "foo",
              bar: "bar"
            });

            expect(Foo.foo).to_not(be_undefined);
            expect(Foo.Bar.Baz).to_not(be_undefined);
            expect(Foo.Bar.Baz.prototype.foo).to(equal, "foo");
            expect(Foo.Bar.Baz.prototype.bar).to(equal, "bar");
          });
        });
      });

      context("when given a superconstructor as its second argument", function() {
        before(function() {
          Monarch.ModuleSystem.constructor("Super", {});
        });

        after(function() {
          delete window["Super"];
        });

        it("extends the constructor being defined from the given superconstructor", function() {
          mock(Monarch.ModuleSystem, 'extend');
          Monarch.ModuleSystem.constructor("Foo", Super, {});
          expect(Monarch.ModuleSystem.extend).to(have_been_called, with_args(Super, Foo));
        });

        context("if .extended is defined as a constructor property on the superconstructor", function() {
          it("it calls the method with the subconstructor after the subconstructor has been fully defined", function() {
            var constructor;
            Super.extended = mock_function("Super.extended", function() {
              expect(window.Foo).to_not(be_undefined);
              expect(window.Foo.foo).to(equal, "foo");
            });
            constructor = Monarch.ModuleSystem.constructor("Foo", Super, {
              constructor_properties: {
                foo: "foo"
              }
            });
            expect(Super.extended).to(have_been_called, with_args(Foo));
          });
        });
      });

      context("when given modules as arguments following the name", function() {
        before(function() {
          Monarch.ModuleSystem.module("Bar", { bar: "bar" });
          Monarch.ModuleSystem.module("Baz", { baz: "baz" });
        });

        after(function() {
          delete window["Bar"];
          delete window["Baz"];
        });

        it("mixes the given module into the constructor's prototype", function() {
          mock(Monarch.ModuleSystem, "mixin");

          Monarch.ModuleSystem.constructor("Foo", Bar, Baz, { quux: 'quux' });

          expect(Monarch.ModuleSystem.mixin).to(have_been_called, thrice);
          expect(Monarch.ModuleSystem.mixin.call_args[0]).to(equal, [Foo.prototype, Bar]);
          expect(Monarch.ModuleSystem.mixin.call_args[1]).to(equal, [Foo.prototype, Baz]);
        });
      });

      context("when an #initialize method is defined on the prototype", function() {
        before(function() {
          Monarch.ModuleSystem.constructor("Foo", {
            initialize: mock_function("initialize method")
          });
        });

        it("causes the constructor to invoke #initialize with its arguments", function() {
          new Foo("foo", "bar");
          expect(Foo.prototype.initialize).to(have_been_called, with_args("foo", "bar"));
        });
      });

      context("when a #constructor_initialize property is defined on the prototype", function() {
        var constructor_initialize;

        before(function() {
          constructor_initialize = mock_function('constructor_initialize')
          Monarch.ModuleSystem.constructor("Foo", {
            constructor_initialize: constructor_initialize
          });
        });

        it("calls it on the constructor", function() {
          expect(constructor_initialize).to(have_been_called, on_object(Foo));
        });

        it("moves it to the #constructor_properties hash and deletes it from the prototype", function() {
          expect(Foo.prototype.constructor_initialize).to(be_undefined);
          expect(Foo.prototype.constructor_properties.initialize).to(equal, constructor_initialize);
        });
      });

      context("when a #constructor_properties property is defined on the prototype", function() {
        it("defines those properties on the constructor itself", function() {
          Monarch.ModuleSystem.constructor("Foo", {
            constructor_properties: {
              foo: "foo"
            }
          });

          expect(Foo.foo).to(equal, "foo");
        });

        context("when there is an #initialize constructor property", function() {
          it("invokes the initializer after the constructor is fully assembled", function() {
            Monarch.ModuleSystem.constructor("Foo", {
              constructor_properties: {
                initialize: function() {
                  if (!this.prototype.foo) throw new Error("prototype should be assembled");
                  this.eigen_initialize_called = true;
                }
              },
              
              foo: "foo"
            });

            expect(Foo.eigen_initialize_called).to(be_true);
          });
        });
      });

      context("when a #constructor_properties properties are defined on the superconstructor and the mixed-in modules", function() {
        var mixin_module, subconstructor_prototype;

        before(function() {
          Monarch.ModuleSystem.constructor("Super", {
            constructor_properties: {
              foo: "foo super",
              bar: "bar super",
              boing: "boing"
            }
          });

          mixin_module = {
            constructor_properties: {
              bar: "bar module",
              baz: "baz module"
            }
          };

          subconstructor_prototype = {
            constructor_properties: {
              foo: "foo sub",
              baz: "baz sub",
              bop: "bop"
            }
          };

          Monarch.ModuleSystem.constructor("Sub", Super, mixin_module, subconstructor_prototype);
        });

        after(function() {
          delete window['Super'];
          delete window['Sub'];
        });

        it("combines the constructor properties into a 'constructor_properties' hash on the prototype of the defined constructor, giving precmonarchce to modules included later", function() {
          expect(Sub.prototype.constructor_properties).to(equal, {
            foo: "foo sub",
            bar: "bar module",
            baz: "baz sub",
            bop: "bop",
            boing: "boing"
          });
        });

        it("defines the merged constructor properties as properties on the defined constructor itself", function() {
          expect(Sub.foo).to(equal, "foo sub");
          expect(Sub.bar).to(equal, "bar module");
          expect(Sub.baz).to(equal, "baz sub");
          expect(Sub.bop).to(equal, "bop");
          expect(Sub.boing).to(equal, "boing");
        });
        
        it("does not mutate the 'constructor_properties' hashes on the superconstructor or any of the included modules", function() {
          expect(Super.prototype.constructor_properties).to(equal, {
            foo: "foo super",
            bar: "bar super",
            boing: "boing"
          });

          expect(mixin_module.constructor_properties).to(equal, {
            bar: "bar module",
            baz: "baz module"
          });;

          expect(subconstructor_prototype.constructor_properties).to(equal, {
            foo: "foo sub",
            baz: "baz sub",
            bop: "bop"
          });
        });
      });
    });

    describe(".module", function() {
      context("when given a top-level name and a properties hash", function() {
        context("when no module with that name is defined", function() {
          it("defines a new top level module by the given name with the properties", function() {
            expect(window['Foo']).to(be_undefined);
            Monarch.ModuleSystem.module("Foo", {
              foo: "foo",
              bar: "bar"
            });
            expect(Foo).to_not(be_undefined);
            expect(Foo.foo).to(equal, "foo");
            expect(Foo.bar).to(equal, "bar");
          });
        });

        context("when a module with that name is already defined", function() {
          before(function() {
            expect(window['Foo']).to(be_undefined);
            Monarch.ModuleSystem.module("Foo", {
              foo: "foo",
              bar: "bar"
            });
          });

          it("mixes the given properties into the existing module", function() {
            Monarch.ModuleSystem.module("Foo", {
              bar: "bar2",
              baz: "baz"
            });
            expect(Foo.foo).to(equal, "foo");
            expect(Foo.bar).to(equal, "bar2");
            expect(Foo.baz).to(equal, "baz");
          });
        });
      });

      context("when given a qualified module name and a properties hash", function() {
        context("when no modules along the given path exist", function() {
          it("creates all modules along the path and installs the properties at its terminus", function() {
            expect(window['Foo']).to(be_undefined);

            Monarch.ModuleSystem.module("Foo.Bar.Baz", {
              foo: "foo",
              bar: "bar"
            });

            expect(Foo).to_not(be_undefined);
            expect(Foo.Bar).to_not(be_undefined);
            expect(Foo.Bar.Baz).to_not(be_undefined);
            expect(Foo.Bar.Baz.foo).to(equal, "foo");
            expect(Foo.Bar.Baz.bar).to(equal, "bar");
          });
        });

        context("when modules along the given path exists, but not the terminus", function() {
          before(function() {
            Monarch.ModuleSystem.module("Foo", {
              foo: "foo"
            });
          });

          it("creates any module that does not yet exist, but leaves existing modules intact", function() {
            Monarch.ModuleSystem.module("Foo.Bar.Baz", {
              foo: "foo",
              bar: "bar"
            });
            
            expect(Foo.foo).to_not(be_undefined);
            expect(Foo.Bar.Baz).to_not(be_undefined);
            expect(Foo.Bar.Baz.foo).to(equal, "foo");
            expect(Foo.Bar.Baz.bar).to(equal, "bar");
          });
        });

        context("when all modules, including the terminus, exist", function() {
          before(function() {
            Monarch.ModuleSystem.module("Foo.Bar.Baz", {
              foo: "foo",
              bar: "bar"
            });
          });

          it("mixes the given properties into the existing modules", function() {
            Monarch.ModuleSystem.module("Foo.Bar.Baz", {
              bar: "bar2",
              baz: "baz"
            });

            expect(Foo.Bar.Baz.foo).to(equal, "foo");
            expect(Foo.Bar.Baz.bar).to(equal, "bar2");
            expect(Foo.Bar.Baz.baz).to(equal, "baz");
          });
        });
      });
    });

    describe(".extend", function() {
      var object;

      before(function() {
        Monarch.ModuleSystem.constructor("Super", {
          constructor_properties: {
            superconstructor_property: "superconstructor_property",
            extended: mock_function()
          },

          initialize: mock_function(),

          not_overridden_function: function() {
            return "not_overridden_function";
          },

          overridden_function: function() {
            return "overridden_function superconstructor version";
          },

          overridden_property: "overridden_property superconstructor version",
          not_overridden_property: "not_overridden_property"
        });

        Monarch.ModuleSystem.constructor("Sub", {
          constructor_properties: {
            subconstructor_property: 'subconstructor_property'
          },

          overridden_function: function() {
            return "overridden_function";
          },

          overridden_function: function() {
            return "overridden_function subconstructor version";
          },

          overridden_property: "overridden_property subconstructor version",

          sub_only_function: function() {
            return "sub_only_function";
          },

          sub_only_property: "sub_only_property"
        });

        Monarch.ModuleSystem.extend(Super, Sub);

        object = new Sub();
      });

      after(function() {
        delete window['Super'];
        delete window['Sub'];
      });

      it("does not invoke the superconstructor's initialize method when creating the prototypical object", function() {
        Super.prototype.initialize.clear();
        Monarch.ModuleSystem.extend(Super, Sub);
        expect(Super.prototype.initialize).to_not(have_been_called);
      });

      describe("functions and properties on the superconstructor prototype that are not overridden in the subconstructor prototype", function() {
        they("are inherited by objects created by the subconstructor", function() {
          expect(object.not_overridden_function()).to(equal, "not_overridden_function");
          expect(object.not_overridden_property).to(equal, "not_overridden_property");
        });
      });

      describe("functions and properties on the superconstructor prototype that are overridden in the subconstructor prototype", function() {
        they("are overridden for objects created by the subconstructor", function() {
          expect(object.overridden_function()).to(equal, "overridden_function subconstructor version");
          expect(object.overridden_property).to(equal, "overridden_property subconstructor version");
        });
      });

      context("if an 'constructor_properties' property is defined on the superconstructor's prototype", function() {
        it("merges the the constructor_properties of the subconstructor into a copy of those defined on the superconstructor, without mutating the constructor_properties of the superconstructor", function() {
          expect(Sub.prototype.constructor_properties).to(equal, {
            superconstructor_property: 'superconstructor_property',
            subconstructor_property: 'subconstructor_property',
            extended: Super.extended
          });

          expect(Super.prototype.constructor_properties).to(equal, {
            superconstructor_property: 'superconstructor_property',
            extended: Super.extended
          });
        });
      });
    });

    describe(".mixin", function() {
      it("adds all the properties in the second module to the first, overwriting any with the same name, with the exception of the 'constructor' property", function() {
        var a = {
          foo: "foo",
          bar: "bar",
          constructor: '1'
        };

        var b =  {
          bar: "bar2",
          baz: "baz",
          constructor: '2'
        };

        var result = Monarch.ModuleSystem.mixin(a, b);
        expect(result).to(equal, a);

        expect(a.constructor).to(equal, 1);
        expect(a.foo).to(equal, "foo");
        expect(a.bar).to(equal, "bar2");
        expect(a.baz).to(equal, "baz");
      });

      it("mixes constructor_properties defined in the second module into constructor_properties defined on the first, rather than overwriting them", function() {
        var a = {
          constructor_properties: {
            foo: "foo",
            bar: "bar"
          }
        };

        var b =  {
          constructor_properties: {
            bar: "bar2",
            baz: "baz"
          }
        };

        Monarch.ModuleSystem.mixin(a, b);
        expect(a.constructor_properties.foo).to(equal, "foo");
        expect(a.constructor_properties.bar).to(equal, "bar2");
        expect(a.constructor_properties.baz).to(equal, "baz");
      });
    });
  });
}});
