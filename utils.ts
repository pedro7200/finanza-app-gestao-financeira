import { Transaction } from './types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export const generateMonthlyStatementPDF = (
  transactions: Transaction[],
  viewYear: number,
  viewMonth: number,
  months: string[]
) => {
  const doc = new jsPDF();
  const monthName = months[viewMonth];
  const title = `Extrato Mensal - ${monthName} / ${viewYear}`;

  // Page Background (Slate-50)
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header
  doc.setFontSize(24);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont("helvetica", "bold");
  doc.text("Finanza.", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont("helvetica", "normal");
  doc.text("SUA GESTÃO FINANCEIRA COMPLETA", 14, 26);

  doc.setFontSize(16);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(title, 14, 38);

  // Filter and Expand transactions
  const monthTransactions = transactions.filter(t => isTransactionInMonth(t, viewYear, viewMonth));
  const expandedTransactions: { date: string, description: string, category: string, type: string, amount: number, isProspect: boolean }[] = [];
  
  monthTransactions.forEach(t => {
    if (t.isFixed) {
      const day = t.fixedDay || new Date(t.date + 'T12:00:00').getDate();
      const instanceDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      expandedTransactions.push({
        date: instanceDateStr,
        description: `${t.description} (Fixo)`,
        category: t.category,
        type: t.type,
        amount: t.amount,
        isProspect: t.type.startsWith('PROSPECT')
      });
    } else {
      expandedTransactions.push({
        date: t.date,
        description: t.description,
        category: t.category,
        type: t.type,
        amount: t.amount,
        isProspect: t.type.startsWith('PROSPECT')
      });
    }
  });

  expandedTransactions.sort((a, b) => a.date.localeCompare(b.date));

  const tableData = expandedTransactions.map(t => [
    formatDate(t.date),
    t.description,
    t.category,
    t.type.includes('INCOME') ? 'Entrada' : 'Saída',
    formatCurrency(t.amount)
  ]);

  const totalIncomes = expandedTransactions
    .filter(t => t.type.includes('INCOME'))
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalExpenses = expandedTransactions
    .filter(t => t.type.includes('EXPENSE'))
    .reduce((acc, t) => acc + t.amount, 0);

  autoTable(doc, {
    startY: 45,
    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: [241, 245, 249], 
      textColor: [71, 85, 105], 
      fontSize: 9, 
      fontStyle: 'bold',
      cellPadding: 4
    },
    bodyStyles: { 
      fontSize: 10, 
      cellPadding: 6,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' }
    },
    didDrawCell: (data) => {
      if (data.section === 'body') {
        const rowIndex = data.row.index;
        const trans = expandedTransactions[rowIndex];
        const isIncome = trans.type.includes('INCOME');
        const isProspect = trans.isProspect;

        // Draw rounded background for the row (only on the first cell)
        if (data.column.index === 0) {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(241, 245, 249);
          const tableWidth = doc.internal.pageSize.getWidth() - (data.settings.margin.left + (data.settings.margin.right || data.settings.margin.left));
          doc.roundedRect(data.settings.margin.left, data.cell.y + 1, tableWidth, data.row.height - 2, 3, 3, 'FD');
        }

        // Color coding for Type and Amount
        if (data.column.index === 3 || data.column.index === 4) {
          if (isIncome) {
            doc.setTextColor(16, 185, 129); // emerald-500
          } else if (isProspect) {
            doc.setTextColor(245, 158, 11); // amber-500
          } else {
            doc.setTextColor(244, 63, 94); // rose-500
          }
        }
      }
    },
    margin: { top: 45 },
  });

  // Summary Cards at the end
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Total Income Card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, finalY, 60, 25, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("TOTAL ENTRADAS", 19, finalY + 8);
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(totalIncomes), 19, finalY + 18);

  // Total Expense Card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(78, finalY, 60, 25, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("TOTAL SAÍDAS", 83, finalY + 8);
  doc.setFontSize(12);
  doc.setTextColor(244, 63, 94);
  doc.text(formatCurrency(totalExpenses), 83, finalY + 18);

  // Balance Card
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(142, finalY, 54, 25, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(241, 245, 249);
  doc.text("SALDO MENSAL", 147, finalY + 8);
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(formatCurrency(totalIncomes - totalExpenses), 147, finalY + 18);

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save(`extrato_${monthName.toLowerCase()}_${viewYear}.pdf`);
};

