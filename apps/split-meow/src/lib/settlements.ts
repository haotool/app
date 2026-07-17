export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

// 貪婪配對：金額最大的債權人與債務人優先互抵，最小化轉帳筆數。
export function calculateSettlements(balances: Record<string, number>): Settlement[] {
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.01)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.01)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    if (!credit || !debt) break;
    const amount = Math.min(credit.amount, debt.amount);

    if (amount > 0.01) {
      settlements.push({ from: debt.id, to: credit.id, amount });
    }

    credit.amount -= amount;
    debt.amount -= amount;

    if (credit.amount < 0.01) ci++;
    if (debt.amount < 0.01) di++;
  }

  return settlements;
}
