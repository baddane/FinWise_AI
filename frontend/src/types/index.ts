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
