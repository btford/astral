
var deepApply = require('./lib/deep-apply');

var Astral = function () {
  this._passes = {};
  this._info = {};
};

Astral.prototype.register = function (pass) {
  if (!pass.name) {
    throw new Error("Expected pass to have a name");
  }
  this._passes[pass.name] = pass;
};

Astral.prototype.run = function (ast) {

  this._order().forEach(function (name) {
    this._runPass(name, ast);
  }, this);

  return ast;
};

Astral.prototype._runPass = function (name, ast) {
  var pass = this._passes[name];
  if (pass.type === 'info') {
    return this._runInfoPass(pass, name);
  }
  if (pass.type === 'transform') {
    return this._runTransformPass(pass, name);
  }
  return new Error("Expected '" + name + "' to have type of either 'info' or 'transform'");
};

Astral.prototype._runInfoPass = function (pass, ast) {
  var info = this._info;
  deepApply(ast, pass._matches, function (chunk) {
    pass._doer(info, clone(chunk));
  });
};

Astral.prototype._runTransformPass = function (pass, ast) {
  var info = clone(this._info);
  deepApply(ast, pass._matches, function (chunk) {
    pass._doer(chunk, info);
  });
};

// order the passes
Astral.prototype._order = function (ast) {

  var order = [];
  var toOrder = Object.keys(this._passes).length;
  var progress = false;

  do {

  } while (progress || toOrder.length > 0);

  if (toOrder > 0) {
    return new Error("Unable to order " + toOrder.toString());
  }

  // TODO: ordering constraints
  for (var name in this._passes) {
    if (this._passes.hasOwnProperty(name)) {
      this._passes[name](ast);
    }
  }

  return order;
};

module.exports = function () {
  return new Astral();
};
