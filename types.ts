
export type TransactionType = 'INCOME' | 'EXPENSE' | 'PROSPECT_INCOME' | 'PROSPECT_EXPENSE';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO YYYY-MM-DD
  isFixed: boolean;
  fixedDay?: number;
  recurrenceMonths?: number; // 0 para indeterminado, ou número de meses
}

export interface UserAccount {
  username: string;
  passcode: string; // Senha numérica de 6 dígitos
}

export interface FinancialStats {
  onHand: number;
  projectedTotal: number;
  futureExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  healthScore: number;
}

export type Tab = 'home' | 'extract' | 'calendar' | 'analytics' | 'fixed';
