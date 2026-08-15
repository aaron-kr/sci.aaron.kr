// Cloud Function backing the owner-only "Add to Zotero" button.
//
// This is deliberately the ONLY backend piece in this whole feature — the
// public-facing side (anyone with the Zotero Connector browser extension)
// works entirely from citation <meta> tags on each entry's permalink page
// (see _layouts/default.html), no server involved. This function exists
// only because *writing* to Aaron's own Zotero library needs his personal
// Zotero API key, which must never be readable from the browser — so it
// lives here, in Secret Manager, never in this repo or in client JS.
//
// Deploy: `firebase deploy --only functions` (run manually — see
// AUTH_SETUP.md; this repo's GitHub Pages deploy doesn't touch Firebase
// at all, so there's no CI wiring to keep in sync here).
//
// UNTESTED against a real Zotero API key as of writing — the item-type
// field names below (creators/repository/archiveID) follow Zotero's
// published Web API v3 schema for the "preprint" item type, but Aaron
// should sanity-check the first real item that lands in his library and
// tell me if any field comes through wrong. See
// https://www.zotero.org/support/dev/web_api/v3/write_requests

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const OWNER_EMAIL = defineSecret("OWNER_EMAIL");
const ZOTERO_API_KEY = defineSecret("ZOTERO_API_KEY");
const ZOTERO_USER_ID = defineSecret("ZOTERO_USER_ID");

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const lastName = parts.pop() || fullName;
  return { creatorType: "author", firstName: parts.join(" "), lastName };
}

exports.addToZotero = onCall(
  { secrets: [OWNER_EMAIL, ZOTERO_API_KEY, ZOTERO_USER_ID] },
  async (request) => {
    // onCall already verifies the caller's Firebase ID token — request.auth
    // is trustworthy. Still must check WHICH account: any signed-in Google
    // user reaches this line, only the owner should be able to spend the
    // Zotero API key.
    if (!request.auth || request.auth.token.email !== OWNER_EMAIL.value()) {
      throw new HttpsError("permission-denied", "Not authorized.");
    }

    const { title, authors, date, url, arxivId } = request.data || {};
    if (!title || !url) {
      throw new HttpsError("invalid-argument", "Missing title or url.");
    }

    const item = {
      itemType: arxivId ? "preprint" : "webpage",
      title,
      creators: (authors || []).map(splitName),
      url,
      date: date || "",
      abstractNote: "",
    };
    if (arxivId) {
      item.repository = "arXiv";
      item.archiveID = `arXiv:${arxivId}`;
    }

    const resp = await fetch(`https://api.zotero.org/users/${ZOTERO_USER_ID.value()}/items`, {
      method: "POST",
      headers: {
        "Zotero-API-Key": ZOTERO_API_KEY.value(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify([item]),
    });
    const result = await resp.json();
    if (!resp.ok) {
      throw new HttpsError("internal", `Zotero API error: ${JSON.stringify(result)}`);
    }
    const added = result.successful && Object.keys(result.successful).length > 0;
    if (!added) {
      throw new HttpsError("internal", `Zotero rejected the item: ${JSON.stringify(result.failed || result)}`);
    }
    return { success: true };
  }
);
