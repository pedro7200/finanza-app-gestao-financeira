
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

interface GeminiAdvisorProps {
  transactions: Transaction[];
  onHand: number;
  projected: number;
}

export const GeminiAdvisor: React.FC<GeminiAdvisorProps> = ({ transactions, onHand, projected }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      // Fix: Ensure initialization uses the object literal format as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const expenseSummary = transactions
        .filter(t => t.type === 'EXPENSE' || t.type === 'PROSPECT_EXPENSE')
        .reduce((acc: any, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});

      const prompt = `Atue como consultor financeiro executivo. Analise e dê 2 dicas curtas, precisas e profissionais em português-BR.
        Saldo hoje: R$ ${onHand}
        Saldo estimado final do mês: R$ ${projected}
        Gastos por categoria: ${JSON.stringify(expenseSummary)}
        Seja direto. Máximo 150 caracteres.`;

      // Fix: Use ai.models.generateContent directly
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // Fix: Ensure accessing the .text property (not a method) correctly
      setAdvice(response.text || 'Mantenha o rigor no controle de custos fixos.');
    } catch (error) {
      console.error('Error fetching AI advice:', error);
      setAdvice('Dica: Revise seus custos variáveis e priorize a reserva de liquidez.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchAdvice();
    }, 2000);
    return () => clearTimeout(timer);
  }, [transactions.length, onHand, projected]);

  return (
    <div className="bg-slate-800 text-slate-100 p-5 rounded border border-slate-700 shadow relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-microchip text-blue-400 text-[10px]"></i>
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Análise Preditiva IA</h3>
        </div>
        
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-2 bg-slate-700 rounded w-3/4"></div>
            <div className="h-2 bg-slate-700 rounded w-1/2"></div>
          </div>
        ) : (
          <p className="text-[10px] font-medium leading-relaxed italic opacity-90">
            "{advice || 'Aguardando lançamentos para processar insights...'}"
          </p>
        )}
      </div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12"></div>
    </div>
  );
};
