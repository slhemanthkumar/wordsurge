# WordSurge: Timed Word Puzzle

*Connect letters. Ride the surge.*

An original, offline-first word puzzle for Android (and the web). Trace letters on a wheel to
fill a small crossword before a fixed timer runs out (30 s on Basic/Standard routes, 60 s on Complex/Expert), build surge combos, and
collect Surge Bonuses and Treasure Chests across 5,000 levels and calendar-driven challenges.

- Package `ai.arena.wordsurge` · v1.5.0 (versionCode 1) · minSdk 26 · targetSdk 36
- **No permissions, no third-party SDKs, no ads, no account** — 263 KB signed AAB (~253 KB download)
- Ready-to-upload bundle: `release/WordSurge-v1.5.0-release.aab` (verification in `release/VERIFICATION.txt`)
- **Google Play upload guide: [`docs/PLAY_STORE_RELEASE_GUIDE.md`](docs/PLAY_STORE_RELEASE_GUIDE.md)**
- **GitHub setup (push, CI, signed releases, Pages for the privacy policy): [`docs/GITHUB_SETUP.md`](docs/GITHUB_SETUP.md)**

## Automation (GitHub Actions)

| Workflow | Trigger | Output |
|---|---|---|
| `ci.yml` | every push / PR | level validation, Android lint, debug APK artifact, 25-check browser smoke test |
| `release.yml` | tag `v*` or manual | signed, verified `.aab` + mapping + checksums attached to a GitHub Release (needs 4 secrets, see the setup guide) |
| `pages.yml` | changes under `legal/` | privacy policy / terms / support published on GitHub Pages |

## Project layout

```
web/                    The game (vanilla ES modules, no build step, no dependencies)
  index.html            Shell + inline SVG icon sprite
  styles.css            Base design system and screens
  beach-overrides.css   "Surge Bay" photographic theme
  engagement.css        Timer HUD, combo badge, milestone styling
  js/app.js             Screens, input, timers, rewards, system-calendar refresh
  js/state.js           Save file (localStorage `wordsurge.save.v1`) and all mutations
  js/data.js            Themes, achievements, 100 handcrafted levels, procedural generator
  js/dictionary.js      22k-word lexicon for the generator (see THIRD_PARTY_NOTICES.md)
  js/layout.js          Crossword placement algorithm
  js/game.js            Per-level rules engine (submit, hints, shuffle)
  js/services.js        Web-Audio sound/music, haptics, local analytics stub
  sw.js, manifest.webmanifest   PWA-only (not shipped in the Android build)
android/                Android Studio project: WebView shell serving web/ from assets
tools/                  setup-toolchain.sh · sync-web.sh · build-release.sh · run-on-device.sh · validate-levels.mjs · smoke-test.js · capture-screenshots.js
store-assets/           512 icon, 1024×500 feature graphic, phone + tablet screenshots
legal/                  Privacy policy, terms, support pages to host publicly
docs/                   Release guide, GitHub setup, payments/monetization plan, readiness audit, listing copy, data safety, checklist, brand review
release/                Signed AAB, R8 mapping, SHA-256 sums, verification log (committed so the bundle is downloadable)
.github/workflows/      CI, signed release, and GitHub Pages automations
```

## Run the game locally

```bash
cd web && python3 -m http.server 4173      # open http://localhost:4173
```

## Build the Android release

```bash
tools/setup-toolchain.sh                              # one-time on a fresh Linux box: JDK 17, SDK 36, bundletool, Playwright
cp android/signing.env.example android/signing.env   # fill in keystore path + passwords
source android/signing.env
export JAVA_HOME=/path/to/jdk-17 ANDROID_HOME=/path/to/Android/Sdk   # SDK 36 + build-tools 36.0.0
tools/build-release.sh                                # sync → lint → signed AAB → verify → release/
```

Or open `android/` in Android Studio (Gradle JDK 17), run `tools/sync-web.sh`, then
**Build → Generate Signed App Bundle**. Bump `versionCode` in `android/app/build.gradle`
before every upload.

## Validate

```bash
node tools/validate-levels.mjs      # checks all 5,000 levels + 400 daily puzzles (~2 s)
node tools/smoke-test.js            # 25 end-to-end checks in headless Chromium (needs playwright + web/ served on :4173)
```

## Gameplay summary

| Route | Timer | Coin bonus | XP × |
|---|---|---|---|
| Basic | 30 s | +0 | 1.0 |
| Standard | 30 s | +8 | 1.15 |
| Complex | 60 s | +18 | 1.35 |
| Expert | 60 s | +30 | 1.6 |

Every 5th level is a **Surge Bonus** (+40 coins), every 10th a **Treasure Chest** (+120).
Consecutive correct words build a **Surge combo** (+2…+10 coins). Timers can never be extended.
Daily gift, daily puzzle, weekly trail, monthly mastery, lucky spin and mystery chest all key
off the device's own date, locale and time zone, and roll over automatically at midnight.

## Licences

Code, artwork, UI and level design are original to this project. The generator lexicon is
derived from FrequencyWords (CC BY-SA 4.0) filtered against the public-domain ENABLE word
list — see `THIRD_PARTY_NOTICES.md`.

## Naming

Formerly developed as *LetterRide*. The rename to **WordSurge** (September 2026) changed the package
name to `ai.arena.wordsurge`, the upload key (`wordsurge-upload`), the logo and all copy; saves from
every earlier build are imported automatically. See `docs/BRAND_REVIEW.md`.
