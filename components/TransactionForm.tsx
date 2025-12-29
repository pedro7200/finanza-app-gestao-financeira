
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
    <div className="fixed inset-0 bg-slate-800/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg p-5 shadow-xl border border-slate-100 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
          <h2 className="text-lg font-bold text-slate-700 tracking-tight">{initialData ? 'Editar Registro' : 'Novo Lançamento'}</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-slate-50 p-1 rounded border border-slate-100">
            {['INCOME', 'EXPENSE'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t as TransactionType)}
                className={`flex-1 py-1.5 rounded text-[9px] font-bold transition-all uppercase tracking-widest ${type.includes(t) ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-400'}`}
              >
                {t === 'INCOME' ? 'Entrada' : 'Saída'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Descrição</label>
              <input
                type="text" required value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-200 focus:border-blue-300 focus:outline-none transition-all text-xs"
                placeholder="Ex: Aluguel, Supermercado..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Valor</label>
                <input
                  type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:border-blue-300 focus:outline-none transition-all text-xs font-bold"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Data</label>
                <input
                  type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:border-blue-300 focus:outline-none transition-all text-xs"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-2">
             <div className="flex items-center gap-2">
               <input 
                 type="checkbox" id="fixed" checked={isFixed} onChange={(e) => setIsFixed(e.target.checked)}
                 className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300" 
               />
               <label htmlFor="fixed" className="text-[10px] font-bold text-slate-600 cursor-pointer">Custo Fixo Mensal</label>
             </div>
             
             {isFixed && (
               <div className="space-y-1">
                 <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Duração (Meses)</label>
                 <input 
                   type="number" value={recurrenceMonths} onChange={(e) => setRecurrenceMonths(e.target.value)}
                   className="w-full px-2 py-1.5 rounded border border-slate-200 text-[10px] focus:ring-1 focus:ring-blue-300 outline-none"
                   placeholder="0 = Vitalício"
                 />
               </div>
             )}
          </div>

          {!isFixed && type === 'EXPENSE' && (
            <div className="space-y-2">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Categoria</label>
              <div className="flex flex-wrap gap-1">
                {[...customCategories, 'Urgente', 'Importante', 'Lazer', 'Desnecessário'].map(cat => (
                  <button
                    key={cat} type="button" onClick={() => setCategory(cat)}
                    className={`px-2 py-1 rounded text-[9px] font-bold transition-all border ${category === cat ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input 
                  type="text" placeholder="Outra..." value={newCat} onChange={(e) => setNewCat(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded border border-slate-100 text-[9px] outline-none" 
                />
                <button 
                  type="button" onClick={() => { if(newCat) { onAddCategory(newCat); setCategory(newCat); setNewCat(''); } }}
                  className="text-blue-400 text-[9px] font-bold"
                >+ Criar</button>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-slate-700 text-white py-3 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all mt-2 shadow-sm">
            {initialData ? 'Atualizar Dados' : 'Salvar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
};
