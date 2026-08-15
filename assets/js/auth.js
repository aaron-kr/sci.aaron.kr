// Scientia AI — auth + Firestore-backed bookmarks.
// Firebase Auth (Google popup, owner-only writes enforced by firestore.rules)
// replaces the old localStorage bookmark system so "interesting to me" state
// follows Aaron across devices instead of being stuck in one browser. See
// AUTH_SETUP.md for the one-time Firebase Console setup this depends on.
//
// Deliberately no client-side email check anywhere in this file — "are you
// really the owner" is answered by attempting a read that firestore.rules
// only allows for the owner's account (see meta/owner_check in
// firestore.rules). If Firebase isn't configured yet (firebase-config.js
// still has placeholder values), everything in this file no-ops quietly —
// the site works fine without it, just without cross-device bookmarks.

let fbApp = null, fbAuth = null, fbDb = null, fbFunctions = null;
let isOwner = false;
let bookmarkCache = {}; // href -> {kind, ts} — kept in sync via onSnapshot

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
  // reveals owner-only controls (Zotero one-click button) — see .zotero-btn
  // in main.css. Bookmark/heart buttons stay visible either way; only
  // clicking them triggers auth (see requireOwnerAuth), so no toggle here.
  document.body.classList.toggle('is-owner', isOwner);
}

function initAuthStatusClick(){
  const el = document.getElementById('auth-status');
  if(!el) return;
  el.addEventListener('click', () => { isOwner ? signOut() : signIn(); });
}

// ---- bookmarks (Firestore-backed; replaces the old localStorage version) ----
function toggleBookmark(btn, href, title, kind){
  requireOwnerAuth(() => {
    const key = hrefKey(href);
    const ref = fbDb.collection('bookmarks').doc(key);
    const marking = !bookmarkCache[key];
    const write = marking
      ? ref.set({ href, title, kind, ts: firebase.firestore.FieldValue.serverTimestamp() })
      : ref.delete();
    write.catch(err => console.error('bookmark write failed', err)); // onSnapshot below updates the UI either way
  });
}

function applyBookmarkState(){
  document.querySelectorAll('[data-bookmark-href]').forEach(btn => {
    const key = hrefKey(btn.dataset.bookmarkHref);
    const marked = !!bookmarkCache[key];
    btn.classList.toggle('marked', marked);
    btn.setAttribute('aria-pressed', marked ? 'true' : 'false');
  });
}

function renderPersonalBookmarks(){
  const list = document.getElementById('bookmark-list');
  const empty = document.getElementById('bookmark-empty');
  if(!list) return;
  const items = Object.values(bookmarkCache)
    .filter(b => b.kind === 'news')
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  list.innerHTML = '';
  if(empty) empty.style.display = items.length ? 'none' : 'block';
  items.forEach(b => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = b.href; a.textContent = b.title;
    li.appendChild(a);
    list.appendChild(li);
  });
}

function clearAllBookmarks(kind){
  requireOwnerAuth(() => {
    const activeLangBtn = document.querySelector('.lang-toggle button.active');
    const lang = activeLangBtn ? activeLangBtn.dataset.lang : 'en';
    const msg = lang === 'ko' ? '북마크한 기사를 모두 지울까요?' : 'Clear all bookmarked articles?';
    if(!window.confirm(msg)) return;
    const batch = fbDb.batch();
    Object.entries(bookmarkCache).forEach(([key, b]) => {
      if(b.kind === kind) batch.delete(fbDb.collection('bookmarks').doc(key));
    });
    batch.commit().catch(err => console.error('clear all failed', err));
  });
}

function initClearBookmarks(){
  document.getElementById('bookmark-clear')?.addEventListener('click', () => clearAllBookmarks('news'));
}

function listenBookmarks(){
  if(!initFirebase()) return;
  fbDb.collection('bookmarks').onSnapshot(snap => {
    const next = {};
    snap.forEach(doc => { next[doc.id] = doc.data(); });
    bookmarkCache = next;
    applyBookmarkState();
    renderPersonalBookmarks();
  }, err => console.error('bookmark listen failed', err));
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

// ---- wire up click handlers on whatever bookmark/heart buttons exist on this page ----
function initBookmarkButtons(){
  document.querySelectorAll('[data-bookmark-href]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBookmark(btn, btn.dataset.bookmarkHref, btn.dataset.bookmarkTitle || document.title, btn.dataset.bookmarkKind || 'news');
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initBookmarkButtons();
  initZoteroButtons();
  initAuthStatusClick();
  initClearBookmarks();
  if(!initFirebase()) return; // not configured yet — everything above still renders, just inert
  listenBookmarks();
  fbAuth.onAuthStateChanged(user => {
    if(!user){ isOwner = false; renderAuthStatus(); return; }
    checkOwner().then(renderAuthStatus);
  });
});
