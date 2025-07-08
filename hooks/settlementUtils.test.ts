// utils/settlementUtils.test.ts
import { test } from 'bun:test';
import { calculateBalances } from './settlementUtils';

test('calculates balances for equal split', () => {
  const members = ['A', 'B', 'C'];
  const expenses = [{ amount: 90, paidBy: 'A', splitBetween: ['A', 'B', 'C'], splitType: 'equal' }];
  const settlements = [];
  const result = calculateBalances(members, expenses, settlements);
  expect(result).toEqual({ A: 60, B: -30, C: -30 });
});