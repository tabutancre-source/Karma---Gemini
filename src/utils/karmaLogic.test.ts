import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSplit,
  calculateKarmaForWheelPayer,
  calculateKarmaForForgiveness,
  getKarmaStatus,
  generateDryNotification,
} from './karmaLogic';

test('calculateSplit splits 30 euros among 3 people cleanly', () => {
  const result = calculateSplit(30, 3);
  assert.equal(result.perPerson, 10);
  assert.equal(result.amounts.length, 3);
  const sum = result.amounts.reduce((a, b) => a + b, 0);
  assert.equal(sum, 30);
});

test('calculateKarmaForWheelPayer applies multiplier correctly', () => {
  const karma = calculateKarmaForWheelPayer(60, 4);
  assert.equal(karma, 540);
});

test('getKarmaStatus grants Immunity with zero blur', () => {
  const immuneStatus = getKarmaStatus(150, { hasImmunity: true });
  assert.equal(immuneStatus.tier, 'immune');
  assert.equal(immuneStatus.isBlurred, false);
  assert.match(immuneStatus.title, /Immunità/i);
});

test('getKarmaStatus enforces blur guardrails (>10€ and >14 days)', () => {
  // Low karma (120), but small debt (4€) or fresh debt (5 days) -> NOT blurred!
  const safeStatus = getKarmaStatus(120, { unpaidDebt: 4.0, oldestDebtDays: 5 });
  assert.equal(safeStatus.isBlurred, false);

  // Low karma (120), high debt (>10€) AND old (>14 days) -> IS blurred!
  const blurredStatus = getKarmaStatus(120, { unpaidDebt: 15.0, oldestDebtDays: 20 });
  assert.equal(blurredStatus.isBlurred, true);
});

test('generateDryNotification supports zen, ironic, and savage tones', () => {
  const zen = generateDryNotification('forgiveness', {
    actorName: 'Marco',
    debtorName: 'Luca',
    amount: 2.0,
    insultLevel: 'zen',
  });
  assert.ok(zen.includes('liberato'));

  const savage = generateDryNotification('forgiveness', {
    actorName: 'Marco',
    debtorName: 'Luca',
    amount: 2.0,
    insultLevel: 'savage',
  });
  assert.ok(savage.includes('imbarazzo'));

  const ironic = generateDryNotification('forgiveness', {
    actorName: 'Marco',
    debtorName: 'Luca',
    amount: 2.0,
    insultLevel: 'ironic',
  });
  assert.ok(ironic.includes('prima o poi'));
});
