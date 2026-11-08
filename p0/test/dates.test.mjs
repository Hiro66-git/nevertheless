import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCatalogueDate,
  formatCatalogueDate,
  formatVerifiedStamp,
  dateRange,
  withheldYears,
  pickDeterministic,
  hash32,
} from '../site/lib/dates.mjs';

test('parses every precision the schema allows', () => {
  assert.deepEqual(parseCatalogueDate('2011'), { year: 2011, month: null, day: null, precision: 'year' });
  assert.deepEqual(parseCatalogueDate('2011-05'), { year: 2011, month: 5, day: null, precision: 'month' });
  assert.deepEqual(parseCatalogueDate('2011-05-18'), { year: 2011, month: 5, day: 18, precision: 'day' });
});

test('takes the earlier year of a span instead of failing', () => {
  assert.equal(parseCatalogueDate('1968-69')?.year, 1968);
  assert.equal(parseCatalogueDate('1990/1991')?.year, 1990);
  // A two-digit tail small enough to be a month is a month, not a year span.
  assert.deepEqual(parseCatalogueDate('2011-05'), { year: 2011, month: 5, day: null, precision: 'month' });
  assert.equal(parseCatalogueDate('1968-12')?.month, 12, '"1968-12" must mean December 1968');
});

test('tolerates approximate markers in the data', () => {
  assert.equal(parseCatalogueDate('c. 1950')?.year, 1950);
  assert.equal(parseCatalogueDate('circa 1950')?.year, 1950);
});

test('returns null rather than inventing a date', () => {
  for (const v of [null, undefined, '', 'unknown', 'n/a', 'sometime in the war', '0000']) {
    assert.equal(parseCatalogueDate(v), null, `expected null for ${JSON.stringify(v)}`);
  }
});

test('formats with only the precision present', () => {
  assert.equal(formatCatalogueDate('2011-05-18'), '18 May 2011');
  assert.equal(formatCatalogueDate('2011-05'), 'May 2011');
  assert.equal(formatCatalogueDate('2011'), '2011');
  assert.equal(formatCatalogueDate('2011-05-18', { short: true }), '18 May 2011');
  assert.equal(formatCatalogueDate(null), null);
});

test('verified stamp is derived, and matches the wording the site uses', () => {
  assert.equal(formatVerifiedStamp('2026-10-16T09:14:00.000Z'), 'Links verified 16 October 2026');
  assert.equal(formatVerifiedStamp('2026-10-15T10:00:00.000Z'), 'Links verified 15 October 2026');
  assert.equal(formatVerifiedStamp('not a date'), null);
});

test('dateRange reproduces the Failed Procurement Programs bug and fixes it', () => {
  // The live homepage said 1999–2023; the catalogue's earliest member is 1962.
  const records = [{ year: 1962 }, { year: 1990 }, { year: 1999 }, { year: 2011 }];
  assert.equal(dateRange(records).label, '1962–2011');
  // And a same-year collection must not render as "1995–1995".
  assert.equal(dateRange([{ year: 1995 }]).label, '1995');
  assert.equal(dateRange([]).label, null);
});

test('dateRange reads documentDate when the year field is absent', () => {
  assert.equal(dateRange([{ documentDate: '1947-07' }, { year: 2025 }]).label, '1947–2025');
});

test('withheldYears refuses to fabricate a gap', () => {
  assert.equal(withheldYears({ documentDate: '1963', releaseDate: '2026' }), 63);
  assert.equal(withheldYears({ documentDate: '1963' }), null);
  // A release date before the document date is bad data, not a negative wait.
  assert.equal(withheldYears({ documentDate: '2001', releaseDate: '1990' }), null);
});

test('deterministic picker is stable and in range', () => {
  const list = ['a', 'b', 'c', 'd', 'e'];
  const first = pickDeterministic(list, 'doc-of-the-day:2026-11-08');
  const second = pickDeterministic(list, 'doc-of-the-day:2026-11-08');
  assert.equal(first, second);
  assert.ok(list.includes(first));
  // And it actually varies across days, otherwise every build picks the same record.
  const spread = new Set(
    Array.from({ length: 30 }, (_, i) => pickDeterministic(list, `doc-of-the-day:2026-11-${i + 1}`)),
  );
  assert.ok(spread.size > 1, 'deterministic picker should vary by seed');
  assert.equal(pickDeterministic([], 'x'), null);
  assert.equal(hash32(''), 0x811c9dc5);
});
