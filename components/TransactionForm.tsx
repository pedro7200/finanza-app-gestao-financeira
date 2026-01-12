
import React, { useState, useEffect } from 'react';
import { TransactionType, Transaction } from '../types';

interface TransactionFormProps {
  onAdd: (transaction: Transaction) => void;
  onClose: () => void;
  initialData?: Transaction | null;
  customCategories: string[];
  onAddCategory: (cat: string) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, onClose, initialData, customCategories, onAddCategory }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [mainType, setMainType] = useState<'INCOME' | 'EXPENSE' | 'PROSPECT'>(() => {
    if (initialData?.type.startsWith('PROSPECT')) return 'PROSPECT';
    return (initialData?.type as 'INCOME' | 'EXPENSE') || 'EXPENSE';
  });
  const [prospectDirection, setProspectDirection] = useState<'INCOME' | 'EXPENSE'>(() => {
    if (initialData?.type === 'PROSPECT_INCOME') return 'INCOME';
    return 'EXPENSE';
  });
  
  const [category, setCategory] = useState(initialData?.category || 'Alimentação');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [isFixed, setIsFixed] = useState(initialData?.isFixed || false);
  const [recurrence, setRecurrence] = useState(initialData?.recurrenceMonths?.toString() || '0');
  const [newCat, setNewCat] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    let finalType: TransactionType;
    if (mainType === 'PROSPECT') {
      finalType = prospectDirection === 'INCOME' ? 'PROSPECT_INCOME' : 'PROSPECT_EXPENSE';
    } else {
      finalType = mainType;
    }

    const transactionData: Transaction = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      description,
      amount: parseFloat(amount),
      type: finalType,
      category: isFixed ? 'Custo Fixo' : category,
      date,
      isFixed: mainType === 'PROSPECT' ? false : isFixed,
      fixedDay: new Date(date + 'T12:00:00').getDate(),
      recurrenceMonths: isFixed ? parseInt(recurrence) : undefined,
    };

    onAdd(transactionData);
    onClose();
  };

  const handleAddCustomCategory = () => {
    if (newCat.trim() && !customCategories.includes(newCat.trim())) {
      onAddCategory(newCat.trim());
      setCategory(newCat.trim());
      setNewCat('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {initialData ? 'Editar Registro' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {[
              { id: 'INCOME', label: 'Entrada (+)' },
              { id: 'EXPENSE', label: 'Saída (-)' },
              { id: 'PROSPECT', label: 'Previsão (?)' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMainType(t.id as any)}
                className={`flex-1 py-3 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest ${
                  mainType === t.id 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                    : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {mainType === 'PROSPECT' && (
            <div className="flex gap-2 p-1 bg-amber-50 rounded-xl border border-amber-100 animate-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setProspectDirection('INCOME')}
                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${prospectDirection === 'INCOME' ? 'bg-amber-400 text-white shadow-sm' : 'text-amber-400'}`}
              >
                Prever Entrada
              </button>
              <button
                type="button"
                onClick={() => setProspectDirection('EXPENSE')}
                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${prospectDirection === 'EXPENSE' ? 'bg-amber-400 text-white shadow-sm' : 'text-amber-400'}`}
              >
                Prever Saída
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">Descrição</label>
              <input
                type="text" 
                required 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:border-slate-800 focus:outline-none transition-all text-sm shadow-sm"
                placeholder="Ex: Reserva de viagem, Bônus futuro..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">Valor (R$)</label>
                <input
                  type="number" 
                  step="0.01" 
                  required 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:border-slate-800 focus:outline-none transition-all text-sm font-bold shadow-sm"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">Data</label>
                <input
                  type="date" 
                  required 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:border-slate-800 focus:outline-none transition-all text-sm shadow-sm"
                />
              </div>
            </div>
          </div>

          {mainType !== 'PROSPECT' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
               <div className="flex items-center gap-3">
                 <input 
                   type="checkbox" 
                   id="fixed" 
                   checked={isFixed} 
                   onChange={(e) => setIsFixed(e.target.checked)}
                   className="w-5 h-5 rounded-lg border-slate-300 text-slate-800 focus:ring-slate-800 transition-all cursor-pointer" 
                 />
                 <label htmlFor="fixed" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Custo Fixo Mensal</label>
               </div>
               
               {isFixed && (
                 <div className="pt-2 animate-in fade-in duration-300">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Repetir por quantos meses? (0 = sempre)</label>
                    <input 
                      type="number" 
                      value={recurrence} 
                      onChange={(e) => setRecurrence(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold"
                    />
                 </div>
               )}
            </div>
          )}

          {(!isFixed || mainType === 'PROSPECT') && (
            <div className="space-y-4">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] block">Categoria</label>
              
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                {customCategories.map(cat => (
                  <button
                    key={cat} 
                    type="button" 
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${
                      category === cat 
                        ? 'bg-white border-slate-800 text-slate-800 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="Nova categoria..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-bold focus:outline-none focus:border-slate-400"
                />
                <button 
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  <i className="fa-solid fa-plus mr-1"></i>
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-sm active:scale-[0.98] transition-all border-2 ${
              mainType === 'PROSPECT' ? 'bg-amber-500 text-white border-amber-400' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {initialData ? 'Salvar Alterações' : 'Confirmar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
};
