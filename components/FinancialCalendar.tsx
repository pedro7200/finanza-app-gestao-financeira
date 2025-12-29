
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { getDaysInMonth, getFirstDayOfMonth, formatCurrency, getMonthLimits } from '../utils';

interface FinancialCalendarProps {
  transactions: Transaction[];
  onDateClick: (date: string) => void;
}

export const FinancialCalendar: React.FC<FinancialCalendarProps> = ({ transactions, onDateClick }) => {
  const { year, month } = getMonthLimits();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, month));

  const dailyMetrics = useMemo(() => {
    const metrics: Record<number, { balance: number, onHandAtDay: number, trans: Transaction[] }> = {};
    let runningTotal = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTrans = transactions.filter(t => t.date === dateStr);
      
      let dayBalance = 0;
      dayTrans.forEach(t => {
        const isInc = t.type === 'INCOME' || t.type === 'PROSPECT_INCOME';
        const isExp = t.type === 'EXPENSE' || t.type === 'PROSPECT_EXPENSE';
        if (isInc) dayBalance += t.amount;
        if (isExp) dayBalance -= t.amount;
      });

      runningTotal += dayBalance;
      metrics[day] = { balance: dayBalance, onHandAtDay: runningTotal, trans: dayTrans };
    }
    return metrics;
  }, [transactions, year, month]);

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-700 capitalize tracking-tight">{monthName} {year}</h2>
        <div className="flex gap-2">
           <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-emerald-400"></div><span className="text-[7px] font-bold text-slate-300 uppercase">Ganhos</span></div>
           <div className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-rose-400"></div><span className="text-[7px] font-bold text-slate-300 uppercase">Gastos</span></div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
          <div key={d} className="text-center text-[8px] font-bold text-slate-300 py-1 uppercase">{d}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`b-${i}`} className="aspect-square bg-slate-50/20 rounded"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const { balance, trans } = dailyMetrics[day];
          const hasMovement = trans.length > 0;

          return (
            <button
              key={day}
              onClick={() => onDateClick(`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`)}
              className={`group relative aspect-square rounded flex flex-col items-center justify-center gap-0.5 border transition-all hover:bg-slate-50 active:scale-95 ${
                hasMovement ? 'border-slate-100 bg-white' : 'border-transparent'
              }`}
            >
              <span className="text-[9px] font-bold text-slate-500">{day}</span>
              <div className="flex gap-0.5">
                {trans.some(t => t.type.includes('INCOME')) && <div className="w-0.5 h-0.5 rounded-full bg-emerald-400"></div>}
                {trans.some(t => t.type.includes('EXPENSE')) && <div className="w-0.5 h-0.5 rounded-full bg-rose-400"></div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
