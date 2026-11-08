/**
 * Shared date + catalogue helpers for The Quiet Archive.
 *
 * Why this file exists: the audit found the homepage showing
 * "Failed Procurement Programs · 1999–2023" while /collections/ showed
 * "1962–2023" for the same collection. Both pages were formatting a
 * hand-written string. Nothing may be hand-written twice again: ranges,
 * counts and the "links verified" stamp are all computed from the catalogue.
 *
 * No dependencies, no build step. Import from .mjs, .ts or .astro alike.
 */

/* --------------------------------------------------------------- parsing */

/**
 * Parse a catalogue date. The schema allows:
 *   "2011"            -> { year, month: null, day: null }
 *   "2011-05"         -> { year, month: 5, day: null }
 *   "2011-05-18"      -> { year, month: 5, day: 18 }
 *   "1990/1991"       -> first year of the range
 *   "c. 1950"         -> c. 1950 treated as 1950
 *   null / "" / "unknown" -> null
 *
 * @param {unknown} value
 * @returns {{year:number, month:(number|null), day:(number|null), precision:'year'|'month'|'day'}|null}
 */
export function parseCatalogueDate(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate(), precision: 'day' };
  }
  const raw = String(value).trim();
  if (!raw || /^(unknown|n\/a|null)$/i.test(raw)) return null;

  // "1968-69" or "1968/1991": a span, take the earlier year.
  //
  // Ambiguity: "2011-05" is May 2011, not a span ending in 2005. A two-digit
  // tail is read as a year only when it cannot be a month (i.e. > 12); a
  // four-digit tail is always a year. "1968-12" therefore means December 1968,
  // which is the right call for this catalogue — spans here are written out in
  // full or with a year well past 12.
  const span = raw.match(/^(\d{4})\s*[-/]\s*(\d{2}|\d{4})$/);
  if (span) {
    const tail = Number(span[2]);
    const isMonth = span[2].length === 2 && tail >= 1 && tail <= 12;
    if (!isMonth) return { year: Number(span[1]), month: null, day: null, precision: 'year' };
  }

  const m = raw.match(/^(?:c\.?\s*|ca\.?\s*|circa\s*)?(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?/i);
  if (!m) return null;
  const year = Number(m[1]);
  if (!Number.isFinite(year) || year < 1000 || year > 2200) return null;
  const month = m[2] ? clamp(Number(m[2]), 1, 12) : null;
  const day = m[3] ? clamp(Number(m[3]), 1, 31) : null;
  return { year, month, day, precision: day ? 'day' : month ? 'month' : 'year' };
}

function clamp(n, lo, hi) {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

/** @param {unknown} value */
export function yearOf(value) {
  return parseCatalogueDate(value)?.year ?? null;
}

/* ------------------------------------------------------------ formatting */

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "18 May 2011" / "May 2011" / "2011" — as precise as the data allows. */
export function formatCatalogueDate(value, { short = false } = {}) {
  const d = parseCatalogueDate(value);
  if (!d) return null;
  const m = (short ? MONTHS_SHORT : MONTHS_LONG)[d.month - 1];
  if (d.precision === 'day') return `${d.day} ${m} ${d.year}`;
  if (d.precision === 'month') return `${m} ${d.year}`;
  return String(d.year);
}

/**
 * The stamp that appears in the masthead: "Links verified 16 October 2026".
 * Derived from a timestamp, never typed by hand.
 */
export function formatVerifiedStamp(iso) {
  const d = iso instanceof Date ? iso : new Date(String(iso));
  if (Number.isNaN(d.getTime())) return null;
  return `Links verified ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "6 days ago" / "yesterday" / "today" — for freshness badges. */
export function relativeDays(iso, now = new Date()) {
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.floor((startOfUtcDay(now) - startOfUtcDay(d)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.max(1, Math.round(days / 30));
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function startOfUtcDay(d) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/* ------------------------------------------------------------ date ranges */

/**
 * Compute a display range from a set of records.
 * Never returns "1999–2023" for a collection whose earliest record is 1962.
 *
 * @param {Array<{year?:number, documentDate?:string}>} records
 */
export function dateRange(records) {
  const years = records
    .map((r) => (typeof r?.year === 'number' && Number.isFinite(r.year) ? r.year : yearOf(r?.documentDate)))
    .filter((y) => y != null);
  if (!years.length) return { min: null, max: null, label: null, count: 0, minExact: false, maxExact: false };
  const min = Math.min(...years);
  const max = Math.max(...years);
  return {
    min,
    max,
    label: min === max ? String(min) : `${min}–${max}`,
    count: years.length,
    // A range whose tail is the current year is probably "present"; flag it so
    // the UI can say "c. 2026" rather than implying a hard end date.
    minExact: true,
    maxExact: max < new Date().getUTCFullYear(),
  };
}

/* -------------------------------------------------------------- stability */

/**
 * Dev builds must be reproducible: "document of the day" and "random" both
 * derive from a stable key rather than Math.random(), so a rebuild of the same
 * dataset produces byte-identical HTML (good for diffing, caching and CI).
 *
 * @param {string} seed
 * @param {number} length
 * @param {Date} now
 */
export function seedForDay(seed, now = new Date()) {
  return `${seed}:${now.toISOString().slice(0, 10)}`;
}

/** Deterministic 32-bit hash (FNV-1a). */
export function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pick an element deterministically. */
export function pickDeterministic(list, seed) {
  if (!list.length) return null;
  return list[hash32(seed) % list.length];
}

/**
 * Median "years the public waited" for one record. Returns null when either
 * date is missing rather than silently substituting 0.
 */
export function withheldYears(doc) {
  const written = parseCatalogueDate(doc?.documentDate);
  const released = parseCatalogueDate(doc?.releaseDate);
  if (!written || !released) return null;
  const years = released.year - written.year;
  return years >= 0 ? years : null;
}
