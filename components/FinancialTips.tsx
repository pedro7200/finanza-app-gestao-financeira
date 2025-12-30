
import React, { useState, useEffect } from 'react';

const TIPS = [
  "Pague-se primeiro: reserve uma quantia para poupar logo ao receber seu salário.",
  "Regra 50/30/20: 50% para necessidades, 30% para desejos e 20% para o seu futuro.",
  "Evite compras por impulso: espere 24 horas antes de fechar qualquer pedido online.",
  "Crie uma reserva de emergência para cobrir pelo menos 6 meses de seus gastos fixos.",
  "Revise suas assinaturas mensais: cancele serviços de streaming que você não usa mais.",
  "Diversifique seus investimentos para reduzir riscos e potencializar seus ganhos a longo prazo.",
  "Anote cada centavo: o controle rigoroso de pequenos gastos evita surpresas no fim do mês.",
  "Priorize o pagamento de dívidas com os juros mais altos para evitar o efeito bola de neve."
];

export const FinancialTips: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const newIndex = Math.floor(Math.random() * TIPS.length);
    setTipIndex(newIndex);

    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white text-slate-700 p-5 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden transition-all duration-500">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-lightbulb text-yellow-400 text-[10px]"></i>
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Dica de Especialista</h3>
        </div>
        
        <p className="text-[11px] font-medium leading-relaxed italic opacity-90 animate-in fade-in slide-in-from-left-2 duration-700">
          "{TIPS[tipIndex]}"
        </p>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -ml-12 -mb-12"></div>
    </div>
  );
};
