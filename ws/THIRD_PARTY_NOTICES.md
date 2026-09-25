# Third-Party Notices

WordSurge's source code, visual design, interface, artwork, icons, motion, synthesized audio,
level layouts and progression were created for this project and do not use assets from any
existing game.

## Generator lexicon (`web/js/dictionary.js`)

The word list used **only** to seed procedural puzzles (levels 101 and up) is derived from:

- **FrequencyWords** by Hermit Dave — https://github.com/hermitdave/FrequencyWords
  (English 2018 list built from the OpenSubtitles corpus). Licence: Creative Commons
  Attribution-ShareAlike 4.0 — https://creativecommons.org/licenses/by-sa/4.0/
- **ENABLE** word list (Enhanced North American Benchmark Lexicon) — public domain.
- **LDNOOBW** (List of Dirty, Naughty, Obscene, and Otherwise Bad Words) —
  https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words — used only
  as an *exclusion* filter; none of its entries ship in the app. Licence: CC BY 4.0.

Transformation: the 50,000 most frequent FrequencyWords tokens were reduced to ASCII
alphabetic words of 3–8 letters, intersected with ENABLE so only dictionary words remain
(removing names, places, contractions and slang), filtered with the LDNOOBW list plus a curated blocklist (profanity, slurs, sexual content, alcohol/tobacco/drugs, graphic violence, religion, gambling) for a PEGI 3 / "Everyone" rating,
de-duplicated, upper-cased, and kept in frequency order. Only the ordering is retained from
FrequencyWords; no counts are shipped.

This attribution satisfies CC BY-SA 4.0 for the adapted list. The adapted list itself remains
under CC BY-SA 4.0; the application code and design are not derivative of the corpus.

## Fonts and platform components

The app uses the device's system font and the Android System WebView; no font files or
libraries are bundled. The Android wrapper has no third-party dependencies.
