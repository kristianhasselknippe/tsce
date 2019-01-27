#!/bin/sh

cd "$(dirname "$0")"
echo "Building test project"
node ../tsce/dist/index.js "../tests/tsconfig.json"
echo "Pushing output dir"
pushd ../tests/dist
echo "Running elisp tests"
emacs --debug-init --batch --directory ./ --script ./tests.el -f ert-run-tests-batch-and-exit
