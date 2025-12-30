
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, Tab } from './types';
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
  fixed: { active: 'bg-rose-100 text-rose-700', icon: 'fa-clock', label: 'Fixos' }
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
    
    return data.filter(t => {
      if (t.isFixed) return true;
      const tDate = new Date(t.date + 'T12:00:00');
      return tDate >= cutoff;
    });
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

  useEffect(() => {
    localStorage.setItem('finanza_v13_data', JSON.stringify(transactions));
    localStorage.setItem('finanza_v13_cats', JSON.stringify(customCategories));
  }, [transactions, customCategories]);

  const stats = useMemo(() => calculateFinances(transactions, viewingYear, viewingMonth), [transactions, viewingYear, viewingMonth]);
  const categoryTotals = useMemo(() => getCategoryTotals(transactions, viewingYear, viewingMonth), [transactions, viewingYear, viewingMonth]);

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
      setFocusedTransactionId(null);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
    setFocusedTransactionId(null);
  };

  const filteredExtract = useMemo(() => {
    return transactions.filter(t => isTransactionInMonth(t, viewingYear, viewingMonth))
      .sort((a,b) => b.date.localeCompare(a.date));
  }, [transactions, viewingYear, viewingMonth]);

  const handleDayClick = (date: string) => {
    setSelectedDay(date);
  };

  const dayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    const [y, m, d] = selectedDay.split('-').map(Number);
    return transactions.filter(t => {
      if (t.isFixed) {
        return isTransactionInMonth(t, y, m-1) && t.fixedDay === d;
      }
      return t.date === selectedDay;
    });
  }, [transactions, selectedDay]);

  const dayCumulativeBalance = useMemo(() => {
    if (!selectedDay) return 0;
    return calculateBalanceAtDate(transactions, selectedDay);
  }, [transactions, selectedDay]);

  const dayBalance = useMemo(() => {
    return dayTransactions.reduce((acc, t) => {
      return t.type.includes('INCOME') ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [dayTransactions]);

  const exportBackup = () => {
    const dataStr = JSON.stringify({ transactions, customCategories }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `finanza_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.transactions && Array.isArray(json.transactions)) {
          setTransactions(json.transactions);
          if (json.customCategories) setCustomCategories(json.customCategories);
          alert('Backup restaurado com sucesso!');
          setIsSettingsOpen(false);
        }
      } catch (err) {
        alert('Erro ao ler o arquivo de backup. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
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
        hideSummary={activeTab === 'home'}
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
              
              <div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg flex items-center justify-between overflow-hidden relative">
                 <div className="relative z-10">
                    <p className="text-[8px] font-bold text-emerald-100 uppercase tracking-widest mb-1 opacity-80">Total de Entradas do Mês</p>
                    <h2 className="text-2xl font-black tracking-tight">{formatCurrency(stats.monthlyIncome)}</h2>
                 </div>
                 <i className="fa-solid fa-arrow-trend-up text-4xl text-emerald-400 opacity-40 relative z-10"></i>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
              </div>
            </div>

            <FinancialTips />

            <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-layer-group text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Fluxo do Mês</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Compromissos Pendentes</p>
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
        <div className="max-w-xl mx-auto flex items-center justify-between gap-1">
          {(Object.entries(TAB_COLORS) as [Tab, {active: string, icon: string, label: string}][]).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSelectedDay(null); setFocusedTransactionId(null); }}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300 ${
                activeTab === id ? `${cfg.active} shadow-sm translate-y-[-2px]` : 'text-slate-400 hover:text-slate-600'
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
                 <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Gerenciar Dados</h2>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-300 hover:text-slate-500">
                    <i className="fa-solid fa-xmark text-xl"></i>
                 </button>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês de Visualização</p>
                    <div className="grid grid-cols-2 gap-2">
                       <select value={viewingMonth} onChange={(e) => setViewingMonth(parseInt(e.target.value))} className="bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none">
                         {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                       </select>
                       <select value={viewingYear} onChange={(e) => setViewingYear(parseInt(e.target.value))} className="bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none">
                         {years.map(y => <option key={y} value={y}>{y}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-3">
                   <button onClick={exportBackup} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 py-4 rounded-2xl text-[10px] font-bold text-slate-700 uppercase tracking-widest hover:bg-slate-50 transition-all">
                      <i className="fa-solid fa-download"></i> Exportar Backup (JSON)
                   </button>
                   
                   <input type="file" accept=".json" ref={fileInputRef} onChange={importBackup} className="hidden" />
                   <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 py-4 rounded-2xl text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:bg-slate-50 transition-all">
                      <i className="fa-solid fa-upload"></i> Importar Backup (JSON)
                   </button>

                   <button onClick={() => { if(window.confirm('Isso apagará TUDO permanentemente. Tem certeza?')) { localStorage.clear(); window.location.reload(); } }} className="w-full text-[10px] font-bold text-rose-400 uppercase tracking-widest py-4 border-2 border-rose-50 rounded-2xl">Zerar Banco de Dados</button>
                 </div>
              </div>
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
