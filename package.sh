#!/bin/bash

echo "Cleaning build environment..."
rm -rf dist
mkdir dist

echo "Building Firefox extension..."
cp -r src dist/firefox
cd dist/firefox
zip -rq ../Firefox.zip *
cd ../..

echo "Building Chrome extension..."
cp -r src dist/chrome
cat src/manifest.json | jq 'del(.applications)' > dist/chrome/manifest.json
cd dist/chrome
zip -rq ../Chrome.zip *
cd ../..

echo "Done!"