#!/bin/bash

set -e

cd "$(dirname "$0")"

if [ -d "../tests/dist" ]; then
	echo "Cleaning output folder"
	rm -r ../tests/dist/
fi
echo "Building test project"
node ../tsce/dist/index.js "../tests/tsconfig.json"
echo "Pushing output dir"
pushd ../tests/dist
echo "Running elisp tests"
emacs --debug-init --batch --directory ./ --script ./tests.el -f ert-run-tests-batch-and-exit
