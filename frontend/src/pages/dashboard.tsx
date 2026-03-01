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
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-[260px] flex-1 p-8 max-w-[1200px]">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-sm text-surface-400 mt-1">Your financial overview at a glance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="animate-slide-up [animation-delay:0ms]">
            <StatCard
              title="Total Expenses"
              value={`$${spending?.total_expenses.toFixed(2) ?? "0.00"}`}
              icon={<TrendingDown size={18} />}
              changeType="negative"
            />
          </div>
          <div className="animate-slide-up [animation-delay:50ms]">
            <StatCard
              title="Transactions"
              value={String(spending?.transaction_count ?? 0)}
              icon={<DollarSign size={18} />}
            />
          </div>
          <div className="animate-slide-up [animation-delay:100ms]">
            <StatCard
              title="Active Budgets"
              value={String(budgets.length)}
              icon={<Wallet size={18} />}
            />
          </div>
          <div className="animate-slide-up [animation-delay:150ms]">
            <StatCard
              title="Over Budget"
              value={String(budgets.filter((b) => b.is_over_budget).length)}
              changeType="negative"
              icon={<TrendingUp size={18} />}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="animate-slide-up [animation-delay:200ms]">
            <SpendingChart data={[]} />
          </div>
          {spending?.by_category && Object.keys(spending.by_category).length > 0 && (
            <div className="animate-slide-up [animation-delay:250ms]">
              <CategoryPieChart data={spending.by_category} />
            </div>
          )}
        </div>

        {/* Budget Status */}
        {budgets.length > 0 && (
          <div className="card p-6 animate-slide-up [animation-delay:300ms]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-surface-900">Budget Status</h3>
              <p className="text-xs text-surface-400 mt-0.5">Track your spending limits</p>
            </div>
            <div className="divide-y divide-surface-100">
              {budgets.map((budget) => (
                <BudgetProgress key={budget.budget_id} budget={budget} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isDataLoading && !spending?.transaction_count && budgets.length === 0 && (
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-surface-800">No data yet</h3>
            <p className="text-sm text-surface-400 mt-1 max-w-sm mx-auto">
              Start by adding transactions and budgets to see your financial overview here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
