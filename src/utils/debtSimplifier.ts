export interface BilateralDebt {
  id: string;
  creditorId: string; // The one who is owed money
  debtorId: string;   // The one who owes money
  amount: number;
}

export interface SimplifiedTransaction {
  fromId: string;
  toId: string;
  amount: number;
}

export interface SimplificationAnalysis {
  hasCircularDebt: boolean;
  originalTransactionsCount: number;
  simplifiedTransactionsCount: number;
  savedTransactionsCount: number;
  simplifiedList: SimplifiedTransaction[];
  netBalances: Record<string, number>; // positive = net creditor, negative = net debtor
  cycleDetectedDescription?: string;
}

/**
 * Calculates net balance per user from debts list.
 */
export function calculateNetBalances(debts: BilateralDebt[]): Record<string, number> {
  const net: Record<string, number> = {};

  for (const debt of debts) {
    if (debt.amount <= 0) continue;
    const cents = Math.round(debt.amount * 100);
    net[debt.creditorId] = (net[debt.creditorId] || 0) + cents;
    net[debt.debtorId] = (net[debt.debtorId] || 0) - cents;
  }

  // Convert back to Euros
  const result: Record<string, number> = {};
  for (const [id, cents] of Object.entries(net)) {
    result[id] = cents / 100;
  }
  return result;
}

/**
 * Checks if circular debt exists (e.g. A -> B and B -> A, or 3-way cycles).
 */
export function analyzeCircularDebts(debts: BilateralDebt[]): SimplificationAnalysis {
  if (debts.length === 0) {
    return {
      hasCircularDebt: false,
      originalTransactionsCount: 0,
      simplifiedTransactionsCount: 0,
      savedTransactionsCount: 0,
      simplifiedList: [],
      netBalances: {},
    };
  }

  const netCents: Record<string, number> = {};
  for (const debt of debts) {
    const cents = Math.round(debt.amount * 100);
    netCents[debt.creditorId] = (netCents[debt.creditorId] || 0) + cents;
    netCents[debt.debtorId] = (netCents[debt.debtorId] || 0) - cents;
  }

  // Separate into debtors (net negative) and creditors (net positive)
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, cents] of Object.entries(netCents)) {
    if (cents < -0.01) {
      debtors.push({ id, amount: -cents });
    } else if (cents > 0.01) {
      creditors.push({ id, amount: cents });
    }
  }

  // Greedy match largest debtor with largest creditor to minimize transactions
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplified: SimplifiedTransaction[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const matchAmount = Math.min(debtor.amount, creditor.amount);
    if (matchAmount > 0.5) {
      simplified.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: Math.round(matchAmount) / 100,
      });
    }

    debtor.amount -= matchAmount;
    creditor.amount -= matchAmount;

    if (debtor.amount <= 0.5) dIdx++;
    if (creditor.amount <= 0.5) cIdx++;
  }

  const saved = Math.max(0, debts.length - simplified.length);
  const hasCircularDebt = saved > 0;

  const netEuros: Record<string, number> = {};
  for (const [id, cents] of Object.entries(netCents)) {
    netEuros[id] = Math.round(cents) / 100;
  }

  return {
    hasCircularDebt,
    originalTransactionsCount: debts.length,
    simplifiedTransactionsCount: simplified.length,
    savedTransactionsCount: saved,
    simplifiedList: simplified,
    netBalances: netEuros,
    cycleDetectedDescription: hasCircularDebt
      ? `Risolti debiti incrociati: da ${debts.length} pagamenti separati a soli ${simplified.length} saldi netti.`
      : undefined,
  };
}
