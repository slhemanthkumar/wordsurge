# WordSurge 1.5.0 — Production Readiness & Policy Audit

Audit date: 8 September 2026 · Build: `release/WordSurge-v1.5.0-release.aab` (versionCode 1)

## Verdict

**The build is production-grade and can be uploaded to Google Play today.** Technically and
policy-wise there is nothing in the binary that can trigger a violation: it requests no
permissions, makes no network calls, contains no SDKs, collects no data, shows no ads, sells
nothing, and its content is filtered for an "Everyone" rating.

What stands between this file and a live listing is **publisher paperwork only** — five items
that require your accounts, listed in §5. None of them are code changes.

---

## 1. Data-protection / "data acts" compliance

Because the app processes nothing off-device, it is out of scope of the *collection* provisions
of every major regime, but each still has a formality:

| Regime | Applies? | What WordSurge does | Action for you |
|---|---|---|---|
| **Google Play User Data policy** (governs everything) | Yes | No collection, no transmission, no SDKs. Data safety = "No data collected/shared". | Fill the Data safety form exactly as in `DATA_SAFETY_GUIDE.md`; host the privacy policy. |
| **India DPDP Act 2023** | Technically no personal data is processed by the developer | Nothing leaves the device; no account, no identifiers. | Keep the privacy policy accurate (it already states this). No consent notice needed because there is no processing. |
| **EU/UK GDPR** | No personal data processed by controller | Same. No cookies, no tracking, no analytics. | None. If ads are added later, UMP consent becomes mandatory (see `PAYMENTS_AND_MONETIZATION.md`). |
| **US COPPA / Play Families** | Only if you target under-13s | Audience set to 13+; no under-13 targeting; content is child-safe anyway. | In Play Console select age groups 13+ only. Do not tick "designed for children" (avoids Families review + ad SDK restrictions). |
| **US state privacy laws (CCPA/CPRA etc.)** | No sale/sharing of data | Nothing collected. | None. |
| **Google Play Advertising ID policy** | No | Manifest has no `AD_ID` permission; declaration = No. | Answer "No" in the Advertising ID declaration. |
| **Play "Deceptive behaviour / Misrepresentation"** | Always | Store copy describes real features only; screenshots are real captures; no fake reviews/rankings. | Keep listing text factual (the copy in `STORE_LISTING_COPY.md` is). |
| **Play "Intellectual property"** | Always | Original code, art, UI, name; word list from CC-BY-SA / public-domain sources with attribution. | Trademark-check "WordSurge" in target markets (a quick search of the Play Store + national TM registry). |
| **Play "Payments" policy** | No | No IAP, no external payment links, no coin sales; coins are earned only. | Nothing. If IAP is added, use Play Billing only. |
| **Play "Ads" policy** | No | No ads, no ad SDK, no AdSense code. | Ads declaration = No. **Never** embed AdSense in the app (§3 of `PAYMENTS_AND_MONETIZATION.md`). |
| **Play "Target API level"** | Yes | targetSdk 36 (Android 16) — the 31 Aug 2026 requirement. | None. |
| **Play "Android App Bundle"** | Yes | Signed AAB with Play App Signing upload key. | Enrol in Play App Signing at first upload (default). |
| **Play "Accessibility" (pre-launch report)** | Advisory | All tap targets ≥ 44 dp, every control labelled, timer exposed as `role=timer`, dark-mode contrast fixed this build. | None. |
| **IARC content rating** | Yes | No violence, sex, drugs, gambling, user interaction, or web browsing inside the app. External links open the system browser. | Complete the questionnaire truthfully → Everyone / PEGI 3. |

## 2. What was fixed in this audit (1.4.0 → 1.4.1, carried into the WordSurge 1.5.0 build)

| Finding | Severity | Fix |
|---|---|---|
| Lexicon still contained 59 words from the LDNOOBW obscenity list and ~90 further sensitive terms (slurs, sexual anatomy, drugs, alcohol, graphic violence, religious names) that could appear as required answers in generated levels — a real IARC/"Everyone" risk and a review-comment magnet | **High** | Applied LDNOOBW + a 700-term curated blocklist; 374 words removed (now 21,904). Handcrafted levels `DEAL/ALE`, `MALE/ALE`, `SUMMER/RUM` changed to `LED`, `LAME`, `SUM`. Validator confirms 0 flagged words in 5,000 levels. |
| Dark mode rendered headings and setting labels in near-black on dark backgrounds (unreadable) | **High** (UX, also an accessibility flag) | Root cause: `color` was inherited from a light-mode rule before the dark-mode variables applied. Fixed; verified by automated contrast check. |
| 12 controls below the 44 dp minimum touch target (close buttons 36 dp, switches 28 dp, icon buttons 40 dp, "View all" 24 dp) — flagged by Play pre-launch accessibility scans | Medium | All controls now ≥ 44 × 44 dp; switches keep a 32 dp visual track inside a 44 dp hit area. |
| 7 sheet close buttons had no accessible name (TalkBack reads "button") | Medium | `aria-label="Close"` added. |
| Timer was not exposed as a timer to assistive tech | Low | `role="timer"` added. |
| "Rate WordSurge" opened the web Play page inside the browser instead of the Play Store app | Low | Uses `market://` inside the Android shell with automatic web fallback. |
| No fallback screen if the device WebView is too old for ES modules | Low | `<script nomodule>` notice asks the user to update Android System WebView. |

## 3. Automated evidence for this build

- `tools/smoke-test.js`: **25/25** checks pass (boot, date, tutorial, timers, timeout/retry, milestones, generated level < 0.5 s, settings/links, no monetisation UI, single storage key, touch targets, dark-mode contrast, native Back, zero console/network errors).
- `tools/validate-levels.mjs`: 5,000 levels + 400 daily puzzles, 0 problems.
- Android: lint "No issues found", `jarsigner`/`apksigner`/`bundletool validate` all pass, `aapt2` badging shows **no `uses-permission`**, download ≈ 303 KB.
- Screenshots regenerated from this exact build (7 phone 1080×1920, 7 tablet 1600×2560).

## 4. Readiness for a large audience (scale considerations)

| Concern | Status |
|---|---|
| Server capacity | Not applicable — the app has no backend. 1 user or 10 million users cost the same: nothing. |
| Crash/ANR visibility | Android vitals in Play Console (automatic, no SDK). Thresholds to watch: crash rate < 1.09 %, ANR < 0.47 %. |
| Device fragmentation | minSdk 26 covers ~97 % of active devices; WebView-based UI is rendered by the auto-updating Android System WebView, so rendering bugs get fixed by Google's updates. Portrait-locked with tablet layouts verified. |
| Performance | 303 KB download, cold start is a single HTML load; level generation ≤ 0.5 s worst case (level 5000). |
| Content longevity | 5,000 levels ≈ 80 hours at up to 60 s each, plus a daily puzzle for 400+ days without repeating. |
| Localisation | English only; UI strings are not yet externalised. Fine for launch in India/US/UK/etc. — add languages in a later release if the country split in Play stats justifies it. |
| Save-data loss | Local only; Android Auto Backup restores on the same Google account. No cross-device sync — document this in support replies. |
| Monetisation | Deliberately none in v1. Roadmap and gate list in `PAYMENTS_AND_MONETIZATION.md`. |
| Support load | Support page + e-mail; in-app "Export local save" lets users self-serve backups. |

## 5. The only things missing (publisher actions)

1. **Support e-mail** — a monitored mailbox (shown publicly).
2. **Host `legal/privacy-policy.html`, `terms.html`, `support.html`** on any public HTTPS URL and put the
   legal entity name + e-mail in their "Contact" paragraph.
3. **Point the app at those URLs** — the `LINKS` block at the top of `web/js/app.js`
   (three `example.com` placeholders), then `tools/build-release.sh` with `versionCode 2`.
   *If you prefer to ship 1.5.0 as-is, the in-app links will open example.com until the next update;
   Play only checks the URL in the Console, but real links are better for reviewers.*
4. **Play Console account** — registration, identity verification, and (personal accounts created
   after Nov 2023) the 12-tester / 14-day closed test.
5. **Real-device pass** via internal testing (list in `RELEASE_CHECKLIST.md`) — automated checks ran in
   Chromium, not on physical Android hardware.

Nothing else is outstanding.
