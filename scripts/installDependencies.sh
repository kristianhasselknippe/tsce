#!/bin/bash

cd "$(dirname "$0")"
pushd ../tsce
npm install typescript -g
npm install
popd
