# Astral

AST tooling framework for JavaScript focused on modularity and performance.
Inspired by llvm.

## How it Works

Various [passes](https://github.com/btford/astral-pass) are registered in Astral.
Esprima (parser) creates AST.
Astral runs the passes in order based on their prerequisites.

## Example

```javascript
var esprima = require('esprima');
var escodegen = require('escodegen');

var astral = require('astral')();
var myPass = require('astral-pass')();

myPass.name = 'myPass';

myPass.
  when({
    // ... AST chunk
  }).
  when(function (chunk, info) {
    // return true or false
  }).
  transform(function (chunk, info) {

  });

astral.register(myPass);

var ast = esprima.parse('var x = 42;');

var newAst = astral.run(ast);

var newSrc = escodegen.generate(newAst);

console.log(newSrc);
```

## License
MIT
