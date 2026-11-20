#!/bin/sh
set -eu
cd "$(dirname "$0")"
asset_dir=$(node ../../studio.mjs build)
mkdir -p Bundle
# Mirror exactly the current catalog, including removal of withdrawn games.
rsync -a --delete "$asset_dir/" Bundle/www/
xcodegen generate --spec project.yml
