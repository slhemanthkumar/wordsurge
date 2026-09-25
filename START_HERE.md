# WordSurge — where everything is

| What | Where |
|---|---|
| **Upload this to Google Play** | `wordsurge/release/WordSurge-v1.5.0-release.aab` |
| Step-by-step upload instructions | `wordsurge/docs/PLAY_STORE_RELEASE_GUIDE.md` |
| Payments account record + AdMob/IAP rules | `wordsurge/docs/PAYMENTS_AND_MONETIZATION.md` |
| Is it production-ready? Policy audit | `wordsurge/docs/PRODUCTION_READINESS_AUDIT.md` |
| Name choice and clearance | `wordsurge/docs/BRAND_REVIEW.md` |
| Store text (title, descriptions, release notes) | `wordsurge/docs/STORE_LISTING_COPY.md` |
| Icon, feature graphic, 7 phone + 7 tablet screenshots | `wordsurge/store-assets/` |
| Master logo (1024 px) | `wordsurge/artwork/wordsurge-logo-1024.png` |
| Pages to host publicly (privacy / terms / support) | `wordsurge/legal/` |
| Build verification (lint, signatures, size) | `wordsurge/release/VERIFICATION.txt` |
| Upload keystore — **secret, back up now** | `WordSurge-upload-key.jks` + `WordSurge-upload-key-credentials.txt` (alias `wordsurge-upload`) |
| Public upload certificate (safe to share) | `WordSurge-upload-certificate.pem` |
| Old LetterRide key (never uploaded to Play — safe to delete) | `archive-letterride-key/` |
| Source code | `wordsurge/web/` (game) · `wordsurge/android/` (wrapper) |
| **Push to GitHub** (CI, signed releases, Pages) | `wordsurge/docs/GITHUB_SETUP.md` — repo is committed and ready: `git remote add origin … && git push -u origin main` |
| Public legal-pages repo (for a private main repo) | `wordsurge-legal/` — push it, enable Pages, paste the privacy URL into Play Console |
| Keystore as base64 for the GitHub `WORDSURGE_KEYSTORE_BASE64` secret | `WordSurge-upload-key.base64.txt` (secret — do not commit) |

Package name: `ai.arena.wordsurge` · Store title: **WordSurge: Timed Word Puzzle** ·
Tagline: *Connect letters. Ride the surge.*

Before uploading, do the 4 items in **Part 0** of the release guide (support e-mail, hosted
privacy URL, publisher name in `legal/*.html`, real URLs in the `LINKS` block of `web/js/app.js`).
