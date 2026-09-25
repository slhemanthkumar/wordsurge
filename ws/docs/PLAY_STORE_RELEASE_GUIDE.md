# WordSurge — Google Play Upload Guide (step by step)

This is the only document you need to take `release/WordSurge-v1.5.0-release.aab` from this
folder to a live Google Play listing. Follow the numbered parts in order.

| Item | Value |
|---|---|
| Store title | **WordSurge: Timed Word Puzzle** |
| Package name (application ID) | `ai.arena.wordsurge` — permanent once published |
| Version | 1.5.0 (`versionCode 1`) |
| Upload file | `release/WordSurge-v1.5.0-release.aab` (signed Android App Bundle, ≈ 320 KB) |
| Target / minimum Android | API 36 (Android 16) / API 26 (Android 8.0) |
| Permissions | **None** |
| Third-party SDKs (ads, analytics, billing, crash, cloud) | **None** — only the built-in Play Console statistics, Android vitals and Android Auto Backup |
| Ads shown | No |
| Login / account required | No |
| Price | Free |
| Category | Game → Word |
| Content rating (expected) | Everyone / PEGI 3 |
| Payments account | ID **9671-5535-5387-6909** (nickname *AdSense pub-1906616177023494*) — see `docs/PAYMENTS_AND_MONETIZATION.md`; **not** needed for this free, ad-free release beyond the registration fee |

---

## Part 0 — Before you open Play Console (15 minutes)

You must supply four things that only the publisher can provide. Nothing else is missing.

1. **Support email** — a mailbox you monitor. It is shown publicly on the listing.
2. **Privacy-policy URL** — host `legal/privacy-policy.html` on any public HTTPS site
   (GitHub Pages, Netlify, Cloudflare Pages, your own domain). Must not be a PDF or a
   local file path, must not require login, and must stay online as long as the app is live.
   Host `legal/terms.html` and `legal/support.html` at the same place.
3. **Publisher legal name** — put it in the "Contact" paragraph of the three `legal/*.html`
   pages (search for `replace this paragraph`) and re-upload them.
4. **The same URLs inside the app** — open `web/js/app.js`, find the `LINKS` object at the
   top, replace the three `https://example.com/wordsurge/...` values with your real URLs,
   then rebuild (Part 6). The store link is already correct.

Also back up the signing material **now**: copy `WordSurge-upload-key.jks` and
`WordSurge-upload-key-credentials.txt` (both in `/home/user`, outside the project; alias `wordsurge-upload`,
RSA-4096, valid to 2054) to two
encrypted locations (password manager + offline drive). Never commit or e-mail them.
If the upload key is lost you can request a reset in Play Console, but only after identity
verification, so treat it as critical.

---

## Part 1 — Developer account (one time)

1. Go to <https://play.google.com/console> and sign in with the Google account that should own the app
   (use the same Google account that owns AdSense `pub-1906616177023494` if you want one login for
   Play, AdMob and payments).
2. Choose **Personal** or **Organization** account and pay the one-time registration fee. You may pay
   with the card on payments profile **9671-5535-5387-6909**. Do **not** set up a *merchant account*
   yet — it is only needed for paid apps / in-app purchases, and the link is permanent once made.
3. Complete identity verification (ID document, address, phone, e-mail). Organizations also
   need a D-U-N-S number. Verification can take a few days; you can prepare the listing meanwhile.
4. Personal accounts created after 13 Nov 2023 must run a **closed test with at least
   12 testers opted in for 14 continuous days** before production access is granted (Part 8).
   Organization accounts do not have this requirement.

---

## Part 2 — Create the app

1. **All apps → Create app**.
2. App name: `WordSurge: Timed Word Puzzle` · Default language: English (United States or India).
3. App or game: **Game** · Free or paid: **Free** (cannot be changed to paid later).
4. Tick the Developer Program Policies and US export-law declarations → **Create app**.

---

## Part 3 — Set up your app (the "Dashboard" checklist)

Open **Dashboard → Set up your app** and complete every card. Use exactly these answers.

| Card | Answer |
|---|---|
| **Privacy policy** | Paste your public HTTPS URL from Part 0 |
| **App access** | *All functionality is available without special access* |
| **Ads** | *No, my app does not contain ads* — true for this build. Never paste AdSense web ad code into the app (policy violation → AdSense account disabled); a future ad release must use AdMob, see `docs/PAYMENTS_AND_MONETIZATION.md` |
| **Content rating** | Start questionnaire → category **Game** → answer **No** to violence, sexuality, language, controlled substances, gambling, user interaction, user-generated content, personal-info sharing, location sharing, purchases. Result: Everyone / PEGI 3. |
| **Target audience** | Age groups **13–15, 16–17, 18+** (do **not** tick under-13 — that triggers the Families programme and extra review). "Appeal to children?" → *No*. |
| **News app** | No |
| **COVID-19 contact tracing / status** | No |
| **Data safety** | See Part 4 |
| **Government app** | No |
| **Financial features** | *My app doesn't provide any financial features* |
| **Health** | *My app does not have any health features* |
| **Advertising ID** | *No, my app does not use advertising ID* (the manifest declares no `AD_ID` permission) |
| **App category & contact details** | Category *Word*; tags *Word, Puzzle, Casual, Offline, Brain games*; support e-mail from Part 0; website optional |
| **Store listing** | See Part 5 |

---

## Part 4 — Data safety form (exact answers)

This build stores everything on the device and sends nothing anywhere.

1. *Does your app collect or share any of the required user data types?* → **No**.
2. *Is all of the user data collected by your app encrypted in transit?* → not asked when nothing is collected.
3. *Do you provide a way for users to request that their data is deleted?* → **Yes** — describe:
   "All data is stored on the device only. Settings → Reset progress erases it; uninstalling removes it."
4. Save and confirm. The listing will show "No data collected" and "No data shared".

Android Auto Backup may copy the app's private data to the user's own Google Drive; that is a
platform feature under the user's control and does **not** count as collection by the developer.

> If you ever add an ad, analytics, crash-reporting, billing or cloud-save SDK, redo this form
> **before** uploading that build. The SDK vendor documents the exact answers to give.

---

## Part 5 — Store listing

All text is in `docs/STORE_LISTING_COPY.md`; all graphics are in `store-assets/`.

| Field | File / text | Requirement |
|---|---|---|
| App name | WordSurge: Timed Word Puzzle | ≤ 30 characters |
| Short description | from STORE_LISTING_COPY.md | ≤ 80 characters |
| Full description | from STORE_LISTING_COPY.md | ≤ 4000 characters |
| App icon | `store-assets/app-icon-512.png` | 512×512 PNG, ≤ 1 MB ✔ |
| Feature graphic | `store-assets/feature-graphic-1024x500.png` | 1024×500 PNG ✔ |
| Phone screenshots | `store-assets/screenshots/01…07.png` (upload all 7, or at least the first 5) | 1080×1920 PNG, 16:9–9:16 ✔ |
| 7-inch tablet screenshots | `store-assets/screenshots-tablet/01…07.png` | ✔ |
| 10-inch tablet screenshots | `store-assets/screenshots-tablet/01…07.png` (same files are accepted) | 1600×2560 ✔ |
| Video | optional — skip | |


---

## Part 6 — (Only if you changed anything) rebuild the bundle

Skip this if you are uploading the shipped `release/WordSurge-v1.5.0-release.aab` unchanged.
If you edited the `LINKS` URLs or anything under `web/`, rebuild:

```bash
# Requirements: JDK 17, Android SDK with platform 36 + build-tools 36.0.0 (Android Studio installs these)
cp android/signing.env.example android/signing.env     # fill in the real values, file is git-ignored
source android/signing.env
export JAVA_HOME=/path/to/jdk-17 ANDROID_HOME=/path/to/Android/Sdk
tools/build-release.sh
```

The script syncs `web/` into the wrapper, runs `lintRelease` (must print *No issues found.*),
builds the signed AAB, verifies its signature and writes `release/WordSurge-v<version>-*`.
**Every upload needs a higher `versionCode`** — edit `android/app/build.gradle` first.

Alternative without the script (Android Studio): open the `android/` folder, set Gradle JDK to 17,
run `tools/sync-web.sh`, then **Build → Generate Signed App Bundle**, choose the keystore and
alias `wordsurge-upload`.

---

## Part 7 — Upload to Internal testing (first upload)

1. **Test and release → Testing → Internal testing → Create new release**.
2. First time only: Play prompts for **Play App Signing** → choose *Use Google-generated key*
   (recommended). The `.aab` you upload is signed with your **upload key**; Google re-signs it
   with the app-signing key it keeps for you.
3. Upload `release/WordSurge-v1.5.0-release.aab`. Play reads name, version and icon from it.
4. Release name `1.5.0 (1)`; release notes from `docs/STORE_LISTING_COPY.md`.
5. **Next → Save → Review release → Start rollout to Internal testing**.
6. **Testers** tab → create an e-mail list with your own address(es) → copy the *opt-in URL*,
   open it on a phone, accept, install from Google Play. The Play-delivered build is the one
   that must be tested — not a sideloaded APK.
7. On the device check the list in `docs/RELEASE_CHECKLIST.md` (offline launch, timers,
   midnight rollover, Back button, save restore, tablet layout).
8. Open **Test and release → Pre-launch report** after ~1 hour and fix anything it flags.

Common upload warnings and what to do:

| Message | Action |
|---|---|
| "You uploaded an APK…" | You picked the `.apk`. Upload the `.aab`. |
| "Version code 1 has already been used" | Bump `versionCode` in `android/app/build.gradle`, rebuild. |
| "Your app bundle is signed with the wrong key" | Use the original `WordSurge-upload-key.jks`; if lost, Play Console → Setup → App signing → *Request upload key reset*. |
| "No deobfuscation file" (info only) | Optional: upload `release/WordSurge-v1.5.0-mapping.txt` under the release's *App bundle explorer → Downloads*. |
| "Target API level" | Already API 36 — this cannot appear for this build. |

---

## Part 8 — Closed testing (required for new personal accounts)

1. **Testing → Closed testing → Create track** (or use the default *Alpha* track) →
   **Create new release** → *Add from library* → pick the same bundle → roll out.
2. Add a Google Group or 12+ e-mail addresses; share the opt-in link; testers install and open the game.
3. Keep **≥ 12 testers opted in for 14 consecutive days** (the Dashboard shows a counter).
4. When the counter is complete, **Dashboard → Apply for production**. Answer the short
   questionnaire honestly (who tested, what feedback you received, what you changed).
   Approval is usually within a few days.

Organization accounts and personal accounts created before 13 Nov 2023 can skip to Part 9.

---

## Part 9 — Production release

1. **Production → Countries/regions → Add countries** (all, or your chosen markets).
2. **Create new release → Add from library** → the tested bundle (or a newer one with a higher version code).
3. Release notes → **Save → Review release**. Resolve every red error; yellow warnings are advisory.
4. **Start rollout to Production**. Optionally use a *staged rollout* (e.g. 20 %) and increase
   after a day of clean Android vitals.
5. First review normally takes 1–7 days. You get an e-mail; the listing then goes live at
   `https://play.google.com/store/apps/details?id=ai.arena.wordsurge` (this URL is already
   wired to *Rate WordSurge* inside the app).

---

## Part 10 — After launch

- **Statistics, Android vitals, Ratings, Pre-launch reports** live in Play Console and work with
  no SDK. Watch crash rate (< 1.09 %) and ANR rate (< 0.47 %) — the "bad behaviour" thresholds.
- **Updates**: change code → `tools/sync-web.sh` → bump `versionCode` (and `versionName`) →
  `tools/build-release.sh` → upload to Internal → promote to Production. Same package name,
  same upload key, always.
- **Adding ads or purchases later**: follow the gate list in `docs/PAYMENTS_AND_MONETIZATION.md`
  (AdMob + UMP consent, new permissions, Ads declaration = Yes, Data safety re-done, privacy
  policy updated, Play Billing 8+). Add AdMob only after the app is live — AdMob's app review
  needs the store listing.
- Keep the target SDK current: Google raises the required level each year (deadline
  31 August). This build already meets the 2026 requirement (API 36).

---

## Files reference

```
release/WordSurge-v1.5.0-release.aab   ← upload this
release/WordSurge-v1.5.0-mapping.txt   ← optional R8 mapping upload
release/VERIFICATION.txt                ← lint/signature/size evidence
store-assets/                           ← icon, feature graphic, phone + tablet screenshots
docs/STORE_LISTING_COPY.md              ← all listing text and release notes
docs/DATA_SAFETY_GUIDE.md               ← long-form rationale for Part 4
docs/PAYMENTS_AND_MONETIZATION.md       ← payments account record + AdMob/IAP gate list
docs/PRODUCTION_READINESS_AUDIT.md      ← policy/compliance audit of this build
docs/RELEASE_CHECKLIST.md               ← device test list + pre-flight
legal/*.html                            ← host these publicly (Part 0)
/home/user/WordSurge-upload-key.jks    ← upload keystore (secret, outside the repo)
/home/user/WordSurge-upload-key-credentials.txt ← passwords (secret)
/home/user/WordSurge-upload-certificate.pem      ← public cert (safe to share)
```
