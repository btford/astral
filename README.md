# Astral

AST tooling framework for JavaScript.
Inspired by llvm.

## How it Works

Various "passes" are registered in Astral.
Esprima (parser) creates AST.
Astral runs the passes in order based on their prerequisites.

