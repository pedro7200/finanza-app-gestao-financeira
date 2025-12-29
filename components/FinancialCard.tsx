
import React from 'react';
import { formatCurrency } from '../utils';

interface FinancialCardProps {
  title: string;
  value: number;
  icon: string;
  colorClass: string;
  description?: string;
}

export const FinancialCard: React.FC<FinancialCardProps> = ({ title, value, icon, colorClass, description }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-xl ${colorClass} text-white`}>
        <i className={`fa-solid ${icon} text-xl`}></i>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${value < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
          {formatCurrency(value)}
        </h3>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
    </div>
  );
};
