// settlementUtils.ts
export function calculateBalances(members, expenses) {
  const paid = {};
  members.forEach(id => { paid[id] = 0; });
  expenses.forEach(exp => {
    paid[exp.paidBy] += parseFloat(exp.amount) || 0;
  });
  const total = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const share = total / members.length;
  const balances = {};
  members.forEach(id => {
    balances[id] = +(paid[id] - share).toFixed(2);
  });
  return balances;
}

export function calculateSettlements(balances) {
  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([id, balance]) => {
    if (balance > 0.009) creditors.push({ id, amount: balance });
    else if (balance < -0.009) debtors.push({ id, amount: -balance });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    const amount = Math.min(d.amount, c.amount);
    settlements.push({ from: d.id, to: c.id, amount: +amount.toFixed(2) });
    d.amount -= amount;
    c.amount -= amount;
    if (d.amount < 0.01) i++;
    if (c.amount < 0.01) j++;
  }
  return settlements;
}
