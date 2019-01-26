# TSCE

[![Build Status](https://travis-ci.org/kristianhasselknippe/tsce.svg?branch=master)](https://travis-ci.org/kristianhasselknippe/tsce)

Typescript to Elisp compiler

Requires Emacs version >=25.1

## Creating release

- cd tsce
- tsc
- npm pack

## Missing features

- Classes
- Async/await
- NPM package support
- A bunch of smaller things
- Documentation

## Why?
I wanted to write more emacs packages, but I hate working without static type checking. Typescript has a flexible enough type system that it could be viable as a compiler frontend, and the typescript compiler API is very accessible.

## Sorry about the mess

This is currently a very hack'n slash thing until i figure out a proper architecture.
