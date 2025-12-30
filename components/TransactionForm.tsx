
import React, { useState } from 'react';
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
  const [type, setType] = useState<TransactionType>(initialData?.type || 'EXPENSE');
  const [category, setCategory] = useState(initialData?.category || 'Alimentação');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [isFixed, setIsFixed] = useState(initialData?.isFixed || false);
  const [recurrence, setRecurrence] = useState(initialData?.recurrenceMonths?.toString() || '0');
  const [newCat, setNewCat] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const transactionData: Transaction = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      description,
      amount: parseFloat(amount),
      type,
      category: isFixed ? 'Custo Fixo' : category,
      date,
      isFixed,
      fixedDay: new Date(date + 'T12:00:00').getDate(),
      recurrenceMonths: isFixed ? parseInt(recurrence) : undefined,
    };

    onAdd(transactionData);
    onClose();
  };

  const handleAddNewCategory = () => {
    if (newCat.trim()) {
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
            {['INCOME', 'EXPENSE'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t as TransactionType)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${
                  type === t 
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
                    : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                {t === 'INCOME' ? 'Entrada (+)' : 'Saída (-)'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">Descrição</label>
              <input
                type="text" 
                required 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:border-slate-800 focus:outline-none transition-all text-sm shadow-sm"
                placeholder="O que é este lançamento?"
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
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5 block">Data Inicial</label>
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

          {!isFixed && (
            <div className="space-y-3">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] block">Categoria</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                {customCategories.map(cat => (
                  <button
                    key={cat} 
                    type="button" 
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${
                      category === cat 
                        ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-900 shadow-xl active:scale-[0.98] transition-all"
          >
            {initialData ? 'Salvar Alterações' : 'Confirmar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
};
