#!/usr/bin/env bash
# Copies the web game (web/) into the Android wrapper's asset folder.
# Run this after any change under web/ and before building the Android app.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/web"
DEST="$ROOT/android/app/src/main/assets/www"

rm -rf "$DEST"
mkdir -p "$DEST/js" "$DEST/assets"
cp "$SRC/index.html" "$SRC/styles.css" "$SRC/beach-overrides.css" "$SRC/engagement.css" "$SRC/manifest.webmanifest" "$DEST/"
cp "$SRC"/js/*.js "$DEST/js/"
# Only the 192px icon is used in-app. The 512px icon and the service worker are PWA-only
# (the Android shell bundles every file, so it needs no offline cache).
cp "$SRC/assets/icon-192.png" "$SRC/assets/surge-wave.jpg" "$DEST/assets/"

echo "Synced web/ -> android/app/src/main/assets/www ($(du -sh "$DEST" | cut -f1))"
