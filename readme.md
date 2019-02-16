# TSCE

[![Build Status](https://travis-ci.org/kristianhasselknippe/tsce.svg?branch=master)](https://travis-ci.org/kristianhasselknippe/tsce)

A TypeScript to Emacs Lisp transpiler

## Usage

### Creating a new project

To create a new project, create a new folder to act as the project root folder and run the following command in it:

```
tsce init <projectName>
```

This gives a folder structure as follows:

```
- rootFolder
    - tsconfig.json
    - src
        - <projectName>.ts
    - dist
```

### Compiling project

Compile the project by running:

```
tsce <path to tsconfig.json>
```

or just

```
tsce
```

in the project root folder.

The output of the compile will then appear in the `dist` folder.

## Creating release

```
cd tsce
tsc
npm pack
```

## Missing language features

- classes
- async/await
- ternary operator (cond ? expr : expr)
- namespaces
- for-in statements
- while statements

## Dependencies

Requires Emacs version >=25.1 and NodeJS

## Why?

I wanted to write more emacs packages, but I hate working without static type checking. Typescript has a flexible enough type system that it could be viable as a compiler frontend, and the typescript compiler API is very accessible.

## Sorry about the mess

This is currently a very hack'n slash thing until i figure out a proper architecture.
