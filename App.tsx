
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Tab } from './types';
import { TransactionForm } from './components/TransactionForm';
import { FinancialCalendar } from './components/FinancialCalendar';
import { SummaryHeader } from './components/SummaryHeader';
import { GeminiAdvisor } from './components/GeminiAdvisor';
import { calculateFinances, formatCurrency, formatDate, getCategoryTotals } from './utils';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finanza_v12_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('finanza_v12_cats');
    return saved ? JSON.parse(saved) : ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Moradia'];
  });

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('finanza_v12_data', JSON.stringify(transactions));
    localStorage.setItem('finanza_v12_cats', JSON.stringify(customCategories));
  }, [transactions, customCategories]);

  const stats = useMemo(() => calculateFinances(transactions), [transactions]);
  const categoryTotals = useMemo(() => getCategoryTotals(transactions), [transactions]);

  const fixedCostsTotal = useMemo(() => {
    return transactions
      .filter(t => t.isFixed && t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const handleAdd = (t: Transaction) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
      setEditingTransaction(null);
    } else {
      setTransactions(prev => [t, ...prev]);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja excluir este registro?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  // Filtragem do extrato para o mês atual
  const filteredExtract = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [transactions]);

  const handleDayClick = (date: string) => {
    setSelectedDay(date);
  };

  const dayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return transactions.filter(t => t.date === selectedDay);
  }, [transactions, selectedDay]);

  const dayBalance = useMemo(() => {
    return dayTransactions.reduce((acc, t) => {
      return t.type === 'INCOME' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [dayTransactions]);

  const tabConfig = {
    home: { icon: 'fa-house', label: 'Início' },
    extract: { icon: 'fa-receipt', label: 'Extrato' },
    calendar: { icon: 'fa-calendar', label: 'Fluxo' },
    analytics: { icon: 'fa-chart-pie', label: 'Metas' },
    fixed: { icon: 'fa-clock', label: 'Fixos' }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      <SummaryHeader 
        onHand={stats.onHand} 
        projected={stats.projectedTotal} 
        futureExpenses={stats.futureExpenses} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        hideSummary={activeTab === 'home'}
      />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 mb-24">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="px-1">
               <h1 className="text-3xl font-black tracking-tight text-slate-800 uppercase">Finanza.</h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Mentor Financeiro Inteligente</p>
            </header>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo em Mãos</p>
                  <h2 className={`text-xl font-bold tracking-tight ${stats.onHand >= 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                    {formatCurrency(stats.onHand)}
                  </h2>
               </div>
               <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl">
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1 opacity-70">Saldo Final Previsto</p>
                  <h2 className="text-xl font-bold tracking-tight">{formatCurrency(stats.projectedTotal)}</h2>
               </div>
            </div>

            {/* IA Advisor */}
            <GeminiAdvisor transactions={transactions} onHand={stats.onHand} projected={stats.projectedTotal} />

            {/* Resumo de Custos */}
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-layer-group text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Custos do Mês</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Compromissos Pendentes</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Custos Fixos</p>
                    <p className="text-base font-bold text-slate-700">{formatCurrency(fixedCostsTotal)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendentes (Variáveis)</p>
                    <p className="text-base font-bold text-rose-400">{formatCurrency(stats.futureExpenses)}</p>
                  </div>
               </div>

               <div className="pt-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Saúde Financeira</span>
                    <span className="text-xs font-bold text-slate-700">{stats.healthScore.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${stats.healthScore}%`}}></div>
                  </div>
               </div>
            </div>

            <button 
              onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}
              className="w-full bg-slate-800 text-white py-5 rounded-3xl font-bold text-xs shadow-2xl hover:bg-slate-900 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-circle-plus text-xl"></i> Adicionar Lançamento
            </button>
          </div>
        )}

        {activeTab === 'extract' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-lg font-black text-slate-800 px-1 uppercase tracking-tight">Extrato Mensal</h2>
            <div className="space-y-2">
              {filteredExtract.map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl border-2 border-slate-50 flex items-center justify-between shadow-sm group hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                      <i className={`fa-solid ${t.type === 'INCOME' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{t.description}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.category} • {formatDate(t.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-sm font-black ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-slate-700'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleEdit(t)} className="p-2 text-slate-300 hover:text-blue-500"><i className="fa-solid fa-pen text-[10px]"></i></button>
                       <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-300 hover:text-rose-500"><i className="fa-solid fa-trash text-[10px]"></i></button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredExtract.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                   <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Nenhum lançamento este mês</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <FinancialCalendar transactions={transactions} onDateClick={handleDayClick} />
             {selectedDay && (
               <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-800">{formatDate(selectedDay)}</h3>
                    </div>
                    <div className="text-right">
                       <p className={`text-sm font-bold ${dayBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {formatCurrency(dayBalance)}
                       </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {dayTransactions.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                         <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                             <i className={`fa-solid ${t.type === 'INCOME' ? 'fa-plus' : 'fa-minus'}`}></i>
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
             <h2 className="text-lg font-black text-slate-800 px-1 uppercase tracking-tight">Análise de Gastos</h2>
             <div className="bg-white p-7 rounded-3xl border-2 border-slate-100 space-y-6">
                {/* Fix: cast Object.entries to [string, number][] to fix arithmetic and type assignment errors */}
                {Object.entries(categoryTotals).length > 0 ? (Object.entries(categoryTotals) as [string, number][]).sort((a,b) => b[1] - a[1]).map(([cat, val]) => {
                  const perc = stats.monthlyExpenses > 0 ? (val / stats.monthlyExpenses) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-800 block">{formatCurrency(val)}</span>
                          <span className="text-[9px] font-bold text-blue-500">{perc.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${perc}%`}}></div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center py-10 text-slate-300 text-xs font-bold uppercase">Lance despesas para ver a análise</p>
                )}
             </div>
          </div>
        )}

        {activeTab === 'fixed' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-lg font-black text-slate-800 px-1 uppercase tracking-tight">Custos Fixos</h2>
            <div className="space-y-2">
              {transactions.filter(t => t.isFixed).map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl border-2 border-slate-50 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <i className="fa-solid fa-sync"></i>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-700">{t.description}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recorrência Mensal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800">{formatCurrency(t.amount)}</p>
                    <button onClick={() => handleDelete(t.id)} className="text-[9px] font-bold text-rose-400 uppercase mt-1">Remover</button>
                  </div>
                </div>
              ))}
              {transactions.filter(t => t.isFixed).length === 0 && (
                <div className="text-center py-20 text-slate-200">
                   <p className="text-xs font-bold uppercase tracking-widest">Nenhum custo fixo configurado</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-8 pt-4 px-4 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-1">
          {(Object.entries(tabConfig) as [Tab, any][]).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSelectedDay(null); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl transition-all ${
                activeTab === id ? 'bg-slate-800 text-white shadow-xl translate-y-[-4px]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className={`fa-solid ${cfg.icon} ${activeTab === id ? 'text-base' : 'text-sm'}`}></i>
              <span className="text-[8px] font-bold uppercase tracking-wider">{cfg.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Gerenciar App</h2>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-300 hover:text-slate-500">
                    <i className="fa-solid fa-xmark text-xl"></i>
                 </button>
              </div>
              <div className="space-y-4">
                 <button onClick={() => { if(window.confirm('Exportar backup?')) { const data = JSON.stringify(transactions); alert('Dados salvos no log do navegador por enquanto.'); console.log(data); } }} className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-50 text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><i className="fa-solid fa-download"></i></div>
                    <div><p className="text-xs font-bold text-slate-700 uppercase">Exportar Dados</p></div>
                 </button>
                 <button onClick={() => { if(window.confirm('Zerar tudo?')) { localStorage.clear(); window.location.reload(); } }} className="w-full text-[10px] font-bold text-rose-400 uppercase tracking-widest py-4 border-2 border-rose-50 rounded-2xl">Zerar Banco de Dados</button>
              </div>
           </div>
        </div>
      )}

      {isFormOpen && (
        <TransactionForm 
          onAdd={handleAdd} 
          onClose={() => setIsFormOpen(false)} 
          initialData={editingTransaction}
          customCategories={customCategories}
          onAddCategory={(c) => setCustomCategories(prev => [...prev, c])}
        />
      )}
    </div>
  );
};

export default App;
