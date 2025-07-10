// utils/settlementUtils.test.ts

import { calculateBalances, calculateSettlements } from '../../hooks/settlementUtils';
import type { Balances, Expense, Settlement } from '@/types';

describe('calculateBalances', () => {
  it('calculates balances for equal split', () => {
    const members: string[] = ['A', 'B', 'C'];
    const expenses: Expense[] = [
      { amount: 90, paidBy: 'A', splitBetween: ['A', 'B', 'C'], splitType: 'equal' }
    ];
    const settlements: Settlement[] = [];
    const result = calculateBalances(members, expenses, settlements);
    expect(result).toEqual({ A: 60, B: -30, C: -30 });
  });

  it('calculates balances for custom split', () => {
    const members: string[] = ['A', 'B', 'C'];
    const expenses: Expense[] = [
      {
        amount: 100,
        paidBy: 'B',
        splitBetween: ['A', 'B', 'C'],
        splitType: 'custom',
        customSplit: JSON.stringify({ A: 10, B: 60, C: 30 }),
      }
    ];
    const settlements: Settlement[] = [];
    const result = calculateBalances(members, expenses, settlements);
    expect(result).toEqual({ A: -10, B: 40, C: -30 });
  });

  it('calculates balances with settlements', () => {
    const members: string[] = ['A', 'B', 'C'];
    const expenses: Expense[] = [
      { amount: 90, paidBy: 'A', splitBetween: ['A', 'B', 'C'], splitType: 'equal' }
    ];
    const settlements: Settlement[] = [{ from: 'B', to: 'A', amount: 10 }];
    const result = calculateBalances(members, expenses, settlements);
    expect(result).toEqual({ A: 50, B: -20, C: -30 });
  });

  it('handles empty expenses and settlements', () => {
    const members: string[] = ['A', 'B'];
    const expenses: Expense[] = [];
    const settlements: Settlement[] = [];
    const result = calculateBalances(members, expenses, settlements);
    expect(result).toEqual({ A: 0, B: 0 });
  });

  it('handles missing customSplit gracefully', () => {
    const members: string[] = ['A', 'B'];
    const expenses: Expense[] = [
      {
        amount: 50,
        paidBy: 'A',
        splitBetween: ['A', 'B'],
        splitType: 'custom'
        // customSplit is missing
      }
    ];
    const settlements: Settlement[] = [];
    const result = calculateBalances(members, expenses, settlements);
    expect(result).toEqual({ A: 50, B: 0 });
  });
});

describe('calculateSettlements', () => {
  it('returns empty array for zero balances', () => {
    const balances: Balances = { A: 0, B: 0, C: 0 };
    const result = calculateSettlements(balances);
    expect(result).toEqual([]);
  });

  it('suggests minimal transactions for simple balances', () => {
    const balances: Balances = { A: 60, B: -30, C: -30 };
    const result = calculateSettlements(balances);
    expect(result).toEqual(
      expect.arrayContaining([
        { from: 'B', to: 'A', amount: 30 },
        { from: 'C', to: 'A', amount: 30 }
      ])
    );
    expect(result.length).toBe(2);
  });

  it('handles floating point rounding', () => {
    const balances: Balances = { A: 33.333, B: -16.666, C: -16.667 };
    const result = calculateSettlements(balances);
    const total = result.reduce((sum, tx) => sum + tx.amount, 0);
    expect(Math.abs(total - 33.33)).toBeLessThan(0.05);
  });

  it('handles multiple creditors and debtors', () => {
    const balances: Balances = { A: 50, B: -20, C: -30 };
    const result = calculateSettlements(balances);
    expect(result).toEqual(
      expect.arrayContaining([
        { from: 'B', to: 'A', amount: 20 },
        { from: 'C', to: 'A', amount: 30 }
      ])
    );
    expect(result.length).toBe(2);
  });

  it('returns empty array for all small balances', () => {
    const balances: Balances = { A: 0.005, B: -0.004, C: -0.001 };
    const result = calculateSettlements(balances);
    expect(result).toEqual([]);
  });
});
