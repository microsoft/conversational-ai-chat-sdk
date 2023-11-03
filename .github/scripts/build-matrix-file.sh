#!/bin/bash

# Build matrix

echo [] > ./matrix.json

for path in $(cat ./package.json | jq -cr '.workspaces | .[]')
do
  echo ::group::$path

  cat package.json

  # Example: version=0.0.0-main.20230815-110805.bf2b81
  version=$(cat package.json | jq -r .version)

  cat ./matrix.json | jq \
    --arg path "$path" \
    --arg version "$version" \
    --argfile packageJSON ./$path/package.json \
    -r \
    '. + [{ name: $packageJSON.name, path: $path, private: ($packageJSON.private // false), tarball: ($packageJSON.name + "-" + $version + ".tgz"), version: $version }]' \
    > ./matrix.json.tmp

  mv ./matrix.json.tmp ./matrix.json

  echo ::endgroup::
done

cat ./matrix.json

# Sanity check: matrix should list all workspaces

cat ./matrix.json | jq \
  --argfile packageJSON ./package.json \
  'if (. | map(.path)) == ($packageJSON.workspaces) then empty else halt_error(1) end'

# Sanity check: all entries must have "name" field
cat ./matrix.json | jq 'if map(select(.name | not)) | length == 0 then empty else halt_error(1) end'

# Sanity check: all entries must have "path" field
cat ./matrix.json | jq 'if map(select(.path | not)) | length == 0 then empty else halt_error(1) end'

# Sanity check: all entries must have "tarball" field
cat ./matrix.json | jq 'if map(select(.tarball | not)) | length == 0 then empty else halt_error(1) end'

# Sanity check: all entries must have "version" field
cat ./matrix.json | jq 'if map(select(.version | not)) | length == 0 then empty else halt_error(1) end'

# Sanity check: at least one entry marked as non-private
cat ./matrix.json | jq 'if map(select(.private | not)) | length > 0 then empty else halt_error(1) end'
