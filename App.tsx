
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Tab } from './types';
import { TransactionForm } from './components/TransactionForm';
import { FinancialCalendar } from './components/FinancialCalendar';
import { SummaryHeader } from './components/SummaryHeader';
import { calculateFinances, formatCurrency, formatDate, getCategoryTotals } from './utils';

const App: React.FC = () => {
  // Estados de Dados
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finanza_v11_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('finanza_v11_cats');
    return saved ? JSON.parse(saved) : ['Alimentação', 'Transporte', 'Lazer'];
  });

  // UI States
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('finanza_v11_data', JSON.stringify(transactions));
    localStorage.setItem('finanza_v11_cats', JSON.stringify(customCategories));
  }, [transactions, customCategories]);

  const stats = useMemo(() => calculateFinances(transactions), [transactions]);
  const categoryTotals = useMemo(() => getCategoryTotals(transactions), [transactions]);

  // Cálculo específico de custos fixos do mês atual
  const fixedCostsTotal = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.isFixed && (t.type === 'EXPENSE' || t.type === 'PROSPECT_EXPENSE'))
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

  const filteredExtract = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      return filterDate ? t.date === filterDate : isThisMonth;
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [transactions, filterDate]);

  const tabConfig: Record<Tab, { bg: string, text: string, border: string, icon: string, label: string, pastel: string }> = {
    home: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', icon: 'fa-house', label: 'Início', pastel: 'bg-white' },
    extract: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'fa-receipt', label: 'Extrato', pastel: 'bg-[#F0FDF4]' },
    calendar: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', icon: 'fa-calendar', label: 'Fluxo', pastel: 'bg-[#FEFCE8]' },
    analytics: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', icon: 'fa-chart-pie', label: 'Metas', pastel: 'bg-[#F5F3FF]' },
    fixed: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: 'fa-clock', label: 'Fixos', pastel: 'bg-[#FFF1F2]' }
  };

  const currentTheme = tabConfig[activeTab];

  return (
    <div className={`min-h-screen ${currentTheme.pastel} flex flex-col transition-all-colors duration-500`}>
      
      <SummaryHeader 
        onHand={stats.onHand} 
        projected={stats.projectedTotal} 
        futureExpenses={stats.futureExpenses} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        hideSummary={activeTab === 'home'}
      />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-4 mb-20">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="px-1 mt-2">
               <h1 className="text-3xl font-black tracking-tight text-slate-800">MEU FINANZA.</h1>
               <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Resumo do Mês Atual</p>
            </header>

            {/* Balanços Principais */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo em Mãos</p>
                  <h2 className={`text-xl font-bold tracking-tight ${stats.onHand >= 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                    {formatCurrency(stats.onHand)}
                  </h2>
               </div>
               <div className="bg-slate-800 p-6 rounded-2xl text-white shadow-lg transition-all hover:shadow-xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 opacity-70">Saldo Projetado</p>
                  <h2 className="text-xl font-bold tracking-tight">{formatCurrency(stats.projectedTotal)}</h2>
               </div>
            </div>

            {/* Espaço para Valores de Possíveis Custos (Solicitado) */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                            <i className="fa-solid fa-file-invoice-dollar text-sm"></i>
                        </div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Compromissos do Mês</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Restante do mês</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Custos Fixos</p>
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(fixedCostsTotal)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">A pagar (Pendentes)</p>
                        <p className="text-sm font-bold text-rose-400">{formatCurrency(stats.futureExpenses)}</p>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex justify-between items-end mb-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Saúde Mensal</p>
                        <p className="text-xs font-bold text-slate-700">{stats.healthScore.toFixed(0)}%</p>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div className="h-full bg-blue-400 transition-all duration-1000" style={{width: `${stats.healthScore}%`}}></div>
                    </div>
                </div>
            </div>

            <button 
              onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}
              className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold text-xs shadow-lg hover:bg-slate-900 active:scale-[0.98] transition-all uppercase tracking-[0.15em] flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus-circle text-lg"></i> Novo Lançamento
            </button>
          </div>
        )}

        {activeTab === 'extract' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-lg font-bold text-slate-700 tracking-tight">Extrato Mensal</h2>
              {filterDate && <button onClick={() => setFilterDate(null)} className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Ver Mês Inteiro</button>}
            </div>
            <div className="space-y-2">
              {filteredExtract.map(t => (
                <div key={t.id} className="bg-white px-5 py-4 rounded-2xl border-2 border-slate-50 flex justify-between items-center group shadow-sm transition-all hover:border-emerald-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${t.type.includes('INCOME') ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-400'}`}>
                      <i className={`fa-solid ${t.type.includes('INCOME') ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-700 leading-tight">{t.description}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t.category} • {formatDate(t.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-bold text-sm ${t.type.includes('INCOME') ? 'text-emerald-500' : 'text-slate-700'}`}>
                      {t.type.includes('INCOME') ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(t)} className="text-slate-300 hover:text-blue-400 p-1"><i className="fa-solid fa-pen text-[10px]"></i></button>
                      <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-rose-400 p-1"><i className="fa-solid fa-trash text-[10px]"></i></button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredExtract.length === 0 && (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <i className="fa-solid fa-receipt text-3xl text-slate-200 mb-3"></i>
                  <p className="text-slate-300 text-xs font-bold uppercase tracking-[0.2em]">Nenhum registro encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="animate-in fade-in duration-500 space-y-4">
             <FinancialCalendar transactions={transactions} onDateClick={(d) => { setFilterDate(d); setActiveTab('extract'); }} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-5 animate-in fade-in duration-500">
             <h2 className="text-lg font-bold text-slate-700 px-1">Análise de Gastos</h2>
             <div className="bg-white p-7 rounded-3xl border-2 border-slate-100 space-y-6 shadow-sm">
                {Object.entries(categoryTotals).length > 0 ? Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]).map(([cat, val]) => {
                  const perc = stats.monthlyExpenses > 0 ? (val / stats.monthlyExpenses) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-700 block">{formatCurrency(val)}</span>
                          <span className="text-[9px] font-bold text-purple-400">{perc.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${cat === 'Desnecessário' ? 'bg-rose-300' : 'bg-purple-400'}`} style={{width: `${perc}%`}}></div>
                      </div>
                    </div>
                  );
                }) : <p className="text-center text-slate-300 py-12 text-xs font-bold uppercase tracking-widest">Lance dados para ver o gráfico</p>}
             </div>
          </div>
        )}

        {activeTab === 'fixed' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-lg font-bold text-slate-700 px-1">Custos Fixos Ativos</h2>
            <div className="space-y-2">
              {transactions.filter(t => t.isFixed).map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl border-2 border-slate-50 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 text-rose-400 rounded-lg flex items-center justify-center text-base">
                      <i className="fa-solid fa-sync"></i>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-700">{t.description}</p>
                      <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">Vencimento: Dia {t.fixedDay}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(t.amount)}</p>
                    <button onClick={() => handleDelete(t.id)} className="text-[9px] font-bold text-rose-300 hover:text-rose-500 uppercase mt-1 transition-colors">Remover</button>
                  </div>
                </div>
              ))}
              {transactions.filter(t => t.isFixed).length === 0 && <p className="text-center py-20 text-slate-200 text-xs font-bold uppercase tracking-widest">Nenhum custo fixo</p>}
            </div>
          </div>
        )}
      </main>

      {/* Navegação Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center z-40 px-4 pb-4">
        <div className="max-w-xl mx-auto w-full flex gap-1">
          {(Object.keys(tabConfig) as Tab[]).map((tabId) => {
            const cfg = tabConfig[tabId];
            const isSelected = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all relative ${isSelected ? cfg.bg + ' shadow-sm border border-slate-100' : 'bg-transparent opacity-40'}`}
              >
                <i className={`fa-solid ${cfg.icon} ${isSelected ? cfg.text : 'text-slate-500'} ${isSelected ? 'text-base' : 'text-sm'}`}></i>
                <span className={`text-[8px] font-bold uppercase tracking-wider ${isSelected ? cfg.text : 'text-slate-400'}`}>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modal de Configurações */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-5">
                 <h2 className="text-xl font-bold text-slate-700 tracking-tight">Gerenciar App</h2>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-300 hover:text-slate-500 p-1">
                    <i className="fa-solid fa-xmark text-xl"></i>
                 </button>
              </div>

              <div className="space-y-6">
                 <button 
                   onClick={() => { if(window.confirm('Exportar seus dados para Backup?')) { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions)); const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", "finanza_backup.json"); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove(); } }}
                   className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-50 hover:bg-slate-50 transition-all text-left"
                 >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><i className="fa-solid fa-download"></i></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-700 uppercase">Exportar Backup</p>
                        <p className="text-[9px] text-slate-400 font-medium">Baixe seus dados locais</p>
                    </div>
                 </button>

                 <div className="pt-6 border-t border-slate-50">
                    <button 
                      onClick={() => { if(window.confirm('Apagar tudo? Seus dados financeiros serão removidos permanentemente deste dispositivo.')) { setTransactions([]); localStorage.clear(); window.location.reload(); } }}
                      className="w-full text-[10px] font-bold text-rose-400 uppercase tracking-widest py-4 border-2 border-rose-50 rounded-2xl hover:bg-rose-50 transition-all"
                    >
                      Zerar Base de Dados
                    </button>
                 </div>
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
