
import React from 'react';
import { formatCurrency } from '../utils';

interface SummaryHeaderProps {
  onHand: number;
  projected: number;
  futureExpenses: number;
  onOpenSettings: () => void;
  hideSummary?: boolean;
}

export const SummaryHeader: React.FC<SummaryHeaderProps> = ({ onHand, projected, futureExpenses, onOpenSettings, hideSummary }) => {
  return (
    <div className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        
        {/* Resumo compacto (oculto na home pois ela já tem o dashboard) */}
        {!hideSummary ? (
          <div className="flex-1 flex items-center justify-between border border-slate-100 rounded-md bg-slate-50/50 p-1 animate-in slide-in-from-top-1 duration-300">
            <div className="flex-1 text-center border-r border-slate-200/50 px-1">
              <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">Disponível</p>
              <p className={`text-[10px] font-bold truncate ${onHand >= 0 ? 'text-slate-600' : 'text-rose-500'}`}>
                {formatCurrency(onHand)}
              </p>
            </div>
            
            <div className="flex-1 text-center border-r border-slate-200/50 px-1">
              <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">Meta Mês</p>
              <p className="text-[10px] font-bold text-blue-500 truncate">
                {formatCurrency(projected)}
              </p>
            </div>

            <div className="flex-1 text-center px-1">
              <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">Pendentes</p>
              <p className="text-[10px] font-bold text-slate-500 truncate">
                {formatCurrency(futureExpenses)}
              </p>
            </div>
          </div>
        ) : <div className="flex-1" />}

        {/* Ícone de Configurações Fixo no Canto Superior Direito */}
        <button 
          onClick={onOpenSettings}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors rounded-md border border-transparent hover:border-slate-100"
        >
          <i className="fa-solid fa-gear text-lg"></i>
        </button>
      </div>
    </div>
  );
};
