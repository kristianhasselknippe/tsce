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
- namespaces
- for-in statements
- npm
- switch statements

## Dependencies

Requires Emacs version >=25.1 and NodeJS

## Why?

I wanted to write more emacs packages, but I prefer working with static type checking. TypeScript has a flexible enough type system that it could be viable as a compiler frontend for elisp, and the typescript compiler API is very accessible.


## Goals (short term)

- Convert a large enough subset of TypeScript to Elisp to be usefull in the creation of new packages.
- Output readable Elisp code.

## Stretch goals

- Support, if possible, the entire TypeScript language
