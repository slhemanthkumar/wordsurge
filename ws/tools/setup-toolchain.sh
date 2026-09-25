#!/usr/bin/env bash
# Installs everything needed to build and test WordSurge on a fresh Linux machine, into /var/tmp:
#   JDK 17, Android SDK (platform 36, build-tools 36.0.0), bundletool, Playwright + Chromium.
# Safe to re-run; each step is skipped when already present.
set -euo pipefail
ROOT=/var/tmp/wordsurge-build
mkdir -p "$ROOT" && cd "$ROOT"

if [ ! -x "$ROOT/jdk17/bin/java" ]; then
  echo "[1/5] JDK 17"
  curl -sSL -o jdk17.tar.gz "https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jdk/hotspot/normal/eclipse"
  mkdir -p jdk17 && tar -xzf jdk17.tar.gz -C jdk17 --strip-components=1 && rm jdk17.tar.gz
fi
export JAVA_HOME="$ROOT/jdk17" PATH="$ROOT/jdk17/bin:$PATH"
export ANDROID_HOME="$ROOT/android-sdk" ANDROID_SDK_ROOT="$ROOT/android-sdk"

if [ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "[2/5] Android command-line tools"
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  curl -sSL -o ct.zip "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  unzip -q ct.zip -d "$ANDROID_HOME/cmdline-tools" && mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest" && rm ct.zip
fi
if [ ! -d "$ANDROID_HOME/platforms/android-36" ]; then
  echo "[3/5] Android platform 36 + build-tools 36.0.0"
  yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses >/dev/null 2>&1 || true
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-36" "build-tools;36.0.0" "platform-tools" >sdkmanager.log 2>&1
fi
[ -f "$ROOT/bundletool.jar" ] || { echo "[4/5] bundletool"; curl -sSL -o bundletool.jar "https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar"; }

SHOTS=/var/tmp/wordsurge-shots
if [ ! -d "$SHOTS/browsers" ]; then
  echo "[5/5] Playwright + Chromium (screenshots / smoke test)"
  mkdir -p "$SHOTS" && cd "$SHOTS"
  npm init -y >/dev/null 2>&1
  npm install playwright@1.47.2 --no-audit --no-fund >/dev/null 2>&1
  PLAYWRIGHT_BROWSERS_PATH="$SHOTS/browsers" npx playwright install chromium >/dev/null 2>&1
  sudo apt-get update -q >/dev/null 2>&1; sudo apt-get install -y -q libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libcairo2 libatspi2.0-0 libx11-xcb1 fonts-liberation >/dev/null 2>&1 || true
fi

cat > /var/tmp/wordsurge-env.sh <<EOF
export JAVA_HOME=$ROOT/jdk17
export ANDROID_HOME=$ROOT/android-sdk
export ANDROID_SDK_ROOT=$ROOT/android-sdk
export GRADLE_USER_HOME=$ROOT/gradle-home
export PATH=$ROOT/jdk17/bin:$ROOT/android-sdk/platform-tools:\$PATH
export BUNDLETOOL=$ROOT/bundletool.jar
export NODE_PATH=$SHOTS/node_modules
export PLAYWRIGHT_BROWSERS_PATH=$SHOTS/browsers
EOF
echo "TOOLCHAIN_READY — run:  source /var/tmp/wordsurge-env.sh"
