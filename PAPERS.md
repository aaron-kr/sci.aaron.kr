# PAPERS.md — notes for Aaron's two in-progress papers

Written by Claude, at Aaron's request, after a multi-session build of
Scientia AI (sci.aaron.kr). Meant to be pasted into a separate brainstorming
conversation, not committed as project documentation — it's research
material, not build notes (see `CLAUDE.md` for that). Everything below is
either (a) direct self-report, hedged where I'm genuinely uncertain about my
own causes, or (b) grounded in this repo's actual git history and code,
citable and independently checkable rather than asserted.

---

## 1. For the AI-CSS-fingerprint paper

### The pattern, as it actually appears in this repo

A representative line from `assets/css/main.css`, written by me this
session, unedited:

```css
.bookmark-btn{background:none; border:none; cursor:pointer; padding:0; line-height:0; color:var(--ink-faint); flex-shrink:0; transition:color .15s, transform .1s;}
```

Consistent, checkable features across the whole file (not cherry-picked —
this is close to every rule in it):
- One selector, one line, regardless of how many declarations it holds.
- No space after `{`, no space before `}`, no newline between declarations.
- No space between a property's colon and its value (`color:var(...)`, not
  `color: var(...)`).
- A single space after each `;` separating declarations — the *only*
  whitespace concession in the whole rule.
- No blank lines between related rules; grouped only by comments when the
  boundary is conceptual, not mechanical.

This is close to what a **minifier** produces, not what a human-authored
stylesheet or a formatter like Prettier/Stylelint would produce by default
(both insert a newline per declaration and a space after each colon as
their standard style). It's also not quite BEM/SMACSS convention, which
tends toward one-line-per-declaration even in compact codebases. If this
project's CSS were to be run through Prettier, the diff would touch nearly
every line without changing behavior at all — that might be a fast,
mechanical way to *quantify* "how far from human-default formatting" a file
is, if that's useful as a metric: percentage of lines Prettier would rewrite
on a clean, un-vandalized file.

### Why I write it this way — honest answer, hedged appropriately

I don't have reliable introspective access to *why* I generate text a
particular way — I can describe the pattern accurately (it's externally
checkable) but I should be upfront that any causal explanation is a
plausible reconstruction, not a verified fact about my own training. With
that caveat, the explanations I'd actually put weight behind, roughly in
order:

1. **An implicit economy bias that generalizes past where it was intended.**
   I have real, explicit instructions in this environment toward terseness
   in prose and comments ("default to no comments," "keep responses short").
   It's plausible that bias generalizes into whitespace decisions too, even
   though nothing tells me to compact *CSS* specifically — compact output
   "looks" efficient the same way a terse sentence does, even where the
   efficiency doesn't actually matter (whitespace in a CSS file costs
   nothing at runtime once served over gzip).
2. **Selector-first scanning over declaration-first scanning.** For a file
   with mostly small, single-purpose, largely-independent rules (icon
   buttons, badges, flags — which is most of what this project's CSS is),
   collapsing each rule to one line makes the file scannable by *selector*
   (skim down the left edge, find `.heart-btn`) rather than by *property*
   (multi-line style rewards skimming for "which rules touch `color`").
   That's a real, defensible tradeoff for this kind of file — but I didn't
   consciously choose it for that reason in the moment; it's more likely
   the reasoning I'd give if asked to justify it after the fact than the
   actual generative cause.
3. **No formatting pass separate from generation.** Human-authored CSS
   usually passes through a formatter at some point (editor-on-save,
   pre-commit hook, CI). I don't have an equivalent separate pass — what I
   type is what ships — so whatever default I fall back to under time/token
   pressure is what persists, uncorrected, into the final file. This is
   maybe the most falsifiable of the three: if true, you'd predict the
   *first* draft of a human's CSS (before their formatter touches it) looks
   more similar to mine than their *committed* CSS does. Worth checking
   against real "before formatter" human CSS if you can find any (pre-commit
   hook logs, or just asking students to paste their draft before they save).

I'd flag stylelint/Prettier-diff-percentage as the most useful *fingerprint
metric* here over anything qualitative — "no space after colon" is trivially
gameable by a prompt instruction, but the more interesting signal is
probably higher up the stack: whether related rules get grouped with
comments the way a human organizing a growing stylesheet would (mine mostly
does, when I remember to), and whether vendor-prefix/fallback patterns
appear at all (mine essentially never do, which is itself a tell — I don't
worry about older-browser compat unless asked, in a way a human maintaining
a stylesheet across years usually accumulates some of even by accident).

---

## 2. For the human-in-the-loop audit-workflow paper

You asked what audits should run after a build is "complete." Below is a
proposed pass structure, but the more useful thing I can offer is that
**this exact repo's session history is full of real, already-shipped bugs**
that map cleanly onto specific passes — meaning you don't need hypothetical
examples, you have a working case study with a git history to point at.

### Proposed passes (each answers one narrow, mechanically-checkable question)

1. **Build/compile audit** — does it build clean, zero warnings? Cheapest
   pass, should run on every commit (this project's `jekyll build` is
   already effectively this). Catches syntax-level problems only.
2. **Static/lint audit** — language-appropriate linters. A *different*
   failure class than #1: code can build and still be non-idiomatic, unsafe,
   or violate a project's own conventions.
3. **Behavioral/output audit** — actually run the thing against real data
   and inspect the real output, not just "did it not throw." This is the
   pass that would have caught the most damaging bugs in this project (see
   below) — build success told us nothing about whether they existed.
4. **Secrets/security audit** — grep the diff and the full repo for
   credential-shaped strings; for anything client-exposed, explicitly ask
   "is this genuinely meant to be public" (Firebase's own docs distinguish
   this — API keys, yes; a personal email, no); for anything gated by auth,
   confirm the check is enforced *server-side* (database rules / a Cloud
   Function), not only in client JS that a user could just skip.
5. **Data-model / key-collision audit** — for any new persisted entity
   (a new DB collection, a new doc-ID scheme, a new filename pattern), ask
   explicitly: "could two conceptually different things collide on the same
   key?" Cheap to ask before writing the code; expensive to discover after,
   once real data exists under the wrong assumption.
6. **Infra/deploy audit** — does the actual deployed environment match what
   the code assumes (which GitHub Pages mode, which secrets actually exist
   in the environment vs. only in a `.example` file, which workflow trigger
   is actually configured)?
7. **Churn audit** — how much of a session's diff is *rework* of code from
   the same or a recent session, vs. genuinely new work? This is close to
   your own git-commit-churn methodology already, so I'd treat it as the
   thing your existing audit process measures, with the passes above as
   what predicts *why* churn happens (skipping #3 and #5 in particular is,
   in this repo, exactly what produced rework).

### This repo's actual bugs, mapped to the pass that would have caught them

- **`translate_papago.py` double-escaped a title containing a quote mark**,
  producing invalid YAML that broke that entry's build — but only for that
  one file; the *overall* Jekyll build kept succeeding for every other page,
  so this shipped and sat live until a later session's unrelated build
  incidentally surfaced the warning. Pass #1 caught it eventually, by
  accident, not by design — it should have been caught by pass #3
  (rendering that one entry and inspecting it) far sooner.
- **`send_digest.py` walked only each collection's top-level directory**
  (`os.listdir`, not recursive) after entries moved into year/month
  subfolders in an earlier session — meaning the weekly digest silently
  found zero entries, every week, with no error at all. Passes #1 and #2
  are both powerless here: the script is syntactically fine and does exactly
  what it's written to do: it's *correct code implementing a now-wrong
  assumption*. Only pass #3 — literally running it and checking the output
  has `>0` items — would have caught this, and it went unnoticed for
  multiple sessions.
- **The permalink page's "no write-up yet" placeholder never rendered**, on
  any of ~60 pages, because the truthiness check (`page.content and
  page.content.size > 0`) passed on whitespace-only content that Markdown
  then rendered to nothing — visually blank, not visibly broken, not an
  error. Same story: only caught by actually opening a rendered page and
  looking, not by anything mechanical.
- **A Firestore document-ID collision**, caught *before* shipping this time:
  a doc ID keyed only on a URL hash was fine when "hearted" (research) and
  "bookmarked" (news) never shared a URL space, but the moment research
  entries got a *second* independent flag on the same URL ("marked for
  class"), both would silently overwrite the same document. This is
  squarely pass #5's job — and notably, it *was* asked explicitly in that
  session ("could two kinds collide on the same key?") specifically because
  a new kind was about to be added to an existing scheme, not because
  something had already broken.
- **A hardcoded email committed to git** on a related project (the
  attendance app this one's auth setup deliberately mirrors) — pass #4,
  and the one most likely to actually matter if it recurs, since it's the
  only item on this list with a real external-party consequence.

### A pattern worth naming: silent-vs-loud bugs

Every bug on that list except the last one has the same shape: **the code
ran without error and did something plausible-looking but wrong.** None of
them crashed, none of them printed an error, none of them would show up in
a stack trace. That's arguably the central finding available from this
repo's history: AI-generated code in this project reliably *ran* — it did
not reliably do the *intended* thing, and the gap between those two was
invisible to every check except "a human actually looked at the real
output." If that generalizes (worth testing against your other repos'
churn data), the practical implication for a human-in-the-loop workflow is
blunt: **the highest-value review action isn't re-reading the diff, it's
exercising the code against real inputs and inspecting real outputs** —
which is a different skill and a different amount of time than a code
review, and probably under-weighted in how "review the AI's work" gets
talked about generally.

### A positive counter-finding, for balance

Not every finding here is a failure mode. Once the "public read, owner-only
write, verify server-side, never trust a client-side check alone" pattern
was established in one place (Firestore rules), it was then applied
*consistently* without being re-specified, across every subsequent piece
that needed it: a second Firestore collection added a session later, and a
Cloud Function that — notably — re-checks the caller's identity server-side
even though the platform had already verified *a* valid identity, on the
reasoning that "authenticated" isn't the same claim as "authorized." That's
a genuine positive signal about pattern propagation once a security
invariant is made explicit early, worth weighing against the bug list above
rather than only cataloguing failures.

---

## 3. Possibly its own thing, or a footnote in either paper

The overall shape of this build — a fully static site (GitHub Pages, no
server) with a thin, auth-gated dynamic layer bolted on for exactly the
parts that need write-access and cross-device state (Firebase Auth +
Firestore + one Cloud Function, nothing else) — came up because a real
constraint forced it (no backend, but genuine need for auth). I don't know
how novel this is as a documented pattern versus just "how JAMstack sites
add auth," but if it's useful: the actual decision rule that emerged was
**"can this be public data with owner-only writes? If yes, Firestore rules
alone are enough. If no (an API key that grants real external write access,
like Zotero's), it needs a server-side boundary regardless."** That
if/then was applied consistently enough this session that it reads more
like a repeatable principle than an ad hoc call each time — possibly useful
as a small worked example if either paper wants one concrete "how do you
decide where the trust boundary goes" illustration.
