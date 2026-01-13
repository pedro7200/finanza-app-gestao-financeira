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

/**
 * Verifica se uma transação (fixa ou normal) deve aparecer em um determinado mês/ano
 */
export const isTransactionInMonth = (t: Transaction, targetYear: number, targetMonth: number) => {
  const tDate = new Date(t.date + 'T12:00:00');
  const tYear = tDate.getFullYear();
  const tMonth = tDate.getMonth();

  if (!t.isFixed) {
    return tYear === targetYear && tMonth === targetMonth;
  }

  // Se for fixa, ela começa no mês de criação
  if (targetYear < tYear || (targetYear === tYear && targetMonth < tMonth)) {
    return false;
  }

  // Se tiver limite de meses de recorrência
  if (t.recurrenceMonths && t.recurrenceMonths > 0) {
    const monthsDiff = (targetYear - tYear) * 12 + (targetMonth - tMonth);
    return monthsDiff < t.recurrenceMonths;
  }

  return true;
};

/**
 * Calcula o saldo acumulado (Entradas - Saídas) até uma data específica.
 * Por padrão, ignora transações de PREVISÃO (PROSPECT), a menos que includeProspects seja true.
 */
export const calculateBalanceAtDate = (transactions: Transaction[], targetDateStr: string, includeProspects: boolean = false) => {
  let balance = 0;
  const targetDate = new Date(targetDateStr + 'T23:59:59');
  const targetY = targetDate.getFullYear();
  const targetM = targetDate.getMonth();

  transactions.forEach(t => {
    // Ignora transações de previsão se includeProspects for false
    if (!includeProspects && t.type.startsWith('PROSPECT')) return;

    const startDate = new Date(t.date + 'T12:00:00');
    const startY = startDate.getFullYear();
    const startM = startDate.getMonth();

    if (t.isFixed) {
      let tempY = startY;
      let tempM = startM;
      let count = 0;

      while (tempY < targetY || (tempY === targetY && tempM <= targetM)) {
        if (t.recurrenceMonths && t.recurrenceMonths > 0 && count >= t.recurrenceMonths) break;
        
        const dayToUse = t.fixedDay || startDate.getDate();
        const instanceDateStr = `${tempY}-${String(tempM + 1).padStart(2, '0')}-${String(dayToUse).padStart(2, '0')}`;
        
        if (instanceDateStr <= targetDateStr) {
          if (t.type === 'INCOME' || t.type === 'PROSPECT_INCOME') balance += t.amount;
          if (t.type === 'EXPENSE' || t.type === 'PROSPECT_EXPENSE') balance -= t.amount;
        }

        tempM++;
        if (tempM > 11) { tempM = 0; tempY++; }
        count++;
      }
    } else {
      if (t.date <= targetDateStr) {
        if (t.type === 'INCOME' || t.type === 'PROSPECT_INCOME') balance += t.amount;
        if (t.type === 'EXPENSE' || t.type === 'PROSPECT_EXPENSE') balance -= t.amount;
      }
    }
  });

  return balance;
};

export const calculateFinances = (transactions: Transaction[], viewYear: number, viewMonth: number) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const onHand = calculateBalanceAtDate(transactions, todayStr);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const lastDayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
  const projectedTotal = calculateBalanceAtDate(transactions, lastDayStr);

  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let futureExpenses = 0;
  let earnedSoFar = 0;
  let spentSoFar = 0;
  let prospectBalance = 0;

  transactions.forEach(t => {
    if (isTransactionInMonth(t, viewYear, viewMonth)) {
      const isIncome = t.type === 'INCOME';
      const isExpense = t.type === 'EXPENSE';
      const isProspect = t.type.startsWith('PROSPECT');

      if (isIncome) monthlyIncome += t.amount;
      if (isExpense) monthlyExpenses += t.amount;
      
      if (isProspect) {
        if (t.type === 'PROSPECT_INCOME') prospectBalance += t.amount;
        else prospectBalance -= t.amount;
        return; // Pula cálculos de "so far" para previsões
      }

      const day = t.isFixed ? (t.fixedDay || 1) : new Date(t.date + 'T12:00:00').getDate();
      const tFullDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      if (tFullDateStr <= todayStr) {
        if (isIncome) earnedSoFar += t.amount;
        if (isExpense) spentSoFar += t.amount;
      }

      if (tFullDateStr > todayStr && isExpense) {
        futureExpenses += t.amount;
      }
    }
  });

  return {
    onHand,
    projectedTotal,
    futureExpenses,
    monthlyIncome,
    monthlyExpenses,
    earnedSoFar,
    spentSoFar,
    forecastTotal: projectedTotal + prospectBalance,
    healthScore: monthlyIncome > 0 ? Math.max(0, Math.min(100, ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)) : 0
  };
};

export const getCategoryTotals = (transactions: Transaction[], viewYear: number, viewMonth: number) => {
  const totals: Record<string, number> = {};
  transactions.forEach(t => {
    if (isTransactionInMonth(t, viewYear, viewMonth)) {
      if (t.type === 'EXPENSE' || t.type === 'PROSPECT_EXPENSE') {
        const cat = t.isFixed ? 'Custo Fixo' : t.category;
        totals[cat] = (totals[cat] || 0) + t.amount;
      }
    }
  });
  return totals;
};

export const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
export const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();