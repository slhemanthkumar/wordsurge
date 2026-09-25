#!/usr/bin/env bash
# Release build: sync web assets, lint, build the signed AAB, verify it, write outputs to release/.
# Requires JDK 17, Android SDK 36 (+ build-tools 36.0.0) and the WORDSURGE_* signing variables
# (see android/signing.env.example). tools/setup-toolchain.sh installs the toolchain into /var/tmp.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/release"

for v in WORDSURGE_KEYSTORE WORDSURGE_STORE_PASSWORD WORDSURGE_KEY_ALIAS WORDSURGE_KEY_PASSWORD; do
  [[ -n "${!v:-}" ]] || { echo "Missing $v — run: source android/signing.env" >&2; exit 1; }
done

"$ROOT/tools/sync-web.sh"
cd "$ROOT/android"
./gradlew --no-daemon clean lintRelease bundleRelease

VERSION="$(sed -n "s/.*versionName '\(.*\)'.*/\1/p" app/build.gradle)"
mkdir -p "$OUT"
cp app/build/outputs/bundle/release/app-release.aab "$OUT/WordSurge-v$VERSION-release.aab"
cp app/build/outputs/mapping/release/mapping.txt "$OUT/WordSurge-v$VERSION-mapping.txt"

"${JAVA_HOME:+$JAVA_HOME/bin/}jarsigner" -verify "$OUT/WordSurge-v$VERSION-release.aab" | tail -1
(cd "$OUT" && sha256sum "WordSurge-v$VERSION-release.aab" "WordSurge-v$VERSION-mapping.txt" | tee "WordSurge-v$VERSION-SHA256.txt")
echo "Release bundle written to $OUT"
echo "Sideload test APK (optional): java -jar \${BUNDLETOOL:-bundletool.jar} build-apks --mode=universal --bundle=$OUT/WordSurge-v$VERSION-release.aab --output=/tmp/ws.apks --ks=\$WORDSURGE_KEYSTORE --ks-key-alias=\$WORDSURGE_KEY_ALIAS"
