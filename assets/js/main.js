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

// ---- personal notes (unrelated to bookmarks — a free-text gloss box) ----
function toggleNote(btn){
  const box = btn.closest('.entry, article')?.querySelector('.note-box');
  if(box) box.classList.toggle('open');
}

// Bookmarks (research hearts + news bookmarks) now live in auth.js —
// Firestore-backed so they follow Aaron across devices instead of being
// stuck in one browser's localStorage. See auth.js and AUTH_SETUP.md.

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
  initFreqScroll();
  try{
    const savedLang = localStorage.getItem('scientia-lang');
    if(savedLang) setLang(savedLang);
  }catch(e){}
});
