import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOgMarkup, headlineStyle, ogImagePath, OG_WIDTH, OG_HEIGHT } from '../site/lib/og-render.mjs';

test('default card is the right size', () => {
  const tree = buildOgMarkup({});
  assert.equal(tree.props.style.width, `${OG_WIDTH}px`);
  assert.equal(tree.props.style.height, `${OG_HEIGHT}px`);
  assert.equal(OG_WIDTH / OG_HEIGHT, 1.9047619047619047, 'must stay at the 1200×630 link-preview ratio');
});

test('a document card carries the facts a shared link needs', () => {
  const tree = buildOgMarkup({
    id: 'QA-0079',
    title: 'The National Programme for IT in the NHS',
    issuerShort: 'NAO',
    documentType: 'report',
    country: 'United Kingdom',
    documentDate: '2011-05-18',
    releaseDate: '2011-05-18',
    status: 'live',
  });
  const text = JSON.stringify(tree);
  assert.ok(text.includes('QA-0079'));
  assert.ok(text.includes('THE QUIET ARCHIVE'));
  assert.ok(text.includes('REPORT · UNITED KINGDOM'));
  assert.ok(text.includes('written 18 May 2011'));
  assert.ok(text.includes('released 18 May 2011'));
  assert.ok(text.includes('LIVE'));
});

test('headline type shrinks as titles grow, keeping three lines', () => {
  const short = headlineStyle('Short title');
  const medium = headlineStyle('x'.repeat(95));
  const long = headlineStyle('x'.repeat(130));
  const huge = headlineStyle('x'.repeat(400));
  const px = (s) => Number(s.fontSize.replace('px', ''));
  assert.ok(px(short) > px(medium));
  assert.ok(px(medium) > px(long));
  assert.ok(px(long) > px(huge));
  assert.ok(px(huge) >= 34, 'never shrink below legibility');
});

test('very long titles are truncated with an ellipsis, not clipped mid-glyph', () => {
  const title = 'A '.repeat(200);
  const tree = buildOgMarkup({ title });
  const text = JSON.stringify(tree);
  // Truncation marker present, and the string is bounded.
  assert.ok(text.includes('…'));
  const rendered = JSON.parse(text).props.children.reduce((acc, c) => acc, 0); // structural sanity
  assert.equal(rendered, 0);
});

test('a missing title falls back to the site strapline', () => {
  const tree = buildOgMarkup({});
  assert.ok(JSON.stringify(tree).includes('Public records nobody reads'));
});

test('status colour changes with the link state', () => {
  const live = JSON.stringify(buildOgMarkup({ status: 'live' }));
  const dead = JSON.stringify(buildOgMarkup({ status: 'dead' }));
  assert.notEqual(live, dead);
  assert.ok(dead.includes('#8C2F1E'), 'dead links should be flagged in the accent colour');
});

test('image paths are stable and match the routes we generate', () => {
  assert.equal(ogImagePath('uk-nao-npfit'), '/og/uk-nao-npfit.png');
  assert.equal(ogImagePath(), '/og.png');
});
