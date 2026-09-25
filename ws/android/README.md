# WordSurge — Android wrapper

A dependency-free `Activity` + `WebView` shell that serves the game from `app/src/main/assets/www`
under the private origin `https://app.wordsurge.local/`. Nothing is fetched from the network and
the manifest declares **no permissions**.

| Setting | Value |
|---|---|
| Application ID | `ai.arena.wordsurge` |
| Version | 1.5.0 (`versionCode 1`) |
| minSdk / compileSdk / targetSdk | 26 / 36 / 36 |
| AGP / Gradle / JDK | 8.10.0 / 8.11.1 / 17 |
| Orientation | portrait (`appCategory="game"` keeps the lock on Android 16 tablets) |
| Release | R8 full mode, resource shrinking, English resources only, no bundle splits |

## Workflow

```bash
../tools/sync-web.sh          # copy web/ into app/src/main/assets/www (run after every web change)
./gradlew assembleDebug       # app/build/outputs/apk/debug/app-debug.apk — sideload for a quick check
../tools/run-on-device.sh     # sync + installDebug + launch on a connected device/emulator
../tools/build-release.sh     # signed AAB + verification into ../release (needs signing env)
```

`app/src/main/assets/www/` is generated and git-ignored; `web/` is the source of truth.

## Release signing

`app/build.gradle` reads `WORDSURGE_KEYSTORE`, `WORDSURGE_STORE_PASSWORD`,
`WORDSURGE_KEY_ALIAS`, `WORDSURGE_KEY_PASSWORD` from the environment
(`cp signing.env.example signing.env && source signing.env`). `bundleRelease`/`assembleRelease`
fail fast with a clear message when they are missing, so an unsigned release can never be produced
by accident.

## Android Studio

Open **this folder** (not the repository root), set *Gradle JDK* to 17, let it install SDK 36 and
build-tools 36.0.0 if prompted, then run the `app` configuration or
**Build → Generate Signed App Bundle**.

## Files

- `app/src/main/java/ai/arena/wordsurge/MainActivity.java` — WebView setup, local asset server with CSP headers, predictive Back bridge (`window.handleNativeBack`), Android 15+ edge-to-edge insets
- `app/src/main/AndroidManifest.xml` — no permissions, backup rules, portrait game activity
- `app/src/main/res/mipmap-*`, `drawable*` — adaptive / round / monochrome launcher icons
- `app/lint.xml` — three documented lint exemptions (all icon/AGP-version related)
