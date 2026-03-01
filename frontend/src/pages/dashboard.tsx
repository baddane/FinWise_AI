"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { StatCard } from "@/components/Dashboard/StatCard";
import { BudgetProgress } from "@/components/Dashboard/BudgetProgress";
import { SpendingChart } from "@/components/Charts/SpendingChart";
import { CategoryPieChart } from "@/components/Charts/CategoryPieChart";
import { analysisApi } from "@/services/api";
import { Budget, SpendingSummary } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [spending, setSpending] = useState<SpendingSummary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([analysisApi.getSpending(), analysisApi.getBudgets()])
      .then(([spendingData, budgetData]) => {
        setSpending(spendingData);
        setBudgets(budgetData);
      })
      .finally(() => setIsDataLoading(false));
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your financial overview</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Expenses"
            value={`$${spending?.total_expenses.toFixed(2) ?? "0.00"}`}
            icon={<TrendingDown size={20} />}
          />
          <StatCard
            title="Transactions"
            value={String(spending?.transaction_count ?? 0)}
            icon={<DollarSign size={20} />}
          />
          <StatCard
            title="Active Budgets"
            value={String(budgets.length)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            title="Over Budget"
            value={String(budgets.filter((b) => b.is_over_budget).length)}
            changeType="negative"
            icon={<TrendingUp size={20} />}
          />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <SpendingChart data={[]} />
          {spending?.by_category && Object.keys(spending.by_category).length > 0 && (
            <CategoryPieChart data={spending.by_category} />
          )}
        </div>

        {budgets.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Budget Status</h3>
            <div className="space-y-4">
              {budgets.map((budget) => (
                <BudgetProgress key={budget.budget_id} budget={budget} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
