#pushd ./tsce
#tsc
#popd

node tsce/dist/index.js ./tests/tsconfig.json
pushd ./tests/dist
emacs --debug-init --batch --directory ./  --script ./tests.el
popd
