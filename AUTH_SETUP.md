# AUTH_SETUP.md — Firebase auth, bookmarks, and Zotero

> **Already set up? One update needed.** Session 7 added a `class_log`
> collection (the permanent semester reading list — see CLAUDE.md). Re-open
> **Firebase Console → Firestore Database → Rules**, replace the deployed
> rules with the current `firestore.rules` in this repo (with `OWNER_EMAIL`
> swapped for your real email, same as before), and **Publish**. Nothing
> else in this doc needs redoing.

This is the piece the site needs from you before hearts/bookmarks and the
Zotero one-click button do anything — right now everything degrades quietly
(buttons render, clicking them just does nothing) because `firebase-config.js`
still has placeholder values. Nothing here is urgent; the rest of the site
works fine without it.

**On security, since this came up before:** your email is not in this repo
anywhere, in any file, committed or not. It only ever gets typed into two
places, both outside git — the Firebase Console's Firestore Rules editor,
and (for the Zotero function) `firebase functions:secrets:set`, which stores
it in Google Secret Manager, not in any file. The Firebase *config* values
below (apiKey, projectId, etc.) are genuinely not secrets — Firebase's own
docs say so explicitly (they identify the project publicly; security comes
from Firestore rules + Auth, not from hiding these) — so those are fine to
commit plainly, same as every public Firebase web app does.

---

## 1. Create the Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it something like `scientia-ai` (separate from the attend app's project, per your call).
2. You don't need Google Analytics for this — skip it if asked.
3. **Build → Authentication** → **Get started** → enable **Google** as a sign-in provider. Under that provider's settings, no need to restrict anything here — the real restriction happens in Firestore rules (step 3), not in Auth itself.
4. **Build → Firestore Database** → **Create database** → start in **production mode** (not test mode) → pick a region close to you (`asia-northeast3` — Seoul — is the obvious choice).

## 2. Fill in `assets/js/firebase-config.js`

1. **Project Settings** (gear icon) → scroll to **Your apps** → **Add app → Web** (`</>` icon) → register it (any nickname) → **don't** check "also set up Firebase Hosting" (this site stays on GitHub Pages).
2. Copy the `firebaseConfig` object it shows you into `assets/js/firebase-config.js`, replacing the `YOUR_...` placeholders. This file is meant to be committed as-is with your real values — see the note at the top of this doc on why that's fine.

## 3. Publish Firestore rules (your email goes here, and only here)

1. Open `firestore.rules` in this repo — it's a reference template with `OWNER_EMAIL` as a placeholder.
2. **Firebase Console → Firestore Database → Rules** tab.
3. Paste the contents of `firestore.rules`, but replace both occurrences of `OWNER_EMAIL` with your real Google account email.
4. **Publish**. This deployed version (with your real email) lives only in the Firebase Console from now on — never paste it back into the repo file, which should keep saying `OWNER_EMAIL`.

At this point hearts, bookmarks, and the auth status dot should work: visit
the live site, click a heart/bookmark icon, sign in with your Google
account in the popup, and it should stick — including across devices, since
it's Firestore now, not localStorage.

## 4. (Optional) Zotero one-click add

Skip this section entirely if you don't want it yet — the public-facing
Zotero feature (citation meta tags, works with anyone's Zotero Connector
extension) already works with zero setup, nothing below is needed for that.

This part needs the Firebase CLI, which needs Node.js installed.

1. `npm install -g firebase-tools` (one-time).
2. From the repo root: `firebase login`, then `firebase use --add` and pick the project you made in step 1.
3. Get your Zotero API key and user ID from **zotero.org/settings/keys** → **Create new private key** → give it **write access to your personal library** only (nothing else needs checking). The page also shows your numeric **userID** near the top — grab both.
4. Set three secrets (each prompts you to paste a value — nothing you type here is ever written to a file):
   ```
   firebase functions:secrets:set OWNER_EMAIL
   firebase functions:secrets:set ZOTERO_API_KEY
   firebase functions:secrets:set ZOTERO_USER_ID
   ```
5. `cd functions && npm install && cd ..`
6. `firebase deploy --only functions`

Once deployed, the "Z" button appears next to hearts/Zotero-eligible entries,
but *only when you're signed in as the owner* — it's invisible to everyone
else, by design (see CLAUDE.md "Zotero integration").

**Untested, flag anything odd:** I haven't been able to test the actual
Zotero API call against a real key — the item fields in `functions/index.js`
follow Zotero's published Web API v3 schema for their "preprint" item type,
but if the first real item that lands in your library looks wrong (missing
author, wrong item type, etc.), tell me and I'll adjust the field mapping.

## 5. Redeploying the function later

Whenever `functions/index.js` changes, re-run `firebase deploy --only
functions` yourself — this repo's GitHub Pages deploy doesn't touch Firebase
at all, so there's no CI step that does this automatically. That's
deliberate: one fewer credential (a service-account key) that would
otherwise need to live in GitHub Secrets for very little benefit, since
you're the only one who'd ever run this.
