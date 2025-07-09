import type { Balances, Expense, Settlement } from '@/types';

/**
 * Calculate net balances for each member.
 */
export function calculateBalances(
  members: string[],
  expenses: Expense[],
  settlements: Settlement[] = []
): Balances {
  // 1. Calculate net paid and owed for each member
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};

  members.forEach((id: string) => {
    paid[id] = 0;
    owed[id] = 0;
  });

  // Go through each expense
  expenses.forEach((exp: Expense) => {
    const amount = parseFloat(String(exp.amount)) || 0;
    paid[exp.paidBy] += amount;

    if (exp.splitType === 'equal') {
      const share = amount / exp.splitBetween.length;
      exp.splitBetween.forEach((uid: string) => {
        owed[uid] += share;
      });
    } else {
      // custom split
      let splits: Record<string, number> = {};
      if (exp.customSplit) {
        try {
          splits = JSON.parse(exp.customSplit);
        } catch {
          splits = {};
        }
      }
      exp.splitBetween.forEach((uid: string) => {
        owed[uid] += parseFloat(String(splits[uid] ?? '0'));
      });
    }
  });

  // 2. Subtract settlements
  // Each settlement is { from, to, amount }
  settlements.forEach((set: Settlement) => {
    // 'from' paid 'to', so 'from' owes less, 'to' is owed less
    owed[set.from] -= set.amount;
    owed[set.to] += set.amount;
  });

  // 3. Calculate net balance
  const balances: Record<string, number> = {};
  members.forEach((id: string) => {
    balances[id] = +(paid[id] - owed[id]).toFixed(2);
  });

  return balances;
}

/**
 * Suggest minimal transactions to settle all debts.
 */
export function calculateSettlements(balances: Balances): Settlement[] {
  // Greedy algorithm to suggest minimal transactions to settle all debts
  // Returns array of { from, to, amount }
  // balances: { userId: number }
  const settlements: Settlement[] = [];

  // Convert balances object to array [{userId, balance}]
  const arr: { userId: string; balance: number }[] = Object.entries(balances)
    .map(([userId, balance]) => ({
      userId,
      balance: typeof balance === 'number' ? +balance.toFixed(2) : 0,
    }))
    .filter(u => Math.abs(u.balance) > 0.01);

  // Separate creditors and debtors
  const creditors = arr.filter(u => u.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors = arr.filter(u => u.balance < 0).sort((a, b) => a.balance - b.balance);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(-debtor.balance, creditor.balance);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: +amount.toFixed(2),
      });
      debtor.balance += amount;
      creditor.balance -= amount;
    }

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  return settlements;
}
