#!/usr/bin/env bash
# Builds a debug APK, installs it on the connected device/emulator, and launches WordSurge.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADB="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}/platform-tools/adb"
[[ -x "$ADB" ]] || ADB="$(command -v adb || true)"
if [[ -z "$ADB" || ! -x "$ADB" ]]; then
  echo "adb not found. Install Android SDK Platform-Tools or set ANDROID_HOME." >&2
  exit 1
fi
if ! "$ADB" devices | awk 'NR>1 && $2=="device" {found=1} END {exit !found}'; then
  echo "No authorised device or running emulator found." >&2
  exit 1
fi
"$ROOT/tools/sync-web.sh"
cd "$ROOT/android"
./gradlew installDebug
"$ADB" shell am force-stop ai.arena.wordsurge
"$ADB" shell am start -n ai.arena.wordsurge/.MainActivity
echo "WordSurge launched."
