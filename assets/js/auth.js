// Scientia AI — auth + Firestore-backed bookmarks/marks.
// Firebase Auth (Google popup, owner-only writes enforced by firestore.rules)
// replaces the old localStorage bookmark system so state follows Aaron
// across devices instead of being stuck in one browser. See AUTH_SETUP.md
// for the one-time Firebase Console setup this depends on.
//
// Deliberately no client-side email check anywhere in this file — "are you
// really the owner" is answered by attempting a read that firestore.rules
// only allows for the owner's account (see meta/owner_check in
// firestore.rules). If Firebase isn't configured yet (firebase-config.js
// still has placeholder values), everything in this file no-ops quietly —
// the site works fine without it, just without cross-device state.

let fbApp = null, fbAuth = null, fbDb = null, fbFunctions = null;
let isOwner = false;
let bookmarkCache = {}; // docId -> {href, title, kind, source, source_lang, ts}
let classLogCache = {}; // docId -> {href, title, source, source_lang, ts} — permanent, see class_log below

function firebaseReady(){
  return typeof firebase !== 'undefined'
    && typeof FIREBASE_CONFIG !== 'undefined'
    && FIREBASE_CONFIG.apiKey
    && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';
}

function initFirebase(){
  if(!firebaseReady()) return false;
  if(fbApp) return true;
  fbApp = firebase.initializeApp(FIREBASE_CONFIG);
  fbAuth = firebase.auth();
  fbDb = firebase.firestore();
  fbFunctions = firebase.functions();
  return true;
}

// short, deterministic, Firestore-doc-ID-safe key for a URL
function hrefKey(href){
  let h = 0;
  for(let i = 0; i < href.length; i++){ h = (h * 31 + href.charCodeAt(i)) | 0; }
  return 'b' + (h >>> 0).toString(36);
}

// kind is part of the doc ID — the same article can be both a research
// "heart" (kind=research) and "marked for class" (kind=class) at once, and
// those need to be independent documents, not collide on the same ID.
function bookmarkDocId(kind, href){ return kind + '_' + hrefKey(href); }

// ---- academic semester naming (Korean academic calendar: Mar=spring start,
// Jul=summer start, Sep=fall start, Jan=winter start) — no config needed,
// no empty-semester records: this is just a label computed from the date
// something was actually marked, stored as a field on that class_log doc. ----
function semesterId(date){
  const y = date.getFullYear(), m = date.getMonth() + 1; // 1-12
  if(m <= 2) return `${y}-winter`;
  if(m <= 6) return `${y}-1`;
  if(m <= 8) return `${y}-summer`;
  return `${y}-2`;
}
function semesterStart(semId){
  const [yStr, tag] = semId.split('-');
  const y = parseInt(yStr, 10);
  const monthDay = { winter: [0, 1], '1': [2, 1], summer: [6, 1], '2': [8, 1] }[tag];
  return new Date(y, monthDay[0], monthDay[1]);
}

// ---- owner check: a read that only succeeds under the owner's account ----
function checkOwner(){
  return fbDb.collection('meta').doc('owner_check').get()
    .then(() => { isOwner = true; return true; })
    .catch(() => { isOwner = false; return false; });
}

// ---- blurred backdrop shown while the Google popup is open ----
function showAuthOverlay(){
  let el = document.getElementById('auth-overlay');
  if(!el){
    el = document.createElement('div');
    el.id = 'auth-overlay';
    el.className = 'auth-overlay';
    el.innerHTML = '<div class="auth-overlay-msg" data-en="Signing in…" data-ko="로그인 중…">Signing in…</div>';
    document.body.appendChild(el);
  }
  requestAnimationFrame(() => el.classList.add('open'));
}
function hideAuthOverlay(){
  document.getElementById('auth-overlay')?.classList.remove('open');
}

// ---- sign-in, used both by the status dot and by requireOwnerAuth() ----
function signIn(){
  if(!initFirebase()) return Promise.reject(new Error('Firebase not configured'));
  showAuthOverlay();
  const provider = new firebase.auth.GoogleAuthProvider();
  return fbAuth.signInWithPopup(provider)
    .then(() => checkOwner())
    .finally(hideAuthOverlay);
}

function signOut(){
  if(!fbAuth) return;
  fbAuth.signOut();
}

// call with the action to run once we're confirmed-owner-authenticated —
// runs immediately if already signed in as owner, otherwise triggers the
// popup first. Silently does nothing if the signed-in account isn't the
// owner (no error dialog that would tell a random visitor anything useful).
function requireOwnerAuth(action){
  if(!initFirebase()) return;
  if(isOwner){ action(); return; }
  signIn().then(ownerConfirmed => { if(ownerConfirmed) action(); });
}

// ---- auth status dot, next to the language toggle ----
function renderAuthStatus(){
  const el = document.getElementById('auth-status');
  if(el) el.classList.toggle('on', isOwner);
  // reveals owner-only controls (Zotero button, per-item delete icons) —
  // see .zotero-btn / .rl-delete in main.css. Bookmark/heart/class buttons
  // stay visible either way; only clicking them triggers auth.
  document.body.classList.toggle('is-owner', isOwner);
}

function initAuthStatusClick(){
  const el = document.getElementById('auth-status');
  if(!el) return;
  el.addEventListener('click', () => { isOwner ? signOut() : signIn(); });
}

// ---- bookmarks / hearts / class-marks (Firestore-backed) ----
function toggleBookmark(btn, href, title, kind, source, sourceLang){
  requireOwnerAuth(() => {
    const id = bookmarkDocId(kind, href);
    const ref = fbDb.collection('bookmarks').doc(id);
    const marking = !bookmarkCache[id];
    const write = marking
      ? ref.set({ href, title, kind, source: source || '', source_lang: sourceLang || '', ts: firebase.firestore.FieldValue.serverTimestamp() })
      : ref.delete();
    write.catch(err => console.error('bookmark write failed', err)); // onSnapshot below updates the UI either way

    // "mark for class" also upserts the permanent semester log — Clear all
    // only ever touches /bookmarks, never this, so the semester reading
    // list survives weekly resets. Unmarking does NOT remove log history.
    if(kind === 'class' && marking){
      fbDb.collection('class_log').doc(hrefKey(href)).set({
        href, title, source: source || '', source_lang: sourceLang || '',
        semester: semesterId(new Date()),
        ts: firebase.firestore.FieldValue.serverTimestamp(),
      }).catch(err => console.error('class_log write failed', err));
    }
  });
}

// used by the "found this elsewhere" citation form — same effect as
// clicking the flag icon, just for an article that isn't a Jekyll entry on
// this site at all (see initCitationForm()).
function addManualClassEntry(entry){
  const id = bookmarkDocId('class', entry.href);
  fbDb.collection('bookmarks').doc(id).set({
    href: entry.href, title: entry.title, kind: 'class',
    source: entry.source || 'manual entry', source_lang: entry.source_lang || 'en',
    ts: firebase.firestore.FieldValue.serverTimestamp(),
  }).catch(err => console.error('manual entry write failed', err));
  fbDb.collection('class_log').doc(hrefKey(entry.href)).set({
    href: entry.href, title: entry.title,
    source: entry.source || 'manual entry', source_lang: entry.source_lang || 'en',
    semester: semesterId(new Date()),
    ts: firebase.firestore.FieldValue.serverTimestamp(),
  }).catch(err => console.error('manual entry log write failed', err));
}

function removeBookmark(kind, href){
  requireOwnerAuth(() => {
    fbDb.collection('bookmarks').doc(bookmarkDocId(kind, href)).delete()
      .catch(err => console.error('remove failed', err));
  });
}

function applyBookmarkState(){
  document.querySelectorAll('[data-bookmark-href]').forEach(btn => {
    const kind = btn.dataset.bookmarkKind || 'news';
    const id = bookmarkDocId(kind, btn.dataset.bookmarkHref);
    const marked = !!bookmarkCache[id];
    btn.classList.toggle('marked', marked);
    btn.setAttribute('aria-pressed', marked ? 'true' : 'false');
  });
}

// renders one of the Reading List page's two live lists (news bookmarks or
// class-marked research) — same look as the homepage's source tags, plus a
// hover-reveal remove icon (owner only, via body.is-owner in CSS).
function renderBookmarkList(kind, listId, emptyId){
  const list = document.getElementById(listId);
  const empty = document.getElementById(emptyId);
  if(!list) return;
  const items = Object.values(bookmarkCache)
    .filter(b => b.kind === kind)
    .sort((a, b) => (b.ts?.seconds || 0) - (a.ts?.seconds || 0));
  list.innerHTML = '';
  if(empty) empty.style.display = items.length ? 'none' : 'block';
  items.forEach(b => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = b.href; a.textContent = b.title;
    const meta = document.createElement('span');
    meta.className = 'rl-meta';
    if(b.source){
      const src = document.createElement('span');
      src.className = 'rl-src ' + (b.source_lang || '');
      src.textContent = b.source;
      meta.appendChild(src);
    }
    const del = document.createElement('button');
    del.className = 'rl-delete';
    del.title = 'Remove'; del.setAttribute('aria-label', 'Remove');
    del.textContent = '✕';
    del.addEventListener('click', () => removeBookmark(kind, b.href));
    meta.appendChild(del);
    li.appendChild(a); li.appendChild(meta);
    list.appendChild(li);
  });
}

function clearAllBookmarks(kind){
  requireOwnerAuth(() => {
    const activeLangBtn = document.querySelector('.lang-toggle button.active');
    const lang = activeLangBtn ? activeLangBtn.dataset.lang : 'en';
    const msg = lang === 'ko' ? '목록을 모두 지울까요?' : 'Clear this list?';
    if(!window.confirm(msg)) return;
    const batch = fbDb.batch();
    Object.entries(bookmarkCache).forEach(([id, b]) => {
      if(b.kind === kind) batch.delete(fbDb.collection('bookmarks').doc(id));
    });
    batch.commit().catch(err => console.error('clear all failed', err));
  });
}

function initClearButtons(){
  document.getElementById('bookmark-clear')?.addEventListener('click', () => clearAllBookmarks('news'));
  document.getElementById('class-clear')?.addEventListener('click', () => clearAllBookmarks('class'));
}

function listenBookmarks(){
  if(!initFirebase()) return;
  fbDb.collection('bookmarks').onSnapshot(snap => {
    const next = {};
    snap.forEach(doc => { next[doc.id] = doc.data(); });
    bookmarkCache = next;
    applyBookmarkState();
    renderBookmarkList('news', 'bookmark-list', 'bookmark-empty');
    renderBookmarkList('class', 'class-list', 'class-empty');
  }, err => console.error('bookmark listen failed', err));
}

// ---- semester reading list (permanent class_log, grouped by semester then week) ----
// window.SEMESTER_SKIPS (see reading-list.html) = {"2026-2": [7, 8], ...} — optional,
// only needed to force-suppress a week that did get something marked (e.g. by
// mistake during a break) — a week with nothing marked never appears anyway.
function weekNumber(tsSeconds, semId){
  const start = semesterStart(semId);
  const d = new Date(tsSeconds * 1000);
  const days = Math.floor((d - start) / 86400000);
  return Math.floor(days / 7) + 1;
}

function renderSemesterList(){
  const container = document.getElementById('semester-weeks');
  if(!container) return;
  const skips = window.SEMESTER_SKIPS || {};
  const bySemester = {};
  Object.values(classLogCache).forEach(item => {
    if(!item.ts?.seconds) return;
    const sem = item.semester || semesterId(new Date(item.ts.seconds * 1000));
    const wk = weekNumber(item.ts.seconds, sem);
    if(wk < 1 || (skips[sem] || []).includes(wk)) return;
    (bySemester[sem] = bySemester[sem] || {})[wk] = (bySemester[sem][wk] || []).concat([item]);
  });
  const semesters = Object.keys(bySemester).sort().reverse(); // most recent first
  container.innerHTML = '';
  const empty = document.getElementById('semester-empty');
  if(empty) empty.style.display = semesters.length ? 'none' : 'block';
  semesters.forEach(sem => {
    const block = document.createElement('div');
    block.className = 'semester-block';
    const semHead = document.createElement('h2');
    semHead.textContent = sem;
    block.appendChild(semHead);
    const weeks = Object.keys(bySemester[sem]).map(Number).sort((a, b) => a - b);
    weeks.forEach(wk => {
      const items = bySemester[sem][wk].sort((a, b) => (a.ts.seconds || 0) - (b.ts.seconds || 0));
      const section = document.createElement('div');
      section.className = 'semester-week';
      const h = document.createElement('h3');
      h.textContent = `Week ${wk}`;
      section.appendChild(h);
      const ul = document.createElement('ul');
      ul.className = 'course-list';
      items.forEach(b => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = b.href; a.textContent = b.title;
        li.appendChild(a);
        if(b.source){
          const src = document.createElement('span');
          src.className = 'rl-src ' + (b.source_lang || '');
          src.textContent = b.source;
          li.appendChild(src);
        }
        ul.appendChild(li);
      });
      section.appendChild(ul);
      block.appendChild(section);
    });
    container.appendChild(block);
  });
}

function listenClassLog(){
  if(!document.getElementById('semester-weeks')) return; // only needed on the reading list page
  if(!initFirebase()) return;
  fbDb.collection('class_log').onSnapshot(snap => {
    const next = {};
    snap.forEach(doc => { next[doc.id] = doc.data(); });
    classLogCache = next;
    renderSemesterList();
  }, err => console.error('class_log listen failed', err));
}

// ---- "found this elsewhere" citation form (Reading List page, owner only) ----
// Accepts either a pasted BibTeX entry (parsed client-side — no lookup
// needed, the export already has everything) or a bare DOI / doi.org URL
// (resolved live via Crossref's API, which is CORS-open for browser fetch).
// Deliberately doesn't try to guess arbitrary citation formats or scrape
// arbitrary URLs — those two inputs cover what Google Scholar/arXiv/Zotero/
// journal sites actually hand you, reliably, with no backend involved.
function parseBibtex(text){
  if(!text.trim().startsWith('@')) return null;
  const get = (key) => {
    const m = text.match(new RegExp(key + '\\s*=\\s*[{"]([^}"]+)[}"]', 'i'));
    return m ? m[1].replace(/[{}]/g, '').trim() : null;
  };
  const title = get('title');
  const doi = get('doi');
  const url = get('url') || (doi ? `https://doi.org/${doi}` : null);
  if(!title || !url) return null;
  const author = get('author');
  const year = get('year');
  return {
    title, href: url,
    source: (author ? author.split(' and ')[0].split(',')[0].trim() : null) || 'manual entry',
    source_lang: 'en',
    date: year || '',
  };
}

function isDoiLike(text){
  return /^(https?:\/\/(dx\.)?doi\.org\/)?10\.\d{4,9}\/\S+$/i.test(text.trim());
}

function fetchCrossref(text){
  const doi = text.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
    .then(r => { if(!r.ok) throw new Error('Crossref lookup failed — check the DOI.'); return r.json(); })
    .then(data => {
      const m = data.message || {};
      const title = Array.isArray(m.title) ? m.title[0] : m.title;
      if(!title) throw new Error('Crossref returned no title for that DOI.');
      const authors = (m.author || []).map(a => [a.given, a.family].filter(Boolean).join(' '));
      return {
        title, href: m.URL || `https://doi.org/${doi}`,
        source: authors[0] || 'manual entry', source_lang: 'en',
      };
    });
}

function submitCitation(){
  const input = document.getElementById('citation-input');
  const status = document.getElementById('citation-status');
  const text = input.value.trim();
  if(!text) return;
  status.textContent = '';
  status.className = '';
  const bib = parseBibtex(text);
  const resolved = bib ? Promise.resolve(bib)
    : isDoiLike(text) ? (status.textContent = 'Looking up…', fetchCrossref(text))
    : Promise.reject(new Error('Paste a BibTeX entry (starting with @) or a DOI.'));
  resolved.then(entry => {
    requireOwnerAuth(() => addManualClassEntry(entry));
    status.textContent = `Added: ${entry.title}`;
    status.className = 'ok';
    input.value = '';
  }).catch(err => {
    status.textContent = err.message;
    status.className = 'error';
  });
}

function initCitationForm(){
  document.getElementById('citation-submit')?.addEventListener('click', submitCitation);
}

// ---- Zotero one-click add (owner only — see functions/index.js) ----
function callZotero(btn){
  requireOwnerAuth(() => {
    btn.disabled = true;
    btn.classList.remove('error');
    const data = {
      title: btn.dataset.zoteroTitle,
      url: btn.dataset.zoteroUrl,
      date: btn.dataset.zoteroDate || '',
      arxivId: btn.dataset.zoteroArxivId || null,
      authors: btn.dataset.zoteroAuthors ? JSON.parse(btn.dataset.zoteroAuthors) : [],
    };
    fbFunctions.httpsCallable('addToZotero')(data)
      .then(() => { btn.classList.add('done'); })
      .catch(err => {
        console.error('addToZotero failed', err);
        btn.classList.add('error');
      })
      .finally(() => { btn.disabled = false; });
  });
}

function initZoteroButtons(){
  document.querySelectorAll('.zotero-btn').forEach(btn => {
    btn.addEventListener('click', () => callZotero(btn));
  });
}

// ---- wire up click handlers on whatever bookmark/heart/class buttons exist on this page ----
function initBookmarkButtons(){
  document.querySelectorAll('[data-bookmark-href]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBookmark(
        btn,
        btn.dataset.bookmarkHref,
        btn.dataset.bookmarkTitle || document.title,
        btn.dataset.bookmarkKind || 'news',
        btn.dataset.bookmarkSource,
        btn.dataset.bookmarkSourceLang
      );
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initBookmarkButtons();
  initZoteroButtons();
  initAuthStatusClick();
  initClearButtons();
  initCitationForm();
  if(!initFirebase()) return; // not configured yet — everything above still renders, just inert
  listenBookmarks();
  listenClassLog();
  fbAuth.onAuthStateChanged(user => {
    if(!user){ isOwner = false; renderAuthStatus(); return; }
    checkOwner().then(renderAuthStatus);
  });
});
