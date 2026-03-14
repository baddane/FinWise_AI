export interface User {
  id: number;
  email: string;
  full_name: string | null;
}

export interface Transaction {
  id: number;
  amount: number;
  type: "income" | "expense";
  description: string | null;
  merchant: string | null;
  category_id: number | null;
  date: string;
  created_at: string;
}

export interface Budget {
  budget_id: number;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage_used: number;
  period: string;
  is_over_budget: boolean;
}

export interface SpendingSummary {
  total_expenses: number;
  transaction_count: number;
  by_category: Record<string, number>;
  period: {
    start: string | null;
    end: string | null;
  };
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface Debt {
  id: number;
  name: string;
  balance: number;
  original_balance: number | null;
  minimum_payment: number | null;
  interest_rate: number | null;
  debt_type: string;
  is_paid_off: boolean;
  snowball_order: number | null;
}

export interface SavingsGoal {
  id: number;
  name: string;
  step_type: string;
  target_amount: number;
  current_amount: number;
  is_completed: boolean;
  progress_pct: number;
}

export interface BabyStepDetail {
  step: number;
  title: string;
  description: string;
  is_complete: boolean;
  // BS1
  target?: number;
  current?: number;
  progress_pct?: number;
  // BS2
  total_debt?: number;
  debts_remaining?: number;
  snowball_target?: { id: number; name: string; balance: number } | null;
  // BS3
  target_3months?: number;
  target_6months?: number;
}

export interface BabyStepsStatus {
  current_step: number;
  monthly_expenses_avg: number;
  steps: BabyStepDetail[];
}
