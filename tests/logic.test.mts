// Small pieces of app logic: claim answers, places, the item journey and translations.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { packAnswers, unpackAnswers } from '../src/lib/claims';
import { buildingOf, floorRank, parsePlace } from '../src/lib/places';
import { finderJourney, keepUntil, ownerJourney } from '../src/lib/journey';
import { translate } from '../src/lib/i18n';

test('claim answers survive being stored and read back', () => {
  const a = { details: 'Black leather, a cat sticker\ninside: a library card', place: 'Bldg A · Library', date: '2026-11-10' };
  assert.deepEqual(unpackAnswers(packAnswers(a)), a);
  // claims made before place and date were asked
  assert.deepEqual(unpackAnswers('just details'), { details: 'just details', place: '', date: '' });
});

test('places: building and floor', () => {
  assert.deepEqual(parsePlace('Bldg A · Lab 2F', 'Bldg A · Lab 2F'), { building: 'A', floor: '2F', label: 'Lab' });
  assert.equal(parsePlace('3号館・地下1階', '3号館・地下1階').floor, 'B1F');
  assert.equal(buildingOf('Bldg B · Learning commons B1F'), 'B');
  assert.equal(buildingOf('Station'), 'Other');
  assert.ok(floorRank('3F') > floorRank('1F') && floorRank('1F') > floorRank('B1F'));
});

test('owner journey: next step follows the claim', () => {
  assert.equal(ownerJourney({ matched: false, claim: null, atOffice: false, thanked: false }).next.who, 'system');
  assert.equal(ownerJourney({ matched: true, claim: 'pending', atOffice: true, thanked: false }).next.who, 'staff');
  const ready = ownerJourney({ matched: true, claim: 'approved', atOffice: true, thanked: false });
  assert.equal(ready.next.href, '/my-items?tab=claims');
  const back = ownerJourney({ matched: true, claim: 'returned', claimId: 7, atOffice: true, thanked: false });
  assert.equal(back.next.href, '/thanks/7');
  assert.deepEqual(back.done, [true, true, true, true, true, true, false]);
});

test('finder journey: a claimed item still with the finder must go to the office', () => {
  assert.equal(finderJourney({ claim: 'pending', handedIn: false, atOffice: false, returned: false, thanked: false }).next.text,
    'Someone claimed it. Please bring it to the office.');
  assert.equal(finderJourney({ claim: null, handedIn: false, atOffice: false, returned: false, thanked: false, due: { date: 'x', overdue: true } }).next.who, 'you');
});

test('keepUntil adds the keep days and spots overdue items', () => {
  assert.equal(keepUntil('2026-11-01 10:30:00', 5)?.date, '2026-11-06 10:30');
  assert.equal(keepUntil('2000-01-01 00:00:00', 5)?.overdue, true);
  assert.equal(keepUntil(null, 5), null);
});

test('translate: Japanese text, placeholders, English fallback', () => {
  assert.equal(translate('ja', 'Notifications'), '通知');
  assert.equal(translate('en', 'Hello {name}', { name: 'Aiko' }), 'Hello Aiko');
  assert.equal(translate('ja', 'A sentence nobody translated'), 'A sentence nobody translated');
});

test('item list next step: staff turn first, and where to do it', async () => {
  const { staffNextShort } = await import('../src/lib/journey');
  const base = { id: 7, kind: 'found' as const, status: 2, daysKept: null, handedIn: false, openClaim: null, matchedItemId: null };
  assert.deepEqual(staffNextShort({ ...base, handedIn: true }), { text: 'Confirm it is at the office', you: true, href: '/items/7#case' });
  assert.equal(staffNextShort({ ...base, openClaim: 'pending' }).you, true);
  assert.equal(staffNextShort({ ...base, openClaim: 'approved' }).text, 'Waiting for the finder');
  assert.equal(staffNextShort({ ...base, openClaim: 'approved', daysKept: 1 }).text, 'Hand it over when the owner comes');
  assert.equal(staffNextShort({ ...base, status: 5 }).text, 'Returned');
  // a lost report: the work is on the found item it is linked to
  assert.equal(staffNextShort({ ...base, kind: 'lost', openClaim: 'pending', matchedItemId: 9 }).href, '/items/9#case');
});
