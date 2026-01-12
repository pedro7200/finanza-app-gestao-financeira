
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

export interface Saving {
  id: string;
  amount: number;
  date: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  amount: number;
  targetDate: string;
}

export interface FinancialStats {
  onHand: number;
  projectedTotal: number;
  futureExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  earnedSoFar: number;
  spentSoFar: number;
  forecastTotal: number;
  healthScore: number;
}

export type Tab = 'home' | 'extract' | 'calendar' | 'forecast' | 'analytics' | 'fixed' | 'savings' | 'wishlist';
