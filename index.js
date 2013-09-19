var clone = require('clone'),
    fs = require('fs'),
    mozSourceMap = require('source-map'),
    SourceMapConsumer = mozSourceMap.SourceMapConsumer,
    SourceMapGenerator = mozSourceMap.SourceMapGenerator;

var Astral = function (options) {
  options = options || {};
  this._passes = {};
  this._info = {};
  this._options = options;
  if (options.sourceMapIn) {
    // This could throw, this is not strictly safe.
    // TODO: Be more careful
    this._sourceMapIn = JSON.parse(fs.readFilesSync(options.sourceMapIn));
    this._consumers = [new SourceMapConsumer(this._sourceMapIn)];
  }
  if (options.sourceMap && options.outputFile) {
    if (!this._consumers) {
      this._consumers = [];
    }
    this._generator = new SourceMapGenerator({
      file: options.outputFile,
      sourceRoot: options.sourceMapRoot
    });
  }
};

Astral.prototype.register = function (pass) {
  if (!pass.name) {
    throw new Error("Expected '" + pass.name + "' pass to have a name");
  }
  if (!pass.run) {
    throw new Error("Expected '" + pass.name + "' pass to have a 'run' method");
  }
  if (!pass.prereqs || !(pass.prereqs instanceof Array)) {
    throw new Error("Expected '" + pass.name + "' pass to have a 'prereqs' Array");
  }
  this._passes[pass.name] = pass;
};

// modifies the original AST
Astral.prototype.run = function (ast) {

  this._order().forEach(function (pass) {
    this._transformations = 0;
    this._info[pass.name] = pass.run(ast, clone(this._info));

    if (this._transformations) {
      // Apply previous consumers to the current one
      this._consumers.forEach(function(consumer) {
        this._generator.applySourceMap(consumer);
      });

      // Add the current generator to the set of consumers
      this._consumers.unshift(this._generator);
      this._generator = new SourceMapGenerator({
        file: this.options.outputFile,
        sourceRoot: this.options.sourceMapRoot
      });
    }
  }, this);

  // Write source map to file.
  if (this._consumers.length && this.options.sourceMap) {
    fs.writeFileSync(this.options.sourceMap, this._consumers[0].toString());
  }

  // Dereference generator and consumers
  this._generator = undefined;
  this._consumers.length = 0;
  this._consumers = undefined;

  return ast;
};

Astral.prototype.map = function(generatedLine, generatedColumn,
                                sourceLine, sourceColumn, name) {
  if (!this._generator) {
    // If there is no generator, return to caller, transparently.
    return;
  }

  // All passes should be dealing with the same source file.
  // As such, the 'source' parameter may be conveniently omitted.
  //
  // 'generatedLine' and 'generatedColumn' refer to the positions of the token in the
  // generated file.
  //
  // 'sourceLine' and 'sourceColumn' refer to the source positions
  //
  // 'name' is an optional token name.
  if (arguments.length < 4) {
    // At a minimum, 4 arguments are needed.
    return;
  }
  if (['string', 'undefined'].indexOf(typeof name) < 0) {
    // If token name isn't a string or omitted, return.
    return;
  }

  // Push a new transformation
  ++this._transformations;
  this._generator.addMapping({
    generated: {
      line: generatedLine,
      column: generatedColumn
    },
    original: {
      line: sourceLine,
      column: sourceColumn
    },
    source: this._sourceFile,
    name: name
  });
};

// returns the passes in order based on prereqs
Astral.prototype._order = function (ast) {

  var passes = this._passes;

  var order = [];

  var toOrder = Object.keys(passes).map(function (name) {
    return passes[name];
  }, this);

  var progress = false;

  do {
    var add = toOrder.filter(function (pass) {
      return !pass.prereqs.
        map(function (prereq) {
          return passes[prereq];
        }).
        filter(function (prereq) {
          return prereq;
        }).
        some(function (prereq) {
          return order.indexOf(prereq) === -1;
        });
    });
    if (add.length > 0) {
      progress = true;
      
      order = order.concat(add);
      add.forEach(function (a) {
        toOrder.splice(toOrder.indexOf(a), 1);
      });
    }
  } while (toOrder.length > 0 && progress);


  if (toOrder > 0) {
    return new Error("Unable to order " + toOrder.toString());
  }

  return order;
};

module.exports = function (options) {
  return new Astral(options);
};
