
import { Transaction } from './types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
};

export const getMonthLimits = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return { firstDay, lastDay, now, year, month };
};

export const calculateFinances = (transactions: Transaction[]) => {
  const { year, month, now } = getMonthLimits();
  const todayStr = now.toISOString().split('T')[0];

  let onHand = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let futureExpenses = 0;

  transactions.forEach((t) => {
    const tDate = new Date(t.date + 'T12:00:00'); // Prevent timezone shifts
    if (tDate.getFullYear() === year && tDate.getMonth() === month) {
      const isIncome = t.type === 'INCOME' || t.type === 'PROSPECT_INCOME';
      const isExpense = t.type === 'EXPENSE' || t.type === 'PROSPECT_EXPENSE';

      if (isIncome) totalIncome += t.amount;
      if (isExpense) totalExpense += t.amount;

      // On Hand: Incomes up to today - Expenses up to today
      if (t.date <= todayStr) {
        if (isIncome) onHand += t.amount;
        if (isExpense) onHand -= t.amount;
      } else {
        // Future expenses (within current month)
        if (isExpense) futureExpenses += t.amount;
      }
    }
  });

  const projectedTotal = totalIncome - totalExpense;
  const healthScore = totalIncome > 0 ? Math.max(0, Math.min(100, (projectedTotal / totalIncome) * 100)) : 0;

  return {
    onHand,
    projectedTotal,
    futureExpenses,
    monthlyIncome: totalIncome,
    monthlyExpenses: totalExpense,
    healthScore
  };
};

export const getCategoryTotals = (transactions: Transaction[]) => {
  const { year, month } = getMonthLimits();
  const totals: Record<string, number> = {};

  transactions.forEach(t => {
    const tDate = new Date(t.date + 'T12:00:00');
    if (tDate.getFullYear() === year && tDate.getMonth() === month) {
      if (t.type === 'EXPENSE' || t.type === 'PROSPECT_EXPENSE') {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    }
  });

  return totals;
};

export const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
export const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
