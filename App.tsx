
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, Tab, Saving, WishlistItem } from './types';
import { TransactionForm } from './components/TransactionForm';
import { FinancialCalendar } from './components/FinancialCalendar';
import { SummaryHeader } from './components/SummaryHeader';
import { FinancialTips } from './components/FinancialTips';
import { calculateFinances, formatCurrency, formatDate, getCategoryTotals, isTransactionInMonth, calculateBalanceAtDate } from './utils';

const CATEGORY_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 
  'bg-purple-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500', 
  'bg-pink-500', 'bg-lime-500', 'bg-violet-500'
];

const TAB_COLORS: Record<Tab, { active: string; icon: string; label: string }> = {
  home: { active: 'bg-blue-100 text-blue-700', icon: 'fa-house', label: 'Início' },
  extract: { active: 'bg-emerald-100 text-emerald-700', icon: 'fa-receipt', label: 'Extrato' },
  calendar: { active: 'bg-purple-100 text-purple-700', icon: 'fa-calendar', label: 'Fluxo' },
  analytics: { active: 'bg-amber-100 text-amber-700', icon: 'fa-chart-pie', label: 'Análise' },
  fixed: { active: 'bg-rose-100 text-rose-700', icon: 'fa-clock', label: 'Fixos' },
  savings: { active: 'bg-cyan-100 text-cyan-700', icon: 'fa-piggy-bank', label: 'Guardado' },
  wishlist: { active: 'bg-pink-100 text-pink-700', icon: 'fa-heart', label: 'Desejos' }
};

const App: React.FC = () => {
  const [viewingMonth, setViewingMonth] = useState(new Date().getMonth());
  const [viewingYear, setViewingYear] = useState(new Date().getFullYear());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finanza_v13_data');
    let data: Transaction[] = saved ? JSON.parse(saved) : [];
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return data.filter(t => t.isFixed || new Date(t.date + 'T12:00:00') >= cutoff);
  });

  const [savings, setSavings] = useState<Saving[]>(() => {
    const saved = localStorage.getItem('finanza_v13_savings');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem('finanza_v13_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('finanza_v13_cats');
    return saved ? JSON.parse(saved) : ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Moradia'];
  });

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [focusedTransactionId, setFocusedTransactionId] = useState<string | null>(null);

  const [isSavingFormOpen, setIsSavingFormOpen] = useState(false);
  const [isWishFormOpen, setIsWishFormOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('finanza_v13_data', JSON.stringify(transactions));
    localStorage.setItem('finanza_v13_cats', JSON.stringify(customCategories));
    localStorage.setItem('finanza_v13_savings', JSON.stringify(savings));
    localStorage.setItem('finanza_v13_wishlist', JSON.stringify(wishlist));
  }, [transactions, customCategories, savings, wishlist]);

  const stats = useMemo(() => calculateFinances(transactions, viewingYear, viewingMonth), [transactions, viewingYear, viewingMonth]);
  const categoryTotals = useMemo(() => getCategoryTotals(transactions, viewingYear, viewingMonth), [transactions, viewingYear, viewingMonth]);
  const totalSavings = useMemo(() => savings.reduce((acc, s) => acc + s.amount, 0), [savings]);

  const handleAdd = (t: Transaction) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr));
    } else {
      setTransactions(prev => [...prev, t]);
    }
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este lançamento?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleDayClick = (date: string) => {
    setSelectedDay(date);
  };

  const filteredExtract = useMemo(() => {
    return transactions.filter(t => isTransactionInMonth(t, viewingYear, viewingMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, viewingYear, viewingMonth]);

  const dayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    const [y, m, d] = selectedDay.split('-').map(Number);
    return transactions.filter(t => {
      if (t.isFixed) {
        return isTransactionInMonth(t, viewingYear, viewingMonth) && t.fixedDay === d;
      }
      return t.date === selectedDay;
    });
  }, [transactions, selectedDay, viewingYear, viewingMonth]);

  const dayBalance = useMemo(() => {
    return dayTransactions.reduce((acc, t) => {
      if (t.type.includes('INCOME')) return acc + t.amount;
      if (t.type.includes('EXPENSE')) return acc - t.amount;
      return acc;
    }, 0);
  }, [dayTransactions]);

  const dayCumulativeBalance = useMemo(() => {
    if (!selectedDay) return 0;
    return calculateBalanceAtDate(transactions, selectedDay);
  }, [transactions, selectedDay]);

  const exportBackup = () => {
    const data = { transactions, savings, wishlist, customCategories };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanza_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions) setTransactions(data.transactions);
        if (data.savings) setSavings(data.savings);
        if (data.wishlist) setWishlist(data.wishlist);
        if (data.customCategories) setCustomCategories(data.customCategories);
        alert('Backup importado com sucesso!');
      } catch (err) {
        alert('Erro ao importar backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddSaving = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') as string;
    if (amount > 0 && date) {
      setSavings(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), amount, date }]);
      setIsSavingFormOpen(false);
    }
  };

  const handleAddWish = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const targetDate = formData.get('date') as string;
    if (title && amount > 0 && targetDate) {
      setWishlist(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), title, amount, targetDate }]);
      setIsWishFormOpen(false);
    }
  };

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const years = [2025, 2026, 2027];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      <SummaryHeader 
        onHand={stats.onHand} 
        projected={stats.projectedTotal} 
        futureExpenses={stats.futureExpenses} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        hideSummary={activeTab === 'home' || activeTab === 'savings' || activeTab === 'wishlist'}
        viewMonth={viewingMonth}
        viewYear={viewingYear}
      />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 mb-24">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="px-1">
               <h1 className="text-3xl font-black tracking-tight text-slate-800 uppercase">Finanza.</h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Sua Gestão Financeira Completa</p>
            </header>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo em Mãos</p>
                    <h2 className={`text-xl font-bold tracking-tight ${stats.onHand >= 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                      {formatCurrency(stats.onHand)}
                    </h2>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo Final Previsto</p>
                    <h2 className={`text-xl font-bold tracking-tight ${stats.projectedTotal >= 0 ? 'text-slate-800' : 'text-rose-500'}`}>{formatCurrency(stats.projectedTotal)}</h2>
                 </div>
              </div>
            </div>

            <FinancialTips />

            {/* NOVA SEÇÃO: ATÉ HOJE NO MÊS VIGENTE */}
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-clock-rotate-left text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Resumo até hoje</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Acumulado no mês até {new Date().getDate()}/{new Date().getMonth() + 1}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Ganhos até hoje</p>
                    <p className="text-base font-bold text-emerald-700">{formatCurrency(stats.earnedSoFar)}</p>
                  </div>
                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                    <p className="text-[8px] font-bold text-rose-600 uppercase tracking-widest mb-1">Gastos até hoje</p>
                    <p className="text-base font-bold text-rose-700">{formatCurrency(stats.spentSoFar)}</p>
                  </div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-layer-group text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Fluxo do Mês</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Resumo do Mês Atual</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Gastos</p>
                    <p className="text-base font-bold text-slate-700">{formatCurrency(stats.monthlyExpenses)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ainda a Pagar</p>
                    <p className="text-base font-bold text-rose-400">{formatCurrency(stats.futureExpenses)}</p>
                  </div>
               </div>
            </div>

            <button 
              onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}
              className="w-full bg-white border-2 border-slate-100 text-slate-800 py-5 rounded-3xl font-bold text-xs shadow-sm hover:bg-slate-50 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-circle-plus text-xl text-slate-800"></i> Adicionar Lançamento
            </button>
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="px-1">
               <h1 className="text-xl font-black text-slate-800 uppercase">Dinheiro Guardado</h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sua reserva pessoal</p>
            </header>

            <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm text-center">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Acumulado</p>
               <h2 className="text-4xl font-black text-cyan-600 tracking-tight">{formatCurrency(totalSavings)}</h2>
            </div>

            <button 
              onClick={() => setIsSavingFormOpen(true)}
              className="w-full bg-white border-2 border-slate-100 text-slate-800 py-5 rounded-3xl font-bold text-xs shadow-sm hover:bg-slate-50 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-plus text-cyan-500"></i> Novo Aporte
            </button>

            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Histórico de Aportes</h3>
              {savings.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                   <p className="text-slate-300 text-[10px] font-bold uppercase">Nenhum aporte registrado</p>
                </div>
              ) : (
                savings.sort((a,b) => b.date.localeCompare(a.date)).map(s => (
                  <div key={s.id} className="bg-white p-4 rounded-2xl border-2 border-slate-50 flex items-center justify-between">
                     <div>
                        <p className="text-xs font-bold text-slate-700">Aporte</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(s.date)}</p>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-cyan-600">{formatCurrency(s.amount)}</span>
                        <button onClick={() => setSavings(prev => prev.filter(x => x.id !== s.id))} className="text-rose-300"><i className="fa-solid fa-trash-can text-xs"></i></button>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="px-1">
               <h1 className="text-xl font-black text-slate-800 uppercase">Lista de Desejos</h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Seus objetivos de compra</p>
            </header>

            <button 
              onClick={() => setIsWishFormOpen(true)}
              className="w-full bg-white border-2 border-slate-100 text-slate-800 py-5 rounded-3xl font-bold text-xs shadow-sm hover:bg-slate-50 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-heart text-pink-500"></i> Adicionar Desejo
            </button>

            <div className="space-y-4">
              {wishlist.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                   <p className="text-slate-300 text-[10px] font-bold uppercase">Sua lista está vazia</p>
                </div>
              ) : (
                wishlist.map(w => {
                  const remaining = Math.max(0, w.amount - totalSavings);
                  const progress = Math.min(100, (totalSavings / w.amount) * 100);
                  return (
                    <div key={w.id} className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-sm space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                             <h3 className="text-sm font-black text-slate-800">{w.title}</h3>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Até {formatDate(w.targetDate)}</p>
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-black text-slate-700 block">{formatCurrency(w.amount)}</span>
                             <button onClick={() => setWishlist(prev => prev.filter(x => x.id !== w.id))} className="text-rose-300 text-[9px] font-bold uppercase">Excluir</button>
                          </div>
                       </div>
                       
                       <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                             <span className="text-pink-500">Guardado: {formatCurrency(totalSavings)}</span>
                             <span className="text-slate-400">Falta: {formatCurrency(remaining)}</span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                             <div className="h-full bg-pink-400 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                       </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'extract' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-lg font-black text-slate-800 px-1 uppercase tracking-tight">Extrato: {months[viewingMonth]}</h2>
            <div className="space-y-2">
              {filteredExtract.map(t => (
                <div key={t.id + (t.isFixed ? '-fixed' : '')} className="flex flex-col">
                  <div 
                    onClick={() => setFocusedTransactionId(focusedTransactionId === t.id ? null : t.id)}
                    className={`bg-white p-5 rounded-2xl border-2 flex items-center justify-between shadow-sm group transition-all cursor-pointer ${focusedTransactionId === t.id ? 'border-blue-400' : 'border-slate-50 hover:border-blue-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type.includes('INCOME') ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                        <i className={`fa-solid ${t.type.includes('INCOME') ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{t.description} {t.isFixed && <span className="text-[8px] bg-blue-100 text-blue-500 px-1.5 py-0.5 rounded ml-1">FIXO</span>}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.isFixed ? 'Custo Fixo' : t.category} • {formatDate(t.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`text-sm font-black ${t.type.includes('INCOME') ? 'text-emerald-500' : 'text-slate-700'}`}>
                        {t.type.includes('INCOME') ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  </div>
                  {focusedTransactionId === t.id && (
                    <div className="flex gap-2 p-2 bg-slate-100/50 rounded-b-2xl mx-4 animate-in slide-in-from-top-2 duration-200">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="flex-1 bg-white text-[9px] font-bold text-slate-600 py-2 rounded-lg border border-slate-200 shadow-sm">EDITAR</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="flex-1 bg-white text-[9px] font-bold text-rose-500 py-2 rounded-lg border border-slate-200 shadow-sm">EXCLUIR</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <FinancialCalendar transactions={transactions} onDateClick={handleDayClick} viewMonth={viewingMonth} viewYear={viewingYear} />
             {selectedDay && (
               <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-800">{formatDate(selectedDay)}</h3>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Saldo em mãos neste dia: <span className={dayCumulativeBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{formatCurrency(dayCumulativeBalance)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-sm font-bold ${dayBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         Fluxo: {dayBalance >= 0 ? '+' : ''}{formatCurrency(dayBalance)}
                       </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {dayTransactions.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                         <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${t.type.includes('INCOME') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                             <i className={`fa-solid ${t.type.includes('INCOME') ? 'fa-plus' : 'fa-minus'}`}></i>
                           </div>
                           <p className="text-xs font-bold text-slate-700">{t.description}</p>
                         </div>
                         <p className="text-xs font-black">{formatCurrency(t.amount)}</p>
                      </div>
                    ))}
                    <button onClick={() => setSelectedDay(null)} className="w-full mt-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-xl">Fechar</button>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <h2 className="text-lg font-black text-slate-800 px-1 uppercase tracking-tight">Análise: {months[viewingMonth]}</h2>
             <div className="bg-white p-7 rounded-3xl border-2 border-slate-100 space-y-6">
                {(Object.entries(categoryTotals) as [string, number][]).length > 0 ? (Object.entries(categoryTotals) as [string, number][]).sort((a,b) => b[1] - a[1]).map(([cat, val], idx) => {
                  const perc = stats.monthlyExpenses > 0 ? (val / stats.monthlyExpenses) * 100 : 0;
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-800 block">{formatCurrency(val)}</span>
                          <span className="text-[9px] font-bold text-blue-500">{perc.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className={`h-full ${color} transition-all duration-1000`} style={{width: `${perc}%`}}></div>
                      </div>
                    </div>
                  );
                }) : <p className="text-center py-10 text-slate-300 text-xs font-bold uppercase">Sem dados para análise</p>}
             </div>
          </div>
        )}

        {activeTab === 'fixed' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-lg font-black text-slate-800 px-1 uppercase tracking-tight">Custos Fixos Ativos</h2>
            <div className="space-y-2">
              {transactions.filter(t => t.isFixed).map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl border-2 border-slate-50 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><i className="fa-solid fa-sync"></i></div>
                    <div>
                      <p className="font-bold text-sm text-slate-700">{t.description}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {t.recurrenceMonths === 0 ? 'Recorrência Infinita' : `Repete por ${t.recurrenceMonths} meses`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800">{formatCurrency(t.amount)}</p>
                    <button onClick={() => handleDelete(t.id)} className="text-[9px] font-bold text-rose-400 uppercase mt-1">Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 pb-8 pt-4 px-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-0.5 overflow-x-auto no-scrollbar">
          {(Object.entries(TAB_COLORS) as [Tab, {active: string, icon: string, label: string}][]).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSelectedDay(null); setFocusedTransactionId(null); }}
              className={`flex-shrink-0 min-w-[65px] flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-300 ${
                activeTab === id ? `${cfg.active} shadow-sm translate-y-[-2px]` : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className={`fa-solid ${cfg.icon} ${activeTab === id ? 'text-base' : 'text-sm'}`}></i>
              <span className="text-[7px] font-bold uppercase tracking-wider">{cfg.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Gerenciar Dados</h2>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-300 hover:text-slate-500"><i className="fa-solid fa-xmark text-xl"></i></button>
              </div>
              <div className="space-y-6">
                 <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês de Referência</p>
                    <div className="grid grid-cols-2 gap-2">
                       <select value={viewingMonth} onChange={(e) => setViewingMonth(parseInt(e.target.value))} className="bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold">{months.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
                       <select value={viewingYear} onChange={(e) => setViewingYear(parseInt(e.target.value))} className="bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                 </div>
                 <div className="space-y-3">
                   <button onClick={exportBackup} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest">Exportar Backup</button>
                   <input type="file" accept=".json" ref={fileInputRef} onChange={importBackup} className="hidden" />
                   <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white border-2 border-slate-100 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest">Importar Backup</button>
                   <button onClick={() => { if(window.confirm('Zerar tudo?')) { localStorage.clear(); window.location.reload(); } }} className="w-full text-[10px] font-bold text-rose-400 uppercase tracking-widest py-4 border-2 border-rose-50 rounded-2xl">Zerar Dados</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isSavingFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100">
              <h2 className="text-lg font-black text-slate-800 uppercase mb-4">Novo Aporte</h2>
              <form onSubmit={handleAddSaving} className="space-y-4">
                 <input type="number" step="0.01" name="amount" placeholder="Valor R$" required className="w-full p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                 <input type="date" name="date" required className="w-full p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                 <div className="flex gap-2">
                    <button type="button" onClick={() => setIsSavingFormOpen(false)} className="flex-1 p-4 rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase">Cancelar</button>
                    <button type="submit" className="flex-1 p-4 rounded-2xl bg-cyan-500 text-white text-[10px] font-black uppercase shadow-lg shadow-cyan-200">Guardar</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isWishFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100">
              <h2 className="text-lg font-black text-slate-800 uppercase mb-4">Novo Desejo</h2>
              <form onSubmit={handleAddWish} className="space-y-4">
                 <input type="text" name="title" placeholder="O que você deseja?" required className="w-full p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                 <input type="number" step="0.01" name="amount" placeholder="Valor R$" required className="w-full p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                 <input type="date" name="date" required className="w-full p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                 <div className="flex gap-2">
                    <button type="button" onClick={() => setIsWishFormOpen(false)} className="flex-1 p-4 rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase">Cancelar</button>
                    <button type="submit" className="flex-1 p-4 rounded-2xl bg-pink-500 text-white text-[10px] font-black uppercase shadow-lg shadow-pink-200">Criar Alvo</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isFormOpen && (
        <TransactionForm 
          onAdd={handleAdd} 
          onClose={() => { setIsFormOpen(false); setEditingTransaction(null); }} 
          initialData={editingTransaction}
          customCategories={customCategories}
          onAddCategory={(c) => setCustomCategories(prev => [...prev, c])}
        />
      )}
    </div>
  );
};

export default App;
