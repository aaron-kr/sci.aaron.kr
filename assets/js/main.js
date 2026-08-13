// Scientia — shared client behavior (lang toggle, filters, mark/note, course view, watches)

function setLang(lang){
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-en]').forEach(el => {
    const val = lang === 'ko' ? el.getAttribute('data-ko') : el.getAttribute('data-en');
    if(val !== null) el.textContent = val;
  });
  document.querySelectorAll('[data-en-ph]').forEach(el => {
    const val = lang === 'ko' ? el.getAttribute('data-ko-ph') : el.getAttribute('data-en-ph');
    if(val !== null) el.setAttribute('placeholder', val);
  });
  document.documentElement.lang = lang;
}

function initFilters(){
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.filter;
      document.querySelectorAll('[data-tags]').forEach(entry => {
        const tags = entry.dataset.tags.split(' ');
        entry.classList.toggle('hidden', f !== 'all' && !tags.includes(f));
      });
    });
  });
}

function toggleNote(btn){
  const box = btn.closest('.entry, article')?.querySelector('.note-box');
  if(box) box.classList.toggle('open');
}

function toggleMark(btn){
  btn.classList.toggle('marked');
  const activeLangBtn = document.querySelector('.lang-toggle button.active');
  const lang = activeLangBtn ? activeLangBtn.dataset.lang : 'en';
  const marking = btn.classList.contains('marked');
  if(btn.hasAttribute('data-en')){
    btn.setAttribute('data-en', marking ? '☑ marked for class' : '☐ mark for class');
    btn.setAttribute('data-ko', marking ? '☑ 표시됨' : '☐ 수업용으로 표시');
    btn.textContent = lang === 'ko' ? btn.getAttribute('data-ko') : btn.getAttribute('data-en');
  } else {
    btn.textContent = marking ? '☑ marked for class' : '☐ mark for class';
  }
  renderCourseView();
}

function renderCourseView(){
  const list = document.getElementById('course-list');
  const empty = document.getElementById('course-empty');
  const count = document.getElementById('course-count');
  if(!list) return;
  list.innerHTML = '';
  const marked = Array.from(document.querySelectorAll('.entry-actions button.marked'));
  count.textContent = marked.length + ' items';
  empty.style.display = marked.length ? 'none' : 'block';
  marked.forEach(btn => {
    const entry = btn.closest('.entry');
    const titleEl = entry && entry.querySelector('.entry-title a, .entry-title');
    if(!titleEl) return;
    const srcEl = entry.querySelector('.src-tag');
    const li = document.createElement('li');
    li.innerHTML = `<span>${titleEl.textContent}</span><span>${srcEl ? srcEl.textContent.trim() : ''}</span>`;
    list.appendChild(li);
  });
}

function toggleCourse(){
  const el = document.getElementById('course');
  el.classList.toggle('open');
  if(el.classList.contains('open')) el.scrollIntoView({behavior:'smooth', block:'start'});
}

// ---- sources/watches panel: colleague-added watches persisted client-side ----
// The default source list is static markup in index.html (grouped by topic).
// This only handles watches a colleague adds live via the form below it.
async function initWatches(){
  let extra = [];
  try{
    const stored = await window.storage.get('scientia-watches', false);
    if(stored && stored.value) extra = JSON.parse(stored.value);
  }catch(e){ /* no stored watches yet */ }
  renderWatches(extra);

  const form = document.getElementById('add-watch-form');
  if(!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const entry = {
      label: f.label.value.trim(),
      type: f.type.value,
      value: f.value.value.trim(),
      lang: f.lang.value,
      owner: f.owner.value.trim()
    };
    if(!entry.label || !entry.value || !entry.owner) return;
    extra.push(entry);
    try{ await window.storage.set('scientia-watches', JSON.stringify(extra), false); }catch(err){ console.error(err); }
    renderWatches(extra);
    f.reset();
  });
}

function renderWatches(extra){
  const enList = document.getElementById('watch-list-en');
  const koList = document.getElementById('watch-list-ko');
  const section = document.getElementById('colleague-watches');
  if(!enList || !koList) return;
  enList.innerHTML = ''; koList.innerHTML = '';
  const typeLabel = t => t === 'api' ? 'API' : t === 'rss' ? 'RSS' : t === 'keyword' ? 'keyword' : 'manual';

  extra.forEach(w => appendWatch(w.lang === 'ko' ? koList : enList, w.label, typeLabel(w.type), w.owner));
  if(section) section.style.display = extra.length ? 'block' : 'none';
}

function appendWatch(list, label, type, owner){
  const li = document.createElement('li');
  li.innerHTML = `<span>${label}</span><span class="method">${type} · ${owner}</span>`;
  list.appendChild(li);
}

function quickAddWatch(){
  const input = document.getElementById('quick-watch');
  const val = input.value.trim();
  if(!val) return;
  const form = document.getElementById('add-watch-form');
  form.querySelector('[name="label"]').value = val;
  form.querySelector('[name="value"]').value = val;
  form.querySelector('[name="owner"]').value = 'Aaron';
  form.requestSubmit();
  input.value = '';
  document.getElementById('sources').scrollIntoView({behavior:'smooth', block:'start'});
}

window.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initWatches();
});
