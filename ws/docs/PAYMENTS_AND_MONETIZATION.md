# WordSurge — Payments Account & Monetization Plan

## Publisher payments account (record)

| Field | Value |
|---|---|
| Google payments account ID | **9671-5535-5387-6909** |
| Payments account nickname | **AdSense pub-1906616177023494** |
| AdSense publisher ID | `pub-1906616177023494` |
| Play Console developer account | *(fill in the developer name / account ID shown at Play Console → Setup → Developer account)* |

> **Where this is used today:** nowhere inside the app. WordSurge 1.4.x ships **no ads and no
> in-app purchases**, so this payments account is only relevant to (a) the Play Console
> developer registration and (b) a future monetized release. Do not put the ID in the app.

## What the payments profile is — and is not — needed for

| Purpose | Needed now? | Notes |
|---|---|---|
| Pay the one-time Play developer registration fee | Yes | Any card on a Google payments profile works; it does not have to be this one. |
| Publish a **free** app with no in-app purchases (this release) | **No merchant account needed** | Free apps need no merchant/payments setup beyond the registration fee. |
| Sell in-app items / subscriptions later | Merchant account required | Play Console → Setup → Payments profile → *Set up a merchant account*. Once linked to a developer account it **cannot be unlinked or changed**, so choose deliberately. |
| Receive ad revenue later | AdMob account required | AdMob pays out through *its own* linked payments profile. An existing AdSense publisher can sign in to admob.google.com with the same Google account; the publisher ID stays `pub-1906616177023494`. |

**Recommendation:** keep this payments profile as the single profile for the AdSense/AdMob
account. If you plan any in-app purchases, link the *same* profile as the Play merchant
account so all Google earnings and tax documents arrive in one place. If you might ever want
separate legal entities for store sales vs. ad revenue, decide that *before* linking, because
the Play link is permanent.

## ⚠️ AdSense vs AdMob — the critical policy point

Your nickname says **AdSense**. AdSense is for **websites**. Google's program policies forbid
AdSense ad code from being **"integrated into a software application (does not apply to
AdMob)"** — and a WebView-based Android app *is* a software application. Pasting AdSense
`<script>` ad units into WordSurge's HTML would:

1. Violate the AdSense Program Policies → account **disabled** (this is one of the most common
   permanent bans, and it also affects the linked payments profile).
2. Violate Google Play's Ads policy (undeclared ads, no consent flow) → app rejection or removal.
3. Not even work: the game runs from a private local origin with a strict CSP and no INTERNET
   permission, so third-party scripts cannot load.

**The compliant path is AdMob**, which is the same publisher ecosystem (same `pub-…` ID, same
payments profile) but designed for apps:

- Sign in at admob.google.com with the Google account that owns AdSense → your existing
  publisher ID is reused; no second account (having two publisher accounts is itself a policy violation).
- Add the app **after it is live on Google Play** (AdMob's app-readiness review needs the store
  listing), create ad units (e.g. *rewarded* for "extra hint", *interstitial* between levels),
  and integrate the **Google Mobile Ads SDK** (`play-services-ads`) in the Android wrapper, with the
  rewarded/interstitial calls bridged to the game through a small JavaScript interface.
- Because the game UI lives in a WebView, register that WebView with the SDK's
  **WebView API for Ads** so ad requests are attributed correctly (otherwise invalid-traffic flags).
- Publish `app-ads.txt` on the developer website listed in the Play listing
  (`google.com, pub-1906616177023494, DIRECT, f08c47fec0942fa0`) — required for full ad serving.

The AdSense **website** account can still monetize a marketing/landing site for WordSurge
normally; just never the app.

## Everything that must change when ads (or IAP) are added

Doing any of this without the paperwork below is the second most common cause of Play
suspensions ("undisclosed data collection"). Treat this list as a gate for that future release:

| Area | Change required |
|---|---|
| **Android manifest** | Add `INTERNET`, `ACCESS_NETWORK_STATE`, `com.google.android.gms.permission.AD_ID`; add `com.google.android.gms.ads.APPLICATION_ID` meta-data (`ca-app-pub-1906616177023494~<app-id>`) |
| **WebView shell** | Relax the CSP `connect-src`/`script-src` only as far as the SDK needs; keep the game itself local |
| **Consent** | Integrate the **User Messaging Platform (UMP) SDK** and create a GDPR/UK + US-state privacy message in AdMob → *Privacy & messaging*. Required before ad requests in the EEA/UK; also covers the Play "user data consent" requirement |
| **Play Console → Ads declaration** | Change to **Yes, my app contains ads** |
| **Play Console → Data safety** | Declare *Device or other IDs* (advertising ID), *App interactions*, and any diagnostics the SDK collects, shared with Google as an advertising partner; source the answers from the Google Mobile Ads SDK data-disclosure page |
| **Play Console → Advertising ID declaration** | Yes |
| **Privacy policy** (`legal/privacy-policy.html`) | Add sections on advertising, the advertising ID, AdMob/Google as a third party, consent/opt-out (Android *Delete advertising ID*), and links to Google's partner policy page |
| **Content rating (IARC)** | Re-answer: ads present; if rewarded ads promote other games, note that |
| **Target audience / Families** | Keep the audience 13+. If you ever select under-13, only Families self-certified ad SDKs are allowed and rewarded ads have restrictions — simpler not to |
| **Ad experience** | No ads over gameplay controls, no ads that look like game UI, no interstitial at app launch or when leaving, frequency-cap interstitials (the game already reserves the "between levels, after level 3" slot), always let the user decline a rewarded ad |
| **In-app purchases (if added)** | Play Billing Library **8+**, products created in Play Console, server or Play-side purchase verification, restore-purchases button, prices shown before purchase; declare IAP in the listing |
| **Versioning** | New `versionCode`; internal → closed → production again with a staged rollout; watch Android vitals for SDK-related ANRs |
| **THIRD_PARTY_NOTICES.md** | Add Google Mobile Ads SDK / UMP SDK / Billing licences |

## Why the current build is the safest possible first release

- **No ads, no IAP, no SDK, no permissions, no network** → the Ads declaration is *No*, Data
  safety is *No data collected*, and there is nothing for Google's automated policy scanners to
  flag. Most first-app removals come from mismatches between the app's real behaviour and its
  declarations; here there is nothing to mismatch.
- Launching clean also establishes account history. Add AdMob in a **1.5.0** update once the app
  has a live listing (which AdMob needs anyway), a few hundred installs, and a clean vitals record.
