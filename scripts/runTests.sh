#!/bin/bash

cd "$(dirname "$0")"

set -e

pushd ../tsce
tsc
npm test
popd
node ../tsce/dist/index.js ../tests/tsconfig.json
pushd ../tests/dist
emacs --debug-init --batch --directory ./ --script ./tests.el -f ert-run-tests-batch-and-exit
popd
