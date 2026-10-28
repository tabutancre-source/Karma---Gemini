import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCircularDebts, calculateNetBalances } from './debtSimplifier';

test('calculateNetBalances calculates accurate net balances', () => {
  const debts = [
    { id: '1', creditorId: 'A', debtorId: 'B', amount: 10 },
    { id: '2', creditorId: 'B', debtorId: 'C', amount: 10 },
    { id: '3', creditorId: 'C', debtorId: 'A', amount: 10 },
  ];
  const net = calculateNetBalances(debts);
  assert.equal(net['A'], 0);
  assert.equal(net['B'], 0);
  assert.equal(net['C'], 0);
});

test('analyzeCircularDebts cancels out a 3-way circular debt perfectly', () => {
  // A paid for B (10€), B paid for C (10€), C paid for A (10€)
  // Perfectly cancels to 0 transactions!
  const debts = [
    { id: '1', creditorId: 'A', debtorId: 'B', amount: 10 },
    { id: '2', creditorId: 'B', debtorId: 'C', amount: 10 },
    { id: '3', creditorId: 'C', debtorId: 'A', amount: 10 },
  ];
  const analysis = analyzeCircularDebts(debts);
  assert.equal(analysis.hasCircularDebt, true);
  assert.equal(analysis.simplifiedTransactionsCount, 0);
  assert.equal(analysis.savedTransactionsCount, 3);
});

test('analyzeCircularDebts collapses bilateral back-and-forth debts', () => {
  // A owes B 15€, B owes A 10€ -> net A owes B 5€
  const debts = [
    { id: '1', creditorId: 'B', debtorId: 'A', amount: 15 },
    { id: '2', creditorId: 'A', debtorId: 'B', amount: 10 },
  ];
  const analysis = analyzeCircularDebts(debts);
  assert.equal(analysis.simplifiedTransactionsCount, 1);
  assert.equal(analysis.simplifiedList[0].fromId, 'A');
  assert.equal(analysis.simplifiedList[0].toId, 'B');
  assert.equal(analysis.simplifiedList[0].amount, 5);
});
