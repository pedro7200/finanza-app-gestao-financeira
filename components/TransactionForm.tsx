
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
  const [category, setCategory] = useState(initialData?.category || 'Importante');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [isFixed, setIsFixed] = useState(initialData?.isFixed || false);
  const [recurrenceMonths, setRecurrenceMonths] = useState(initialData?.recurrenceMonths?.toString() || '0');
  const [newCat, setNewCat] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const transactionData: Transaction = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      description,
      amount: parseFloat(amount),
      type,
      category: isFixed ? 'Custo Fixo' : (type.includes('INCOME') ? 'Receita' : category),
      date,
      isFixed,
      fixedDay: isFixed ? new Date(date + 'T12:00:00').getDate() : undefined,
      recurrenceMonths: isFixed ? parseInt(recurrenceMonths) : undefined
    };

    onAdd(transactionData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {['INCOME', 'EXPENSE'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t as TransactionType)}
                className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${
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
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:border-slate-800 focus:outline-none transition-all text-sm shadow-sm"
                placeholder="Ex: Aluguel, Supermercado..."
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:border-slate-800 focus:outline-none transition-all text-sm font-bold shadow-sm"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-700 focus:border-slate-800 focus:outline-none transition-all text-sm shadow-sm"
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
                 className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-slate-800" 
               />
               <label htmlFor="fixed" className="text-xs font-bold text-slate-700 cursor-pointer">Custo fixo mensal</label>
             </div>
          </div>

          {!isFixed && type === 'EXPENSE' && (
            <div className="space-y-3">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {['Urgente', 'Importante', 'Lazer', 'Desnecessário', ...customCategories].map(cat => (
                  <button
                    key={cat} 
                    type="button" 
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                      category === cat 
                        ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                        : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
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
            className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 shadow-lg"
          >
            {initialData ? 'Confirmar Edição' : 'Salvar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
};
