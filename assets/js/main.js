// Scientia AI — shared client behavior

function setLang(lang){
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-en]').forEach(el => {
    const val = lang === 'ko' ? el.getAttribute('data-ko') : el.getAttribute('data-en');
    if(val !== null) el.innerHTML = val;
  });
  document.querySelectorAll('[data-en-ph]').forEach(el => {
    const val = lang === 'ko' ? el.getAttribute('data-ko-ph') : el.getAttribute('data-en-ph');
    if(val !== null) el.setAttribute('placeholder', val);
  });
  document.documentElement.lang = lang;
  try{ localStorage.setItem('scientia-lang', lang); }catch(e){}
}

// ---- filtering (chips on the homepage, tag pills anywhere) ----
function applyFilter(f){
  document.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.toggle('active', c.dataset.filter === f));
  document.querySelectorAll('[data-tags]').forEach(entry => {
    const tags = entry.dataset.tags.split(' ');
    entry.classList.toggle('hidden', f !== 'all' && !tags.includes(f));
  });
  // a topic/news block with zero visible entries left behind its own header
  // and an empty-looking gap — hide the whole block instead
  document.querySelectorAll('.filter-group').forEach(group => {
    const anyVisible = group.querySelector('[data-tags]:not(.hidden)');
    group.classList.toggle('hidden', f !== 'all' && !anyVisible);
  });
  const status = document.getElementById('filter-status');
  const label = document.getElementById('filter-status-label');
  if(status && label){
    if(f === 'all'){ status.classList.add('hidden'); }
    else { label.textContent = 'Filtering: ' + f; status.classList.remove('hidden'); }
  }
}

function filterByTag(tag){
  const onHomepage = !!document.querySelector('.filters');
  if(onHomepage){
    applyFilter(tag);
    document.querySelector('#research')?.scrollIntoView({behavior:'smooth', block:'start'});
  } else {
    window.location.href = '/?tag=' + encodeURIComponent(tag) + '#research';
  }
}

function initFilters(){
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => applyFilter(chip.dataset.filter));
  });
  const clearBtn = document.getElementById('filter-status-clear');
  if(clearBtn) clearBtn.addEventListener('click', () => applyFilter('all'));

  const params = new URLSearchParams(window.location.search);
  const tag = params.get('tag');
  if(tag) applyFilter(tag);
}

// ---- notes / mark for class (personal, per-browser bookmark) ----
function toggleNote(btn){
  const box = btn.closest('.entry, article')?.querySelector('.note-box');
  if(box) box.classList.toggle('open');
}

function bookmarkKey(){ return 'scientia-bookmarks'; }

function getBookmarks(){
  try{ return JSON.parse(localStorage.getItem(bookmarkKey())) || []; }catch(e){ return []; }
}

function setBookmarks(list){
  try{ localStorage.setItem(bookmarkKey(), JSON.stringify(list)); }catch(e){}
}

function toggleMark(btn){
  // news rows (list) are the only place this lives now — research uses the
  // authoritative marked_for_class front-matter field instead (see
  // reading-list.html / CLAUDE.md "Reading list page")
  const entry = btn.closest('.list-row, .entry-page');
  const href = entry?.querySelector('.list-title a, .entry-page-title a')?.href || window.location.href;
  const title = entry?.querySelector('.list-title a, .entry-page-title')?.textContent?.trim() || document.title;
  let list = getBookmarks();
  const marking = !list.some(b => b.href === href);
  list = marking ? list.concat([{href, title}]) : list.filter(b => b.href !== href);
  setBookmarks(list);

  btn.classList.toggle('marked', marking);
  if(btn.classList.contains('bookmark-btn')){
    btn.setAttribute('aria-pressed', marking ? 'true' : 'false');
  } else if(btn.hasAttribute('data-en')){
    const activeLangBtn = document.querySelector('.lang-toggle button.active');
    const lang = activeLangBtn ? activeLangBtn.dataset.lang : 'en';
    btn.setAttribute('data-en', marking ? '☑ bookmarked' : '☐ bookmark');
    btn.setAttribute('data-ko', marking ? '☑ 저장됨' : '☐ 북마크');
    btn.textContent = lang === 'ko' ? btn.getAttribute('data-ko') : btn.getAttribute('data-en');
  }
}

function markButtonsFromBookmarks(){
  const bookmarked = new Set(getBookmarks().map(b => b.href));
  document.querySelectorAll('[onclick*="toggleMark"]').forEach(btn => {
    const entry = btn.closest('.list-row, .entry-page');
    const href = entry?.querySelector('.list-title a, .entry-page-title a')?.href;
    if(href && bookmarked.has(href)){
      btn.classList.add('marked');
      if(btn.classList.contains('bookmark-btn')) btn.setAttribute('aria-pressed', 'true');
    }
  });
}

// renders the personal-bookmarks block on the reading-list page, if present
function renderPersonalBookmarks(){
  const list = document.getElementById('bookmark-list');
  const empty = document.getElementById('bookmark-empty');
  if(!list) return;
  const bookmarks = getBookmarks();
  list.innerHTML = '';
  if(empty) empty.style.display = bookmarks.length ? 'none' : 'block';
  bookmarks.forEach(b => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${b.href}">${b.title}</a>`;
    list.appendChild(li);
  });
}

function clearBookmarks(){
  const activeLangBtn = document.querySelector('.lang-toggle button.active');
  const lang = activeLangBtn ? activeLangBtn.dataset.lang : 'en';
  const msg = lang === 'ko' ? '이 브라우저의 북마크된 항목을 모두 지울까요?' : 'Clear all bookmarked articles in this browser?';
  if(!window.confirm(msg)) return;
  setBookmarks([]);
  renderPersonalBookmarks();
}

function initClearBookmarks(){
  document.getElementById('bookmark-clear')?.addEventListener('click', clearBookmarks);
}

// ---- reading frequency calendar: on narrow screens it scrolls (see CSS);
// start scrolled to the right so the most recent weeks are what's visible ----
function initFreqScroll(){
  const scroller = document.getElementById('freq-scroll');
  if(!scroller) return;
  scroller.scrollLeft = scroller.scrollWidth;
}

// ---- mobile hamburger for the sticky subnav ----
function initSubnavToggle(){
  const btn = document.getElementById('subnav-toggle');
  const links = document.getElementById('subnav-links');
  if(!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));
}

// ---- back to top ----
function initBackToTop(){
  const btn = document.getElementById('back-to-top');
  if(!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, {passive:true});
  btn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
}

// ---- subtle "digital rain" background — off by default on reduced-motion ----
function initRain(){
  const canvas = document.getElementById('rain');
  if(!canvas) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const chars = '01アイウエオカキクケコASIRO'.split('');
  let cols, drops, w, h, running = true;

  function size(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const spacing = 26;
    cols = Math.floor(w / spacing);
    drops = new Array(cols).fill(0).map(() => Math.random() * -h / spacing);
  }
  size();
  window.addEventListener('resize', size);

  let lastFrame = 0;
  function draw(ts){
    if(!running){ requestAnimationFrame(draw); return; }
    if(ts - lastFrame < 90){ requestAnimationFrame(draw); return; } // slow, subtle cadence
    lastFrame = ts;
    ctx.fillStyle = 'rgba(22,28,39,0.14)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '14px IBM Plex Mono, monospace';
    for(let i = 0; i < cols; i++){
      const text = chars[Math.floor(Math.random() * chars.length)];
      const x = i * 26;
      const y = drops[i] * 26;
      ctx.fillStyle = i % 5 === 0 ? 'rgba(87,173,152,0.10)' : 'rgba(79,209,255,0.06)';
      ctx.fillText(text, x, y);
      if(y > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
}

window.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initBackToTop();
  initRain();
  initSubnavToggle();
  initClearBookmarks();
  initFreqScroll();
  markButtonsFromBookmarks();
  renderPersonalBookmarks();
  try{
    const savedLang = localStorage.getItem('scientia-lang');
    if(savedLang) setLang(savedLang);
  }catch(e){}
});
