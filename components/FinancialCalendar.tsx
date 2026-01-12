
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { getDaysInMonth, getFirstDayOfMonth, isTransactionInMonth } from '../utils';

interface FinancialCalendarProps {
  transactions: Transaction[];
  onDateClick: (date: string) => void;
  viewMonth: number;
  viewYear: number;
}

export const FinancialCalendar: React.FC<FinancialCalendarProps> = ({ transactions, onDateClick, viewMonth, viewYear }) => {
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(viewYear, viewMonth));

  const dayData = useMemo(() => {
    const map: Record<number, { hasIncome: boolean, hasExpense: boolean, hasProspect: boolean, count: number }> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const dayTrans = transactions.filter(t => {
        if (t.isFixed) {
          return isTransactionInMonth(t, viewYear, viewMonth) && t.fixedDay === i;
        }
        return t.date === dateStr;
      });

      map[i] = {
        hasIncome: dayTrans.some(t => t.type === 'INCOME'),
        hasExpense: dayTrans.some(t => t.type === 'EXPENSE'),
        hasProspect: dayTrans.some(t => t.type.startsWith('PROSPECT')),
        count: dayTrans.length
      };
    }
    return map;
  }, [transactions, viewYear, viewMonth]);

  return (
    <div className="bg-white rounded-[32px] p-6 border-2 border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-8 px-2">
        <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">{monthName} <span className="text-slate-300">{viewYear}</span></h2>
        <div className="flex flex-wrap gap-2 justify-end">
           <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div><span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Ganhos</span></div>
           <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div><span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Gastos</span></div>
           <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div><span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Previsto</span></div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="text-center text-[9px] font-black text-slate-300 py-2 uppercase tracking-tighter">{d}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const { hasIncome, hasExpense, hasProspect, count } = dayData[day];
          const isToday = new Date().getDate() === day && new Date().getMonth() === viewMonth && new Date().getFullYear() === viewYear;

          return (
            <button
              key={day}
              onClick={() => onDateClick(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
              className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all hover:bg-slate-50 border-2 active:scale-95 ${
                isToday ? 'border-slate-800' : 'border-transparent'
              } ${count > 0 ? 'bg-slate-50/50' : ''}`}
            >
              <span className={`text-xs font-bold ${isToday ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
              
              <div className="absolute bottom-1.5 flex gap-0.5">
                {hasIncome && <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]"></div>}
                {hasExpense && <div className="w-1 h-1 rounded-full bg-rose-400 shadow-[0_0_4px_rgba(251,113,133,0.5)]"></div>}
                {hasProspect && <div className="w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(fb,bf,24,0.5)]"></div>}
              </div>

              {count > 3 && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-[6px] font-bold text-slate-500">{count}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
