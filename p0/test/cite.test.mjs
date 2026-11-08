import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toBibtex,
  toRis,
  toCslJson,
  toPlainCitation,
  toBibtexLibrary,
  citationKey,
  bibtexEscape,
} from '../site/lib/cite.mjs';

const DOC = {
  id: 'QA-0079',
  slug: 'uk-nao-npfit',
  title: 'The National Programme for IT in the NHS: an update (NAO, 2011)',
  author: 'National Audit Office',
  issuer: 'nao',
  issuerShort: 'NAO',
  issuerLong: 'National Audit Office (UK)',
  documentType: 'report',
  documentDate: '2011-05-18',
  releaseDate: '2011-05-18',
  country: 'United Kingdom',
  sourceUrl: 'https://www.nao.org.uk/reports/npfit/',
  archive: 'https://web.archive.org/web/20260902115750/https://www.nao.org.uk/reports/npfit/',
  summary: 'The UK auditor’s verdict on the core of the NHS National Programme for IT.',
  tags: ['NHS', 'IT procurement'],
};

test('BibTeX has balanced braces and the fields Zotero expects', () => {
  const bib = toBibtex(DOC, { urldate: '2026-10-15' });
  const open = (bib.match(/{/g) || []).length;
  const close = (bib.match(/}/g) || []).length;
  assert.equal(open, close, 'unbalanced braces would break the whole .bib file');
  assert.match(bib, /^@misc\{nao2011naonpfit,/);
  assert.match(bib, /author\s+= \{National Audit Office\}/);
  assert.match(bib, /url\s+= \{https:\/\/quiet-archive-19i\.pages\.dev\/doc\/uk-nao-npfit\/\}/);
  assert.match(bib, /urldate\s+= \{2026-10-15\}/);
  assert.match(bib, /howpublished\s+= \{\\url\{https:\/\/www\.nao\.org\.uk\/reports\/npfit\/\}\}/);
});

test('BibTeX output is reproducible for the same data', () => {
  assert.equal(toBibtex(DOC, { urldate: '2026-10-15' }), toBibtex(DOC, { urldate: '2026-10-15' }));
});

test('BibTeX escapes the characters that would otherwise corrupt a field', () => {
  assert.equal(bibtexEscape('100% & $5 #1 _x_ {y}'), '100\\% \\& \\$5 \\#1 \\_x\\_ \\{y\\}');
  const bib = toBibtex({ ...DOC, title: 'Waste & mismanagement: 60% of $8bn' }, { urldate: '2026-10-15' });
  assert.match(bib, /Waste \\& mismanagement: 60\\% of \\\$8bn/);
});

test('a record with no dates still produces a valid entry', () => {
  const bib = toBibtex({ ...DOC, documentDate: null, releaseDate: null }, { urldate: '2026-10-15' });
  assert.match(bib, /year\s+= \{n\.d\.\}/);
  const open = (bib.match(/{/g) || []).length;
  const close = (bib.match(/}/g) || []).length;
  assert.equal(open, close);
});

test('RIS has the required TY/ER pair and one AU line', () => {
  const ris = toRis(DOC).split('\n');
  assert.equal(ris[0], 'TY  - GEN');
  assert.ok(ris.includes('ER  - '));
  assert.equal(ris.filter((l) => l.startsWith('AU  - ')).length, 1);
  assert.ok(ris.some((l) => l === 'DA  - 2011-05-18'));
  assert.ok(ris.some((l) => l === 'UR  - https://www.nao.org.uk/reports/npfit/'));
  assert.ok(ris.some((l) => l.startsWith('KW  - NHS')));
});

test('RIS description is flattened to one line', () => {
  const ris = toRis({ ...DOC, summary: 'line one\nline two' });
  assert.match(ris, /^AB {2}- line one line two$/m);
});

test('CSL-JSON is consumable by Pandoc and Zotero', () => {
  const csl = toCslJson(DOC);
  assert.equal(csl.type, 'report');
  assert.deepEqual(csl.issued, { 'date-parts': [[2011, 5, 18]] });
  assert.deepEqual(csl.author, [{ literal: 'National Audit Office' }]);
  assert.equal(csl.URL, DOC.sourceUrl);
  // Undefined fields must be absent, not null, or citeproc prints garbage.
  for (const [k, v] of Object.entries(csl)) {
    assert.notEqual(v, null, `${k} should be omitted rather than null`);
  }
});

test('plain citation no longer leaves the catalogue URL implicit', () => {
  const text = toPlainCitation(DOC, { accessed: new Date('2026-11-08T00:00:00Z') });
  assert.match(text, /National Audit Office\./);
  assert.match(text, /Released 18 May 2011/);
  assert.match(text, /https:\/\/quiet-archive-19i\.pages\.dev\/doc\/uk-nao-npfit\//);
  assert.match(text, /accessed 8 November 2026/);
});

test('citation keys are unique across a realistic catalogue slice', () => {
  const docs = [
    DOC,
    { ...DOC, id: 'QA-0080', slug: 'uk-nao-npfit-followup' },
    { ...DOC, id: 'QA-0081', slug: 'uk-nao-npfit-followup', documentDate: '2012' },
    { ...DOC, id: 'QA-0082', issuerShort: undefined, host: 'CIA FOIA', slug: 'cia-family-jewels', documentDate: '1973' },
  ];
  const keys = docs.map((d) => citationKey(d));
  assert.equal(keys[0], 'nao2011naonpfit');
  // Two records sharing issuer+year+slug stem must be disambiguated in the library.
  const lib = toBibtexLibrary(docs, { urldate: '2026-10-15', generatedAt: 'fixed' });
  const entryKeys = [...lib.matchAll(/^@misc\{([^,]+),/gm)].map((m) => m[1]);
  assert.equal(new Set(entryKeys).size, entryKeys.length, 'duplicate BibTeX keys break LaTeX');
  assert.equal(entryKeys.length, docs.length);
});
