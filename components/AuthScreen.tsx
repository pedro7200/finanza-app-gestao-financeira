
import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';

interface AuthScreenProps {
  account: UserAccount | null;
  onAuthenticate: (account: UserAccount) => void;
  onLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ account, onAuthenticate, onLogin }) => {
  const [isCreating, setIsCreating] = useState(!account);
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleKeyPress = (num: string) => {
    if (passcode.length < 6) {
      setPasscode(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!isCreating && passcode.length === 6) {
      if (account && passcode === account.passcode) {
        onLogin();
      } else {
        setError('Senha incorreta. Tente novamente.');
        setTimeout(() => setPasscode(''), 500);
      }
    }
  }, [passcode, isCreating, account, onLogin]);

  const handleCreateAccount = () => {
    if (username.trim().length < 2) {
      setError('O nome deve ter pelo menos 2 caracteres.');
      return;
    }
    if (passcode.length !== 6) {
      setError('A senha deve ter exatamente 6 dígitos.');
      return;
    }
    onAuthenticate({ username, passcode });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-white mb-4 mx-auto shadow-lg">
            <i className="fa-solid fa-vault text-2xl"></i>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">FINANZA.</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Sua Fortaleza Financeira</p>
        </div>

        {isCreating ? (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-4">
              <h2 className="text-sm font-bold text-slate-600">Criar sua Conta</h2>
              <p className="text-[10px] text-slate-400">Defina seu acesso pessoal</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Seu Nome</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                  placeholder="Como quer ser chamado?"
                />
              </div>

              <div>
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Senha (6 Dígitos)</label>
                <div className="flex justify-between gap-2 mb-6">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-10 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${passcode.length > i ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-100 bg-slate-50 text-slate-300'}`}
                    >
                      {passcode[i] ? '•' : ''}
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-[10px] font-bold text-rose-400 text-center uppercase tracking-wider">{error}</p>}

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((val, i) => (
                  <button
                    key={i}
                    onClick={() => val === 'del' ? handleBackspace() : val !== '' && handleKeyPress(val.toString())}
                    className={`h-14 rounded-xl flex items-center justify-center font-bold text-lg transition-all active:scale-95 ${val === '' ? 'invisible' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                  >
                    {val === 'del' ? <i className="fa-solid fa-delete-left text-sm"></i> : val}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleCreateAccount}
                disabled={passcode.length !== 6 || !username}
                className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all ${passcode.length === 6 && username ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-slate-100 text-slate-300'}`}
              >
                Configurar Acesso
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h2 className="text-sm font-bold text-slate-600">Olá, {account?.username}</h2>
              <p className="text-[10px] text-slate-400">Insira sua senha para entrar</p>
            </div>

            <div className="flex justify-center gap-3 mb-4">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${passcode.length > i ? 'bg-slate-800 scale-125' : 'bg-slate-100'}`}
                />
              ))}
            </div>

            {error && <p className="text-[9px] font-bold text-rose-400 text-center uppercase tracking-wider h-4">{error}</p>}

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((val, i) => (
                <button
                  key={i}
                  onClick={() => val === 'del' ? handleBackspace() : val !== '' && handleKeyPress(val.toString())}
                  className={`h-16 rounded-2xl flex items-center justify-center font-bold text-xl transition-all active:scale-90 ${val === '' ? 'invisible' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                >
                  {val === 'del' ? <i className="fa-solid fa-delete-left text-sm"></i> : val}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
