
var Astral = function () {
  this._passes = {};
};

Astral.prototype.register = function (pass) {
  if (!pass.name) {
    throw new Error("Expected pass to have a name");
  }
  this._passes[pass.name] = pass;
};

Astral.prototype.run = function (ast) {

  // TODO: ordering constraints
  for (var name in this._passes) {
    if (this._passes.hasOwnProperty(name)) {
      this._passes[name](ast);
    }
  }

  return ast;
};

module.exports = function () {
  return new Astral();
};
