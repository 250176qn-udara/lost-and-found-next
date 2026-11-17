// How sure the matcher is that a lost report and a found item are the same thing (src/lib/match.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreClass, scoreMatch } from '../src/lib/match';

test('same place and same day scores highest', () => {
  const r = scoreMatch({ place: 'Bldg A · Library', date: '2026-11-10', category: 'Wallet' }, { place: 'Bldg A · Library', date: '2026-11-10', category: 'Wallet' });
  assert.equal(r.score, 95);
  assert.deepEqual(r.why, ['Same category', 'Same place', 'Same day']);
  assert.equal(r.ai, false);
  assert.equal(scoreClass(r.score), '');
});

test('place names are compared without case', () => {
  assert.ok(scoreMatch({ place: 'bldg a · library', date: null }, { place: 'Bldg A · Library', date: null }).why.includes('Same place'));
});

test('dates within 2 days add a little, further apart add nothing', () => {
  assert.equal(scoreMatch({ place: null, date: '2026-11-10' }, { place: null, date: '2026-11-12' }).score, 60);
  assert.equal(scoreMatch({ place: null, date: '2026-11-10' }, { place: null, date: '2026-11-20' }).score, 50);
});

test('pins close together count as "found nearby"', () => {
  const r = scoreMatch({ place: 'Not sure', date: null, lat: 35.4638, lng: 139.5130 }, { place: 'Not sure', date: null, lat: 35.4642, lng: 139.5132 });
  assert.ok(r.why.includes('Found nearby'));
  assert.equal(r.score, 70);
});

test('an AI score replaces the rule score but the reasons stay', () => {
  const r = scoreMatch({ place: 'Bldg A · Library', date: '2026-11-10' }, { place: 'Bldg A · Library', date: '2026-11-10' }, 42);
  assert.equal(r.score, 42);
  assert.equal(r.ai, true);
  assert.ok(r.why.includes('Checked by AI') && r.why.includes('Same place'));
});

test('score classes', () => {
  assert.equal(scoreClass(80), '');
  assert.equal(scoreClass(60), 'mid');
  assert.equal(scoreClass(59), 'low');
});
