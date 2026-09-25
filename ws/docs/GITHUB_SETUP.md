# WordSurge on GitHub — setup guide

The repository is already initialised locally with a first commit. This guide takes it to
GitHub and switches on the three automations that ship with it.

| Automation | File | What it does |
|---|---|---|
| **CI** | `.github/workflows/ci.yml` | On every push/PR: validates all 5,000 levels, runs Android lint, builds a debug APK (downloadable from the run), runs the 25-check browser smoke test |
| **Release** | `.github/workflows/release.yml` | On a `v*` tag (or manual run): builds, signs and verifies the Play-ready AAB with the upload key from GitHub Secrets and attaches it to a GitHub Release |
| **Legal pages** | `.github/workflows/pages.yml` | Publishes `legal/` on GitHub Pages — this gives you the public privacy-policy URL Google Play requires |

---

## 1. Create the repository and push (5 minutes)

1. On GitHub: **New repository** → name **`wordsurge`** → choose visibility (see §2) → *do not* add a README/licence/.gitignore (they already exist) → **Create repository**.
2. In a terminal, from the folder that contains `wordsurge/`:

```bash
cd wordsurge
git remote add origin https://github.com/<YOUR-USERNAME>/wordsurge.git
git branch -M main
git push -u origin main
```

GitHub will ask you to sign in (browser or personal access token). After the push, the
**Actions** tab shows CI running; it should go green in ~5 minutes.

## 2. Public or private?

- **Private** (recommended for a commercial game): source stays hidden. Free GitHub Pages is
  **not** available on private repos, so publish the legal pages from a *separate public*
  repository instead — one is already prepared for you at `../wordsurge-legal/` (see §3B).
- **Public**: simplest — Pages works from this repo directly (§3A), but anyone can read the code.

## 3. Get the privacy-policy URL for Google Play

### A. Public repo — Pages from this repository
1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Actions → "Legal pages (GitHub Pages)" → Run workflow** (or push any change under `legal/`).
3. Your URLs (live in ~1 minute):
   - `https://<YOUR-USERNAME>.github.io/wordsurge/privacy-policy.html`
   - `https://<YOUR-USERNAME>.github.io/wordsurge/terms.html`
   - `https://<YOUR-USERNAME>.github.io/wordsurge/support.html`

### B. Private repo — Pages from the small public `wordsurge-legal` repo
1. On GitHub: **New repository** → name **`wordsurge-legal`** → **Public** → Create.
2. Push the prepared folder:
   ```bash
   cd ../wordsurge-legal
   git remote add origin https://github.com/<YOUR-USERNAME>/wordsurge-legal.git
   git push -u origin main
   ```
3. **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)` → Save**.
4. Your URLs: `https://<YOUR-USERNAME>.github.io/wordsurge-legal/privacy-policy.html` (and `terms.html`, `support.html`).
5. Whenever you edit `wordsurge/legal/*.html`, copy the files into `wordsurge-legal/` and push again.

### Then
- Paste the privacy-policy URL into **Play Console → App content → Privacy policy**.
- Before filling it in, put your legal name and support e-mail into the "Contact" paragraph of
  the three pages (search for `[Legal entity name]` / `support@example.com`).
- Put the same URLs into the app: edit the `LINKS` block at the top of `web/js/app.js`, bump
  `versionCode` in `android/app/build.gradle`, commit, and tag a release (§4) — the in-app
  *Privacy policy / Terms / Support* buttons will then open your real pages.

## 4. Signed release builds from GitHub (optional but recommended)

Add four repository secrets (**Settings → Secrets and variables → Actions → New repository secret**):

| Secret | Value |
|---|---|
| `WORDSURGE_KEYSTORE_BASE64` | contents of `WordSurge-upload-key.base64.txt` (next to the keystore, outside the repo) |
| `WORDSURGE_STORE_PASSWORD` | *Store password* from `WordSurge-upload-key-credentials.txt` |
| `WORDSURGE_KEY_ALIAS` | `wordsurge-upload` |
| `WORDSURGE_KEY_PASSWORD` | *Key password* from the credentials file |

Then, for every release:

```bash
# edit android/app/build.gradle: versionCode +1, versionName as needed → commit
git tag v1.5.1
git push origin main --tags
```

The **Release** workflow builds, lints, signs and verifies the bundle and publishes it under
**Releases** with the mapping file and SHA-256 sums. Download the `.aab` from there and upload
it to Play Console. (Never commit the `.jks` or the credentials file — `.gitignore` blocks them.)

## 5. Day-to-day

```bash
git pull                              # get the latest
# edit files under web/ (game) or android/ (wrapper)
node tools/validate-levels.mjs        # if you touched levels or the dictionary
git commit -am "Describe the change"
git push                              # CI runs automatically
```

Branch protection (Settings → Branches → *Require status checks* → select the CI jobs) stops a
broken build from reaching `main`.
