# WordSurge 1.5.0 — Release Checklist

## Done in this repository

- [x] Application ID `ai.arena.wordsurge`, `versionCode 1`, `versionName 1.5.0`
- [x] `minSdk 26` (Android 8.0) · `compileSdk`/`targetSdk 36` (Android 16) — meets the 31 Aug 2026 Play requirement
- [x] Signed Android App Bundle + APK (`release/`), upload key + public certificate generated
- [x] R8 full-mode minification, resource shrinking, English-only resources, no bundle splits (single 314 KB AAB, ~303 KB download)
- [x] Release lint: **No issues found**; bundletool `validate` OK; `jarsigner`/`apksigner` verified
- [x] **Zero Android permissions** — no INTERNET, no advertising ID
- [x] No third-party SDKs (ads, analytics, billing, crash, cloud) — Play Console stats + Android vitals + Auto Backup only
- [x] `android:appCategory="game"` so the portrait lock is honoured on Android 16 tablets
- [x] Adaptive, round and monochrome (Android 13+) launcher icons; edge-to-edge insets on Android 15+; predictive Back
- [x] Web game bundled offline under a private origin with CSP; external links open in the system browser
- [x] System date/locale/time-zone driven calendar with midnight rollover; fixed timers (30 s Basic/Standard, 60 s Complex/Expert), never extendable
- [x] 5,000 levels + 400 daily puzzles validated: unique letter sets, dictionary-valid, spellable, every generated level has ≥ 2 words, grid ≤ 12×12
- [x] Lexicon = frequency list ∩ public-domain ENABLE list, filtered with LDNOOBW + curated blocklist (no names, contractions, profanity, slurs, sexual/drug/violence/religious terms) — suitable for Everyone / PEGI 3
- [x] Accessibility: tap targets ≥ 44 dp, labelled controls, `role=timer`, dark-mode contrast verified
- [x] Policy audit passed — `docs/PRODUCTION_READINESS_AUDIT.md`; payments/AdMob plan — `docs/PAYMENTS_AND_MONETIZATION.md`
- [x] Store icon 512×512, feature graphic 1024×500, 7 phone (1080×1920) + 7 tablet (1600×2560) screenshots
- [x] Listing copy, Data safety answers, step-by-step upload guide

## Publisher must do (cannot be done from this repository)

- [ ] Host `legal/privacy-policy.html`, `legal/terms.html`, `legal/support.html` on a public HTTPS site
- [ ] Put the legal entity name + support e-mail into the "Contact" section of those three pages
- [ ] Replace the three `https://example.com/wordsurge/...` URLs in the `LINKS` object at the top of `web/js/app.js`, then rebuild (`tools/build-release.sh`, bump `versionCode` to 9)
- [ ] Pay the registration fee from payments profile 9671-5535-5387-6909 if desired; do **not** create a merchant account yet (only needed for IAP, link is permanent)
- [ ] Back up `WordSurge-upload-key.jks` + credentials to two encrypted locations
- [ ] Play Console account verification (identity, address, phone, payment profile / D-U-N-S)
- [ ] Data safety, Ads = No, App access = no special access, content rating, target audience (13+)
- [ ] Internal test on real devices (list below), then closed test 12 testers × 14 days if the account requires it
- [ ] Trademark / name clearance for "WordSurge" in the target markets

## Device test list (Play internal-testing install, not sideload)

- [ ] Android 8 phone (API 26) · Android 12 phone · Android 15/16 phone
- [ ] Small phone (≤ 5.5") and large phone; 7–8" tablet; 10"+ tablet (portrait lock, layout fills the screen)
- [ ] Cold launch in airplane mode; relaunch after reboot — progress intact
- [ ] Timer: starts on first move, counts down visibly, cannot be extended by hints/backgrounding/force-stop; "Time's up" resets the board
- [ ] Midnight rollover while open: home date, week strip, daily puzzle and gifts refresh within a minute
- [ ] Manual date/time-zone change is reflected after returning to the app
- [ ] System Back / predictive Back: closes sheet → returns home → exits
- [ ] Settings links (privacy, terms, support, rate) open in the browser / Play Store
- [ ] Music/sound/vibration toggles, dark mode, larger text, reduced motion
- [ ] TalkBack reads buttons and the timer; touch targets ≥ 48 dp
- [ ] Pre-launch report: no crashes, ANRs or accessibility blockers

## Not in this release (do not declare them)

- Ads, in-app purchases, analytics/crash SDKs, cloud save, accounts, additional languages.
  Adding any of these requires: new `versionCode`, updated Data safety + privacy policy, `THIRD_PARTY_NOTICES.md`, re-run lint/build/verify.
