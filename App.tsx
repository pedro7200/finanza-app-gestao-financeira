
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, FinancialStats, Tab, UserAccount } from './types';
import { TransactionForm } from './components/TransactionForm';
import { FinancialCalendar } from './components/FinancialCalendar';
import { SummaryHeader } from './components/SummaryHeader';
import { AuthScreen } from './components/AuthScreen';
import { calculateFinances, formatCurrency, formatDate, getCategoryTotals } from './utils';

const App: React.FC = () => {
  // Estados de Autenticação
  const [account, setAccount] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('finanza_v8_acc');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Estados de Dados
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finanza_v8_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('finanza_v8_cats');
    return saved ? JSON.parse(saved) : ['Alimentação', 'Transporte', 'Lazer'];
  });

  // UI States
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [language, setLanguage] = useState<'pt' | 'en' | 'es' | 'fr'>('pt');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string | null>(null);

  // Estados para Troca de Senha nas Configurações
  const [securityMode, setSecurityMode] = useState<'view' | 'change_pass'>('view');
  const [oldPassInput, setOldPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [securityError, setSecurityError] = useState('');

  useEffect(() => {
    localStorage.setItem('finanza_v8_data', JSON.stringify(transactions));
    localStorage.setItem('finanza_v8_cats', JSON.stringify(customCategories));
    if (account) localStorage.setItem('finanza_v8_acc', JSON.stringify(account));
  }, [transactions, customCategories, account]);

  const stats = useMemo(() => calculateFinances(transactions), [transactions]);
  const categoryTotals = useMemo(() => getCategoryTotals(transactions), [transactions]);

  const handleAuthenticate = (newAcc: UserAccount) => {
    setAccount(newAcc);
    setIsAuthenticated(true);
  };

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

  const handlePassChange = () => {
    if (oldPassInput !== account?.passcode) {
      setSecurityError('Senha atual incorreta.');
      return;
    }
    if (newPassInput.length !== 6 || !/^\d+$/.test(newPassInput)) {
      setSecurityError('A nova senha deve ter 6 dígitos.');
      return;
    }
    setAccount(prev => prev ? { ...prev, passcode: newPassInput } : null);
    setSecurityMode('view');
    setOldPassInput('');
    setNewPassInput('');
    setSecurityError('');
    alert('Senha alterada com sucesso!');
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

  if (!isAuthenticated) {
    return (
      <AuthScreen 
        account={account} 
        onAuthenticate={handleAuthenticate} 
        onLogin={() => setIsAuthenticated(true)} 
      />
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.pastel} flex flex-col transition-all-colors duration-500`}>
      
      <SummaryHeader 
        onHand={stats.onHand} 
        projected={stats.projectedTotal} 
        futureExpenses={stats.futureExpenses} 
        onOpenSettings={() => { setIsSettingsOpen(true); setSecurityMode('view'); }}
        hideSummary={activeTab === 'home'}
      />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-4 mb-20">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="px-1 mt-2">
               <h1 className="text-3xl font-black tracking-tight text-slate-800">OLÁ, {account?.username.toUpperCase()}.</h1>
               <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Sua conta está segura</p>
            </header>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo Atual</p>
                  <h2 className={`text-xl font-bold tracking-tight ${stats.onHand >= 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                    {formatCurrency(stats.onHand)}
                  </h2>
               </div>
               <div className="bg-slate-800 p-6 rounded-xl text-white shadow-sm transition-all hover:shadow-md">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 opacity-70">Previsão Mensal</p>
                  <h2 className="text-xl font-bold tracking-tight">{formatCurrency(stats.projectedTotal)}</h2>
               </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                        <i className="fa-solid fa-chart-line text-sm"></i>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Saúde Financeira</p>
                        <p className="text-sm font-bold text-slate-700">{stats.healthScore.toFixed(0)}% <span className="text-[10px] font-normal text-slate-400">do planejado</span></p>
                    </div>
                </div>
                <div className="h-2 w-20 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div className="h-full bg-blue-400 transition-all duration-1000" style={{width: `${stats.healthScore}%`}}></div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <i className="fa-solid fa-lightbulb text-sm"></i>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Dica de Gestão</p>
                  <p className="text-xs font-bold text-slate-700">O Finanza protege seus dados localmente. Suas senhas nunca saem deste dispositivo.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}
              className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-xs shadow-lg hover:bg-slate-900 active:scale-[0.98] transition-all uppercase tracking-[0.15em] flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus-circle text-lg"></i> Novo Lançamento
            </button>
          </div>
        )}

        {/* ... Demais Abas seguem o padrão anterior ... */}
        {activeTab === 'extract' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-lg font-bold text-slate-700 tracking-tight">Extrato</h2>
              {filterDate && <button onClick={() => setFilterDate(null)} className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Limpar Filtro</button>}
            </div>
            <div className="space-y-2">
              {filteredExtract.map(t => (
                <div key={t.id} className="bg-white px-5 py-4 rounded-xl border border-slate-100 flex justify-between items-center group shadow-sm transition-all hover:border-emerald-200">
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
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(t)} className="text-slate-200 hover:text-blue-400 p-1"><i className="fa-solid fa-pen text-[10px]"></i></button>
                      <button onClick={() => handleDelete(t.id)} className="text-slate-100 hover:text-rose-400 p-1"><i className="fa-solid fa-trash text-[10px]"></i></button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredExtract.length === 0 && <p className="text-center py-12 text-slate-300 text-xs font-medium uppercase tracking-[0.2em]">Nenhum registro encontrado</p>}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="animate-in fade-in duration-500 space-y-4">
             <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm">
                <p className="text-[9px] font-bold text-yellow-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <i className="fa-solid fa-circle-info"></i> Visão de Fluxo
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">Visualize sua movimentação mensal através do calendário intuitivo.</p>
             </div>
             <FinancialCalendar transactions={transactions} onDateClick={(d) => { setFilterDate(d); setActiveTab('extract'); }} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-5 animate-in fade-in duration-500">
             <h2 className="text-lg font-bold text-slate-700 px-1">Análise de Gastos</h2>
             <div className="bg-white p-6 rounded-xl border border-slate-100 space-y-5 shadow-sm">
                {Object.entries(categoryTotals).length > 0 ? Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]).map(([cat, val]) => {
                  const perc = stats.monthlyExpenses > 0 ? (val / stats.monthlyExpenses) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                        <span className="text-[10px] font-bold text-purple-500">{perc.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div className={`h-full rounded-full transition-all duration-1000 ${cat === 'Desnecessário' ? 'bg-rose-300' : 'bg-purple-400'}`} style={{width: `${perc}%`}}></div>
                      </div>
                    </div>
                  );
                }) : <p className="text-center text-slate-300 py-8 text-xs font-medium uppercase tracking-widest">Aguardando dados</p>}
             </div>
          </div>
        )}

        {activeTab === 'fixed' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-lg font-bold text-slate-700 px-1">Custos Fixos</h2>
            <div className="space-y-2">
              {transactions.filter(t => t.isFixed).map(t => (
                <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm transition-all hover:border-rose-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 text-rose-400 rounded-lg flex items-center justify-center text-base">
                      <i className="fa-solid fa-sync"></i>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-700">{t.description}</p>
                      <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">Dia {t.fixedDay} • {t.recurrenceMonths === 0 ? 'Permanente' : `${t.recurrenceMonths} meses`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(t.amount)}</p>
                    <button onClick={() => handleDelete(t.id)} className="text-[9px] font-bold text-rose-300 hover:text-rose-500 uppercase tracking-widest mt-1">Remover</button>
                  </div>
                </div>
              ))}
              {transactions.filter(t => t.isFixed).length === 0 && <p className="text-center py-12 text-slate-300 text-xs font-medium uppercase tracking-widest">Nenhum custo fixo cadastrado</p>}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center z-40 px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        {(Object.keys(tabConfig) as Tab[]).map((tabId) => {
          const cfg = tabConfig[tabId];
          const isSelected = activeTab === tabId;
          return (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`flex-1 h-[80%] rounded-xl flex flex-col items-center justify-center gap-1 transition-all relative ${isSelected ? cfg.bg : 'bg-transparent opacity-40'}`}
            >
              <i className={`fa-solid ${cfg.icon} ${isSelected ? cfg.text : 'text-slate-500'} ${isSelected ? 'text-base' : 'text-sm'}`}></i>
              <span className={`text-[8px] font-bold uppercase tracking-wider ${isSelected ? cfg.text : 'text-slate-400'}`}>{cfg.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MODAL DE CONFIGURAÇÕES COM SEGURANÇA */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-2xl p-7 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-5">
                 <h2 className="text-xl font-bold text-slate-700 tracking-tight">Preferências</h2>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-300 hover:text-slate-500 p-1">
                    <i className="fa-solid fa-xmark text-xl"></i>
                 </button>
              </div>

              <div className="space-y-8">
                 {/* Seção Segurança */}
                 <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Segurança do App</p>
                    
                    {securityMode === 'view' ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Usuário</p>
                            <p className="text-sm font-bold text-slate-700">{account?.username}</p>
                          </div>
                          <button 
                            onClick={() => setSecurityMode('change_pass')}
                            className="text-[10px] font-bold text-blue-500 uppercase tracking-wider"
                          >
                            Alterar Senha
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div>
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Senha Atual</label>
                          <input 
                            type="password" maxLength={6} value={oldPassInput} onChange={(e) => setOldPassInput(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            placeholder="6 dígitos"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Nova Senha</label>
                          <input 
                            type="password" maxLength={6} value={newPassInput} onChange={(e) => setNewPassInput(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            placeholder="6 dígitos numéricos"
                          />
                        </div>
                        {securityError && <p className="text-[9px] font-bold text-rose-400 uppercase">{securityError}</p>}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSecurityMode('view')}
                            className="flex-1 py-2 text-[10px] font-bold text-slate-400 uppercase border border-slate-200 rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={handlePassChange}
                            className="flex-1 py-2 text-[10px] font-bold text-white uppercase bg-slate-800 rounded-lg"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Seção Idioma */}
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block">Idioma</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['pt', 'en', 'es', 'fr'].map(l => (
                         <button 
                           key={l} onClick={() => setLanguage(l as any)}
                           className={`flex items-center justify-between p-3.5 rounded-xl border text-[11px] font-bold transition-all ${language === l ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white border-slate-100 text-slate-400'}`}
                         >
                           {l === 'pt' ? 'Português 🇧🇷' : l === 'en' ? 'English 🇺🇸' : l === 'es' ? 'Español 🇪🇸' : 'Français 🇫🇷'}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-50 flex flex-col gap-3">
                    <button 
                      onClick={() => setIsAuthenticated(false)}
                      className="w-full text-[10px] font-bold text-slate-500 uppercase tracking-widest py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-right-from-bracket"></i> Sair do App
                    </button>
                    <button 
                      onClick={() => { if(window.confirm('APAGAR TUDO? Esta ação é irreversível.')) { setTransactions([]); setAccount(null); localStorage.clear(); window.location.reload(); } }}
                      className="w-full text-[10px] font-bold text-rose-400 uppercase tracking-widest py-3 border border-rose-100 rounded-xl hover:bg-rose-50 transition-all"
                    >
                      Resetar Aplicação
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
