
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

export const calculateFinances = (transactions: Transaction[], viewYear: number, viewMonth: number) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Para saldo cumulativo "em mãos", precisamos calcular tudo desde o início dos tempos até HOJE
  let onHand = 0;
  
  // Para o mês de visualização específico
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let futureExpenses = 0;

  // 1. Calcular Saldo Real Total Acumulado até HOJE
  // Inclui transações fixas projetadas até o dia de hoje
  transactions.forEach(t => {
    // Percorremos os meses desde o início da transação até hoje para somar as ocorrências
    const startDate = new Date(t.date + 'T12:00:00');
    const startY = startDate.getFullYear();
    const startM = startDate.getMonth();
    
    const currentLimitY = now.getFullYear();
    const currentLimitM = now.getMonth();

    if (t.isFixed) {
      let tempY = startY;
      let tempM = startM;
      let count = 0;

      while (tempY < currentLimitY || (tempY === currentLimitY && tempM <= currentLimitM)) {
        if (t.recurrenceMonths && t.recurrenceMonths > 0 && count >= t.recurrenceMonths) break;
        
        const instanceDateStr = `${tempY}-${String(tempM + 1).padStart(2, '0')}-${String(t.fixedDay).padStart(2, '0')}`;
        
        if (instanceDateStr <= todayStr) {
          if (t.type === 'INCOME') onHand += t.amount;
          if (t.type === 'EXPENSE') onHand -= t.amount;
        }

        tempM++;
        if (tempM > 11) { tempM = 0; tempY++; }
        count++;
      }
    } else {
      if (t.date <= todayStr) {
        if (t.type === 'INCOME') onHand += t.amount;
        if (t.type === 'EXPENSE') onHand -= t.amount;
      }
    }
  });

  // 2. Calcular Métricas do Mês de Visualização
  transactions.forEach(t => {
    if (isTransactionInMonth(t, viewYear, viewMonth)) {
      const isIncome = t.type === 'INCOME' || t.type === 'PROSPECT_INCOME';
      const isExpense = t.type === 'EXPENSE' || t.type === 'PROSPECT_EXPENSE';

      if (isIncome) monthlyIncome += t.amount;
      if (isExpense) monthlyExpenses += t.amount;

      // Gastos pendentes no mês de visualização (da data de amanhã em diante)
      // Se o mês visualizado for futuro, tudo é pendente. Se for passado, nada é.
      const targetDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(t.isFixed ? t.fixedDay : new Date(t.date+'T12:00:00').getDate()).padStart(2, '0')}`;
      
      if (targetDateStr > todayStr && isExpense) {
        futureExpenses += t.amount;
      }
    }
  });

  const projectedTotal = onHand + (monthlyIncome - monthlyExpenses); // Saldo final do mês considerando o que já tem em mãos
  const healthScore = monthlyIncome > 0 ? Math.max(0, Math.min(100, ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)) : 0;

  return {
    onHand,
    projectedTotal,
    futureExpenses,
    monthlyIncome,
    monthlyExpenses,
    healthScore
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
