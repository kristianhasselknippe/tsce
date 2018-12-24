#pushd ./tsce
#tsc
#popd

node tsce/dist/index.js ./tests/config.tsceproj
pushd ./tests/dist
emacs --debug-init --batch --directory ./  --script ./guileTests.el
popd
