# Google Play Data Safety — WordSurge 1.5.0

This guidance applies only to the current offline release bundle, before enabling real advertising, analytics, purchases, cloud save, crash reporting, or support SDKs.

## Current implementation

- No account or login
- No advertising SDK
- No analytics provider; a small in-memory event log exists for future providers and is never written to storage or sent anywhere
- No crash-reporting provider
- No billing library or real purchases
- No cloud save
- No Android permissions at all (not even INTERNET); no location, contacts, photos, microphone, camera, advertising ID, or device identifier access
- Gameplay and calendar data remain in local app storage
- Device date, time, time zone, and locale are processed locally
- Android platform backup may back up app-private data according to the user’s Android settings

## Suggested Play Console answers for this exact bundle

- **Does the app collect or share required user data types?** No
- **Is all user data encrypted in transit?** Not applicable; no developer-controlled transmission
- **Can users request data deletion?** No account exists. Explain that Settings → Reset Progress, clearing Android app storage, or uninstalling deletes local data, subject to Android backup settings.
- **Does the app contain ads?** No
- **Does the app use Advertising ID?** No
- **App access:** All functionality is available without login
- **Financial features:** None
- **Health features:** None
- **Government affiliation:** None
- **News or magazine:** No

## Mandatory review before enabling providers

If any provider is activated, reassess and update the Data safety form, privacy policy, consent UI, and Families compliance before uploading the changed bundle. In particular:

- Advertising may collect device identifiers, app interactions, diagnostics, and coarse location.
- Analytics or crash reporting may collect app interactions, diagnostics, device information, and identifiers.
- Cloud save may collect account identifiers and gameplay data.
- Billing may process purchase history through Google Play.

The Data safety form must describe the practices of every SDK in every distributed region, even if a feature is disabled for some users.
