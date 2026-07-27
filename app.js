// THE SSC SCHOLARS OFFICIAL — shared engine utilities

/* ---------------------------------------------------------
   TEXT — the source data double-HTML-escapes rich text
   (question / options / solution_text) e.g. "&lt;strong&gt;"
   instead of "<strong>". decodeRich() unescapes it once so
   the real tags render properly when inserted via innerHTML.
---------------------------------------------------------- */
const TextFmt = (() => {
  const scratch = document.createElement('textarea');

  function decodeRich(raw) {
    if (!raw) return '';
    scratch.innerHTML = raw;
    return scratch.value;
  }

  // Plain option/question text may or may not contain escaped tags.
  function renderRich(raw) {
    return decodeRich(raw || '');
  }

  return { decodeRich, renderRich };
})();

/* ---------------------------------------------------------
   STORAGE — attempts saved per subject/chapter/part so a
   learner can resume or review later. Also tracks simple
   per-chapter completion counts for progress bars.
---------------------------------------------------------- */
const Store = (() => {
  const KEY = 'sscscholars_attempts_v1';

  function all() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveAll(obj) {
    localStorage.setItem(KEY, JSON.stringify(obj));
  }
  function attemptId(subjectSlug, chapterSlug, partNo) {
    return `${subjectSlug}::${chapterSlug}::part${partNo}`;
  }
  function get(subjectSlug, chapterSlug, partNo) {
    return all()[attemptId(subjectSlug, chapterSlug, partNo)] || null;
  }
  function save(subjectSlug, chapterSlug, partNo, attempt) {
    const a = all();
    a[attemptId(subjectSlug, chapterSlug, partNo)] = attempt;
    saveAll(a);
  }
  function remove(subjectSlug, chapterSlug, partNo) {
    const a = all();
    delete a[attemptId(subjectSlug, chapterSlug, partNo)];
    saveAll(a);
  }
  function chapterStats(subjectSlug, chapterSlug, totalParts) {
    const a = all();
    let completed = 0, inProgress = 0;
    for (let i = 1; i <= totalParts; i++) {
      const at = a[attemptId(subjectSlug, chapterSlug, i)];
      if (at && at.status === 'completed') completed++;
      else if (at && at.status === 'in-progress') inProgress++;
    }
    return { completed, inProgress };
  }
  function resetAll() {
    localStorage.removeItem(KEY);
  }
  return { get, save, remove, chapterStats, resetAll, attemptId };
})();

/* ---------------------------------------------------------
   DATA — small helpers around the lazy-loaded JSON files.
---------------------------------------------------------- */
const DataApi = (() => {
  let indexCache = null;
  const subjectCache = {};

  async function getIndex() {
    if (indexCache) return indexCache;
    const res = await fetch('data-index.json');
    indexCache = await res.json();
    return indexCache;
  }

  // Loads the whole subject file (e.g. math.json) once, caches it,
  // then returns just the requested chapter's parts (with questions).
  async function getChapter(subjectSlug, chapterSlug) {
    let subj = subjectCache[subjectSlug];
    if (!subj) {
      const res = await fetch(`${subjectSlug}.json`);
      subj = await res.json();
      subjectCache[subjectSlug] = subj;
    }
    const ch = subj.chapters.find(c => c.slug === chapterSlug);
    if (!ch) return null;
    return { subject: subj.name, chapter: ch.name, slug: ch.slug, parts: ch.parts };
  }

  return { getIndex, getChapter };
})();

function fmtTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60), s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
