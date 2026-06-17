#!/usr/bin/env bash
set -euo pipefail
APP="$(dirname "$0")/../src-tauri/target/release/bundle/macos/Battery Life Guest.app"
if [[ ! -d "$APP" ]]; then
  echo "Сначала собери: npm run tauri:build:app" >&2
  exit 1
fi
open "$APP"
