// Scientia AI — /tools/ page: BibTeX/DOI → citation converter, the Weekly
// Reading Discussion templates, and the AI-phrasing self-check. Pure
// client-side, no backend, no Firebase — every student needs this to work
// with zero sign-in, unlike the owner-only "add to reading list" form in
// auth.js (which this deliberately does not reuse, field-for-field
// duplication and all — that form is intentionally hidden from non-owners).

// ---------- BibTeX / DOI → structured entry ----------
// Handles one level of nested braces ({Some {AI} Model}) — covers the
// overwhelming majority of BibTeX exported by Google Scholar, Zotero, and
// Crossref itself, without pulling in a full grammar-based parser.
function bibField(text, key){
  const braceRe = new RegExp(key + '\\s*=\\s*\\{((?:[^{}]|\\{[^{}]*\\})*)\\}', 'i');
  const quoteRe = new RegExp(key + '\\s*=\\s*"([^"]*)"', 'i');
  const m = text.match(braceRe) || text.match(quoteRe);
  if(!m) return '';
  return m[1].replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}

function parseBibtexEntry(text){
  text = text.trim();
  if(!text.startsWith('@')) return null;
  const typeMatch = text.match(/^@(\w+)/);
  const title = bibField(text, 'title');
  if(!title) return null;
  const year = bibField(text, 'year') || (bibField(text, 'date').match(/\d{4}/) || [])[0] || '';
  const doi = bibField(text, 'doi');
  return {
    type: typeMatch ? typeMatch[1].toLowerCase() : 'article',
    title, year, doi,
    author: bibField(text, 'author'),
    journal: bibField(text, 'journal') || bibField(text, 'booktitle') || bibField(text, 'publisher'),
    volume: bibField(text, 'volume'),
    number: bibField(text, 'number'),
    pages: bibField(text, 'pages'),
    url: bibField(text, 'url') || (doi ? `https://doi.org/${doi}` : ''),
  };
}

function isDoiLike(text){
  return /^(https?:\/\/(dx\.)?doi\.org\/)?10\.\d{4,9}\/\S+$/i.test(text.trim());
}

// Crossref is CORS-open for browser fetch — same approach as the "found
// this elsewhere" form on the reading list, just resolving into the fuller
// field set the citation formatters below need (journal, volume, pages…).
function fetchCrossrefEntry(text){
  const doi = text.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
    .then(r => { if(!r.ok) throw new Error('Crossref lookup failed — check the DOI.'); return r.json(); })
    .then(data => {
      const m = data.message || {};
      const title = Array.isArray(m.title) ? m.title[0] : m.title;
      if(!title) throw new Error('Crossref returned no title for that DOI.');
      const author = (m.author || []).map(a => [a.given, a.family].filter(Boolean).join(' ')).join(' and ');
      const year = (m.issued && m.issued['date-parts'] && m.issued['date-parts'][0] && m.issued['date-parts'][0][0]) || '';
      const journal = (Array.isArray(m['container-title']) ? m['container-title'][0] : m['container-title']) || m.publisher || '';
      return {
        type: 'article', title, author, year: String(year), journal,
        volume: m.volume || '', number: m.issue || '', pages: m.page || '',
        doi, url: m.URL || `https://doi.org/${doi}`,
      };
    });
}

function resolveEntry(text){
  const bib = parseBibtexEntry(text);
  if(bib) return Promise.resolve(bib);
  if(isDoiLike(text)) return fetchCrossrefEntry(text);
  return Promise.reject(new Error('Paste a BibTeX entry (starting with @) or a bare DOI (10.xxxx/…).'));
}

// ---------- author name handling ----------
function parseAuthorList(raw){
  if(!raw) return [];
  return raw.split(/\s+and\s+/i).map(a => a.trim()).filter(Boolean).map(a => {
    if(a.includes(',')){
      const [last, first = ''] = a.split(',').map(s => s.trim());
      return { first, last, full: first ? `${first} ${last}` : last };
    }
    const parts = a.split(/\s+/);
    if(parts.length <= 1) return { first: '', last: a, full: a };
    return { first: parts.slice(0, -1).join(' '), last: parts.at(-1), full: a };
  });
}
function initials(first){
  return first ? first.split(/\s+/).map(p => p[0] ? p[0].toUpperCase() + '.' : '').join(' ') : '';
}
const apaName = a => initials(a.first) ? `${a.last}, ${initials(a.first)}` : a.last;
const ieeeName = a => initials(a.first) ? `${initials(a.first)} ${a.last}` : a.last;
const fullFirst = a => a.first ? `${a.last}, ${a.first}` : a.last;

function joinAPA(list){
  const n = list.map(apaName);
  if(n.length === 1) return n[0];
  if(n.length === 2) return `${n[0]} & ${n[1]}`;
  return n.slice(0, -1).join(', ') + ', & ' + n.at(-1);
}
function joinIEEE(list){
  const n = list.map(ieeeName);
  if(n.length === 1) return n[0];
  if(n.length === 2) return `${n[0]} and ${n[1]}`;
  if(n.length <= 6) return n.slice(0, -1).join(', ') + ', and ' + n.at(-1);
  return `${n[0]} et al.`;
}
function joinMLA(list){
  if(list.length === 1) return fullFirst(list[0]);
  if(list.length === 2) return `${fullFirst(list[0])}, and ${list[1].full}`;
  return `${fullFirst(list[0])}, et al.`;
}
function joinChicago(list){
  if(list.length === 1) return fullFirst(list[0]);
  if(list.length === 2) return `${fullFirst(list[0])}, and ${list[1].full}`;
  if(list.length <= 10) return fullFirst(list[0]) + ', ' + list.slice(1, -1).map(a => a.full).join(', ') + ', and ' + list.at(-1).full;
  return `${fullFirst(list[0])} et al.`;
}

// Markdown italics — these strings are meant to be pasted straight into a
// GitHub Discussion post, which renders _like this_ as italic.
const md = s => s ? `_${s}_` : '';
// BibTeX's own "--" page-range convention (e.g. pages = {45--67}) should
// typeset as an en dash in formatted citations — but not in the BibTeX
// output itself, where "--" is the correct, expected form.
const tidy = s => s.replace(/(\d)--(\d)/g, '$1–$2').replace(/[ \t]+/g, ' ').replace(/\s+([.,])/g, '$1').replace(/\.\.+$/, '.').trim();

function citeBibtex(e){
  const key = 'ref' + (e.year || '') + (e.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
  const lines = [
    `@${e.type || 'article'}{${key},`,
    e.author ? `  author  = {${e.author}},` : null,
    `  title   = {${e.title}},`,
    e.journal ? `  journal = {${e.journal}},` : null,
    e.year ? `  year    = {${e.year}},` : null,
    e.volume ? `  volume  = {${e.volume}},` : null,
    e.number ? `  number  = {${e.number}},` : null,
    e.pages ? `  pages   = {${e.pages}},` : null,
    e.doi ? `  doi     = {${e.doi}},` : (e.url ? `  url     = {${e.url}},` : null),
    `}`,
  ].filter(Boolean);
  return lines.join('\n');
}
function citeAPA(e){
  const authors = parseAuthorList(e.author);
  let out = authors.length ? joinAPA(authors) + ' ' : '';
  out += e.year ? `(${e.year}). ` : '';
  out += `${e.title}. `;
  if(e.journal){
    out += md(e.journal);
    if(e.volume) out += `, ${e.volume}${e.number ? `(${e.number})` : ''}`;
    if(e.pages) out += `, ${e.pages}`;
    out += '. ';
  }
  out += e.doi ? `https://doi.org/${e.doi}` : (e.url || '');
  return tidy(out);
}
function citeMLA(e){
  const authors = parseAuthorList(e.author);
  let out = authors.length ? joinMLA(authors) + '. ' : '';
  out += `"${e.title}." `;
  if(e.journal){
    out += md(e.journal);
    if(e.volume) out += `, vol. ${e.volume}`;
    if(e.number) out += `, no. ${e.number}`;
    out += ', ';
  }
  out += e.year || '';
  if(e.pages) out += `, pp. ${e.pages}`;
  out += e.doi ? `, doi:${e.doi}.` : (e.url ? `. Available: ${e.url}.` : '.');
  return tidy(out);
}
function citeIEEE(e){
  const authors = parseAuthorList(e.author);
  let out = authors.length ? joinIEEE(authors) + ', ' : '';
  out += `"${e.title}," `;
  if(e.journal){
    out += md(e.journal);
    if(e.volume) out += `, vol. ${e.volume}`;
    if(e.number) out += `, no. ${e.number}`;
    if(e.pages) out += `, pp. ${e.pages}`;
    out += ', ';
  }
  out += e.year || '';
  out += e.doi ? `, doi: ${e.doi}.` : (e.url ? `. [Online]. Available: ${e.url}` : '.');
  return tidy(out);
}
function citeChicago(e){
  const authors = parseAuthorList(e.author);
  let out = authors.length ? joinChicago(authors) + '. ' : '';
  out += e.year ? `${e.year}. ` : '';
  out += `"${e.title}." `;
  if(e.journal){
    out += md(e.journal);
    if(e.volume) out += ` ${e.volume}`;
    if(e.number) out += ` (${e.number})`;
    if(e.pages) out += `: ${e.pages}`;
    out += '. ';
  }
  out += e.doi ? `https://doi.org/${e.doi}` : (e.url || '');
  return tidy(out);
}

const CITE_BUILDERS = { bib: citeBibtex, apa: citeAPA, mla: citeMLA, ieee: citeIEEE, chicago: citeChicago };

// ---------- citation converter UI ----------
let lastEntry = null; // feeds the "insert into my template" button below

function initCiteConverter(){
  const input = document.getElementById('cite-input');
  const status = document.getElementById('cite-status');
  const tabs = document.getElementById('cite-style-tabs');
  const outBox = document.getElementById('cite-output-box');
  const out = document.getElementById('cite-output');
  const insertBtn = document.getElementById('cite-insert-template');
  if(!input) return;

  function render(style){
    if(!lastEntry) return;
    out.textContent = CITE_BUILDERS[style](lastEntry);
    tabs.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.style === style));
  }

  document.getElementById('cite-convert').addEventListener('click', () => {
    const text = input.value.trim();
    if(!text) return;
    status.textContent = isDoiLike(text) && !text.startsWith('@') ? 'Looking up…' : '';
    status.className = 'citation-status';
    resolveEntry(text).then(entry => {
      lastEntry = entry;
      status.textContent = `Parsed: ${entry.title}`;
      status.className = 'citation-status ok';
      tabs.hidden = false;
      outBox.hidden = false;
      if(insertBtn) insertBtn.hidden = false;
      render(tabs.querySelector('.chip.active')?.dataset.style || 'ieee');
    }).catch(err => {
      status.textContent = err.message;
      status.className = 'citation-status error';
    });
  });

  tabs.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => render(btn.dataset.style));
  });

  document.getElementById('cite-copy').addEventListener('click', (e) => copyText(out.textContent, e.currentTarget));

  if(insertBtn){
    insertBtn.addEventListener('click', () => {
      const ta = document.getElementById('discussion-template-text');
      if(ta && lastEntry){
        ta.value = ta.value.replace(/\[Paste your IEEE citation here.*?\]/s, citeIEEE(lastEntry));
      }
      ta?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}

// ---------- clipboard helper — reused by every "Copy" button on the page ----------
function copyText(text, btn){
  const done = () => {
    const original = btn.textContent;
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = original; }, 1600);
  };
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done){
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); done(); }catch(e){ /* clipboard genuinely unavailable — nothing more to try */ }
  document.body.removeChild(ta);
}

function initCopyButtons(){
  document.querySelectorAll('[data-copy-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.copyTarget);
      if(el) copyText(el.value !== undefined ? el.value : el.textContent, btn);
    });
  });
}

// ---------- AI-phrasing self-check ----------
// This is a *self-check heuristic*, not a detector — no tool can reliably
// prove text is or isn't AI-written, and claiming otherwise would be
// dishonest. What it CAN do: flag generic phrasing patterns that show up a
// lot in unedited AI output, and check whether the response actually
// contains the kind of specific, personal observation the assignment asks
// for (which a pure "summarize this paper" prompt tends not to produce).
const AI_TELLS = [
  'as an ai language model', 'delve into', 'delves into', 'delving into',
  "it's important to note that", 'it is important to note that',
  "it's worth noting that", 'it is worth noting that',
  "in today's fast-paced world", "in today's rapidly evolving",
  'navigate the complexities of', 'plays a crucial role', 'plays a pivotal role',
  'underscores the importance of', 'a testament to', 'in the realm of',
  'ever-evolving landscape', 'sheds light on', 'unlock the potential',
  'myriad of', 'a plethora of', 'at its core,', 'boasts a',
  'this paper aims to', 'this study aims to', 'this paper explores',
  'in conclusion,', 'in summary,', 'overall, this paper',
];
const INSIGHT_MARKERS = [
  "i didn't know", 'i did not know', 'surprised me', 'what surprised',
  "hadn't considered", 'had not considered', "hadn't realized", 'had not realized',
  'new to me', 'i wonder if', "i'm curious", 'im curious',
  'future work could', 'future research', 'a limitation', 'one limitation',
  'makes me want to', 'one open question', "i'd want to know", 'i would want to know',
];

function checkDraft(){
  const text = document.getElementById('ai-check-input').value;
  const lower = text.toLowerCase();
  const resultEl = document.getElementById('ai-check-result');
  if(!text.trim()){
    resultEl.innerHTML = '<p class="ai-check-line">Paste your draft response above first.</p>';
    return;
  }

  const tells = AI_TELLS.filter(p => lower.includes(p));
  const hasInsight = INSIGHT_MARKERS.some(p => lower.includes(p));
  const hasDisclosure = /ai[- ]assisted\s*:/i.test(text);
  const wordCount = (text.trim().match(/\S+/g) || []).length;

  const lines = [];
  lines.push(`<p class="ai-check-line ai-check-meta">${wordCount} words.</p>`);

  if(tells.length){
    lines.push(`<p class="ai-check-line ai-check-warn">⚠ Found ${tells.length} phrase${tells.length > 1 ? 's' : ''} that AI tools use a lot: ${tells.map(t => `<code>${t}</code>`).join(', ')}. This does not prove anything — but if AI wrote these words, try rewriting that part in your own voice.</p>`);
  } else {
    lines.push('<p class="ai-check-line ai-check-ok">✓ No common AI phrases found.</p>');
  }

  if(hasInsight){
    lines.push('<p class="ai-check-line ai-check-ok">✓ Found a personal observation, not just a summary. Good.</p>');
  } else {
    lines.push('<p class="ai-check-line ai-check-warn">⚠ This looks like mostly summary. Add something personal: one thing you didn\'t know, a weak point, or an idea for future research — in your own words.</p>');
  }

  if(wordCount < 60){
    lines.push('<p class="ai-check-line ai-check-warn">⚠ This is short for a weekly response. Add a full paragraph, not just 1–2 sentences.</p>');
  }

  lines.push(hasDisclosure
    ? '<p class="ai-check-line ai-check-ok">✓ Found an "AI-assisted:" line.</p>'
    : '<p class="ai-check-line ai-check-warn">⚠ No "AI-assisted:" line found. Every post needs one, even if the answer is "none."</p>');

  resultEl.innerHTML = lines.join('');
}

function initAiCheck(){
  const btn = document.getElementById('ai-check-btn');
  if(!btn) return;
  btn.addEventListener('click', checkDraft);
}

window.addEventListener('DOMContentLoaded', () => {
  initCiteConverter();
  initCopyButtons();
  initAiCheck();
});
