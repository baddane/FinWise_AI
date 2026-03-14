import axios from "axios";
import { AuthTokens, Transaction, Budget, SpendingSummary, MonthlyTrend, ChatMessage, Debt, SavingsGoal, BabyStepsStatus } from "@/types";

const api = axios.create({
  baseURL: "",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (email: string, password: string, full_name?: string) => {
    const { data } = await api.post("/api/auth/register", { email, password, full_name });
    return data;
  },
  login: async (email: string, password: string): Promise<AuthTokens> => {
    const formData = new URLSearchParams({ username: email, password });
    const { data } = await api.post("/api/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data;
  },
};

export const transactionsApi = {
  list: async (params?: { skip?: number; limit?: number; type?: string }): Promise<Transaction[]> => {
    const { data } = await api.get("/api/transactions", { params });
    return data;
  },
  create: async (transaction: Omit<Transaction, "id" | "created_at">): Promise<Transaction> => {
    const { data } = await api.post("/api/transactions", transaction);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/transactions/${id}`);
  },
};

export const analysisApi = {
  getSpending: async (start_date?: string, end_date?: string): Promise<SpendingSummary> => {
    const { data } = await api.get("/api/analysis/spending", {
      params: { start_date, end_date },
    });
    return data;
  },
  getBudgets: async (): Promise<Budget[]> => {
    const { data } = await api.get("/api/analysis/budgets");
    return data;
  },
  getMonthlyTrends: async (months = 6): Promise<MonthlyTrend[]> => {
    const { data } = await api.get("/api/analysis/monthly-trends", { params: { months } });
    return data;
  },
  getAiInsights: async (): Promise<{ insights: string }> => {
    const { data } = await api.post("/api/analysis/ai-insights");
    return data;
  },
};

export const ramseyApi = {
  getStatus: async (): Promise<BabyStepsStatus> => {
    const { data } = await api.get("/api/ramsey/status");
    return data;
  },
  // Debts
  listDebts: async (): Promise<Debt[]> => {
    const { data } = await api.get("/api/ramsey/debts");
    return data;
  },
  createDebt: async (debt: Omit<Debt, "id" | "is_paid_off" | "snowball_order">): Promise<Debt> => {
    const { data } = await api.post("/api/ramsey/debts", debt);
    return data;
  },
  updateDebt: async (id: number, patch: Partial<Debt>): Promise<Debt> => {
    const { data } = await api.patch(`/api/ramsey/debts/${id}`, patch);
    return data;
  },
  deleteDebt: async (id: number): Promise<void> => {
    await api.delete(`/api/ramsey/debts/${id}`);
  },
  // Savings Goals
  listGoals: async (): Promise<SavingsGoal[]> => {
    const { data } = await api.get("/api/ramsey/goals");
    return data;
  },
  createGoal: async (goal: Omit<SavingsGoal, "id" | "is_completed" | "progress_pct">): Promise<SavingsGoal> => {
    const { data } = await api.post("/api/ramsey/goals", goal);
    return data;
  },
  updateGoal: async (id: number, patch: Partial<SavingsGoal>): Promise<SavingsGoal> => {
    const { data } = await api.patch(`/api/ramsey/goals/${id}`, patch);
    return data;
  },
  deleteGoal: async (id: number): Promise<void> => {
    await api.delete(`/api/ramsey/goals/${id}`);
  },
};

export const chatApi = {
  sendMessage: async (
    message: string,
    conversation_history: ChatMessage[]
  ): Promise<{ response: string; conversation_history: ChatMessage[] }> => {
    const { data } = await api.post("/api/chat", { message, conversation_history });
    return data;
  },
};

export default api;
