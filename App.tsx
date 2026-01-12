
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
  forecast: { active: 'bg-amber-100 text-amber-700', icon: 'fa-wand-magic-sparkles', label: 'Previsão' },
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
    return saved ? JSON.parse(saved) : [];
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
  const [extractMode, setExtractMode] = useState<'realized' | 'future'>('realized');
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

  // Fix: Added missing exportBackup function to resolve 'Cannot find name exportBackup' error
  const exportBackup = () => {
    const data = {
      transactions,
      customCategories,
      savings,
      wishlist
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finanza_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

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

  const groupedExtract = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    let filtered = transactions.filter(t => isTransactionInMonth(t, viewingYear, viewingMonth));

    if (extractMode === 'realized') {
      filtered = filtered.filter(t => t.date <= todayStr && !t.type.startsWith('PROSPECT'));
    } else {
      filtered = filtered.filter(t => t.date > todayStr || t.type.startsWith('PROSPECT'));
    }

    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });

    return Object.keys(groups).sort((a, b) => extractMode === 'realized' ? b.localeCompare(a) : a.localeCompare(b)).map(date => ({
      date,
      items: groups[date],
      dayCumulativeBalance: calculateBalanceAtDate(transactions, date)
    }));
  }, [transactions, viewingYear, viewingMonth, extractMode]);

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

            <FinancialTips />

            <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-clock-rotate-left text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Resumo até hoje</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Acumulado no mês</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Ganhos reais</p>
                    <p className="text-base font-bold text-emerald-700">{formatCurrency(stats.earnedSoFar)}</p>
                  </div>
                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                    <p className="text-[8px] font-bold text-rose-600 uppercase tracking-widest mb-1">Gastos reais</p>
                    <p className="text-base font-bold text-rose-700">{formatCurrency(stats.spentSoFar)}</p>
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

        {activeTab === 'forecast' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="px-1">
               <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cenários e Previsões</h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Impacto de gastos hipotéticos</p>
            </header>

            <div className="bg-amber-50 p-8 rounded-[40px] border-2 border-amber-100 shadow-sm text-center">
               <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Saldo Final Estimado (Previsões)</p>
               <h2 className={`text-4xl font-black tracking-tight ${stats.forecastTotal >= 0 ? 'text-amber-700' : 'text-rose-500'}`}>
                 {formatCurrency(stats.forecastTotal)}
               </h2>
               <p className="text-[9px] font-bold text-amber-500/60 uppercase mt-4">
                 Soma do Real Projetado + Previsões Adicionais
               </p>
            </div>

            <div className="space-y-3">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Lançamentos de Previsão do Mês</h3>
               {transactions.filter(t => isTransactionInMonth(t, viewingYear, viewingMonth) && t.type.startsWith('PROSPECT')).length === 0 ? (
                 <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                    <p className="text-slate-300 text-[10px] font-bold uppercase">Nenhuma previsão para este período</p>
                 </div>
               ) : (
                 transactions.filter(t => isTransactionInMonth(t, viewingYear, viewingMonth) && t.type.startsWith('PROSPECT')).map(t => (
                   <div key={t.id} className="bg-white p-5 rounded-2xl border-2 border-amber-100 flex items-center justify-between shadow-sm">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                       <div>
                         <p className="font-bold text-sm text-slate-700">{t.description}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(t.date)}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-black text-amber-600">-{formatCurrency(t.amount)}</p>
                       <button onClick={() => handleDelete(t.id)} className="text-[9px] font-bold text-rose-400 uppercase mt-1">Remover</button>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {activeTab === 'extract' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Fluxo Diário</h2>
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button onClick={() => setExtractMode('realized')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${extractMode === 'realized' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Efetuado</button>
                <button onClick={() => setExtractMode('future')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${extractMode === 'future' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Planejado</button>
              </div>
            </div>

            <div className="space-y-8">
              {groupedExtract.map(group => (
                <div key={group.date} className="space-y-3">
                  <div className="flex justify-between items-center px-1 border-b border-slate-100 pb-2">
                     <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">{formatDate(group.date)}</h3>
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${group.dayCumulativeBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                       Saldo Final: {formatCurrency(group.dayCumulativeBalance)}
                     </span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map(t => (
                      <div key={t.id} onClick={() => setFocusedTransactionId(focusedTransactionId === t.id ? null : t.id)} className={`bg-white p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${focusedTransactionId === t.id ? 'border-blue-400' : t.type.startsWith('PROSPECT') ? 'border-amber-100' : 'border-slate-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type.includes('INCOME') ? 'bg-emerald-50 text-emerald-500' : t.type.startsWith('PROSPECT') ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                            <i className={`fa-solid ${t.type.includes('INCOME') ? 'fa-arrow-up' : t.type.startsWith('PROSPECT') ? 'fa-wand-magic-sparkles' : 'fa-arrow-down'}`}></i>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{t.description} {t.isFixed && <span className="text-[7px] text-blue-500 font-black">FIXO</span>}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{t.category}</p>
                          </div>
                        </div>
                        <p className={`text-xs font-black ${t.type.includes('INCOME') ? 'text-emerald-500' : t.type.startsWith('PROSPECT') ? 'text-amber-500' : 'text-slate-700'}`}>
                          {t.type.includes('INCOME') ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="animate-in fade-in duration-500">
            <FinancialCalendar transactions={transactions} onDateClick={(d) => setSelectedDay(d)} viewMonth={viewingMonth} viewYear={viewingYear} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 pb-8 pt-4 px-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-0.5 overflow-x-auto no-scrollbar">
          {(Object.entries(TAB_COLORS) as [Tab, {active: string, icon: string, label: string}][]).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSelectedDay(null); }}
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
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-8">Preferências</h2>
              <div className="space-y-4">
                 <select value={viewingMonth} onChange={(e) => setViewingMonth(parseInt(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-sm">{months.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
                 <select value={viewingYear} onChange={(e) => setViewingYear(parseInt(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-sm">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                 <button onClick={exportBackup} className="w-full bg-slate-50 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100">Backup Exportar</button>
                 <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-800 text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Fechar</button>
              </div>
           </div>
        </div>
      )}

      {isFormOpen && (
        <TransactionForm onAdd={handleAdd} onClose={() => { setIsFormOpen(false); setEditingTransaction(null); }} initialData={editingTransaction} customCategories={customCategories} onAddCategory={(c) => setCustomCategories(prev => [...prev, c])} />
      )}
    </div>
  );
};

export default App;
