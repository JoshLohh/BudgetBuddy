// settlementUtils.ts

export function calculateBalances(members, expenses, settlements = []) {
  // 1. Calculate net paid and owed for each member
  const paid = {};
  const owed = {};

  members.forEach(id => {
    paid[id] = 0;
    owed[id] = 0;
  });

  // Go through each expense
  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount) || 0;
    paid[exp.paidBy] += amount;

    let splits = {};
    if (exp.splitType === 'equal') {
      const share = amount / exp.splitBetween.length;
      exp.splitBetween.forEach(uid => {
        splits[uid] = share;
      });
    } else {
      splits = exp.customSplit ? JSON.parse(exp.customSplit) : {};
    }

    exp.splitBetween.forEach(uid => {
      owed[uid] += parseFloat(splits[uid] || '0');
    });
  });

  // 2. Subtract settlements
  // Each settlement is { from, to, amount }
  settlements.forEach(set => {
    // 'from' paid 'to', so 'from' owes less, 'to' is owed less
    owed[set.from] -= set.amount;
    owed[set.to] += set.amount;
  });

  // 3. Calculate net balance
  const balances = {};
  members.forEach(id => {
    balances[id] = +(paid[id] - owed[id]).toFixed(2);
  });

  return balances;
}

export function calculateSettlements(balances) {
  // Greedy algorithm to suggest minimal transactions to settle all debts
  // Returns array of { from, to, amount }
  // balances: { userId: number }
  const settlements = [];
  // Convert balances object to array [{userId, balance}]
  const arr = Object.entries(balances)
    .map(([userId, balance]) => ({ userId, balance: +balance.toFixed(2) }))
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