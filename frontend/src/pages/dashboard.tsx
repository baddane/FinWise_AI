import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DollarSign, TrendingDown, TrendingUp, Wallet, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/Layout/Sidebar";
import { StatCard } from "@/components/Dashboard/StatCard";
import { BudgetProgress } from "@/components/Dashboard/BudgetProgress";
import { SpendingChart } from "@/components/Charts/SpendingChart";
import { CategoryPieChart } from "@/components/Charts/CategoryPieChart";
import { analysisApi, ramseyApi } from "@/services/api";
import { Budget, MonthlyTrend, SpendingSummary, BabyStepsStatus } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) },
});

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [spending, setSpending] = useState<SpendingSummary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [babySteps, setBabySteps] = useState<BabyStepsStatus | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      analysisApi.getSpending(),
      analysisApi.getBudgets(),
      analysisApi.getMonthlyTrends(),
      ramseyApi.getStatus(),
    ])
      .then(([spendingData, budgetData, trendsData, stepsData]) => {
        setSpending(spendingData);
        setBudgets(budgetData);
        setMonthlyTrends(trendsData);
        setBabySteps(stepsData);
      })
      .finally(() => setIsDataLoading(false));
  }, [isAuthenticated]);

  const handleLogout = () => { logout(); router.push("/login"); };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-[260px] flex-1 p-8 max-w-[1200px]">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-surface-900">{t("dashboard.title")}</h1>
          <p className="text-sm text-surface-400 mt-1">{t("dashboard.subtitle")}</p>
        </div>

        {/* Baby Step banner */}
        {babySteps && (
          <Link href="/babysteps" className="block mb-6 animate-fade-in">
            <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div>
                <p className="text-brand-200 text-[11px] font-semibold uppercase tracking-wider">{t("ramsey.currentStep")}</p>
                <p className="text-white text-base font-bold mt-0.5">
                  {t("ramsey.step")} {babySteps.current_step} — {t(`ramsey.step${babySteps.current_step}Title`)}
                </p>
                <p className="text-brand-200 text-xs mt-0.5">{t(`ramsey.step${babySteps.current_step}Desc`)}</p>
              </div>
              <ChevronRight className="text-brand-200 flex-shrink-0" size={20} />
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="animate-slide-up [animation-delay:0ms]">
            <StatCard title={t("dashboard.totalExpenses")} value={`$${spending?.total_expenses.toFixed(2) ?? "0.00"}`} icon={<TrendingDown size={18} />} changeType="negative" />
          </div>
          <div className="animate-slide-up [animation-delay:50ms]">
            <StatCard title={t("dashboard.transactions")} value={String(spending?.transaction_count ?? 0)} icon={<DollarSign size={18} />} />
          </div>
          <div className="animate-slide-up [animation-delay:100ms]">
            <StatCard title={t("dashboard.activeBudgets")} value={String(budgets.length)} icon={<Wallet size={18} />} />
          </div>
          <div className="animate-slide-up [animation-delay:150ms]">
            <StatCard title={t("dashboard.overBudget")} value={String(budgets.filter((b) => b.is_over_budget).length)} changeType="negative" icon={<TrendingUp size={18} />} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="animate-slide-up [animation-delay:200ms]">
            <SpendingChart data={monthlyTrends} />
          </div>
          {spending?.by_category && Object.keys(spending.by_category).length > 0 && (
            <div className="animate-slide-up [animation-delay:250ms]">
              <CategoryPieChart data={spending.by_category} />
            </div>
          )}
        </div>

        {budgets.length > 0 && (
          <div className="card p-6 animate-slide-up [animation-delay:300ms]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-surface-900">{t("dashboard.budgetStatus")}</h3>
              <p className="text-xs text-surface-400 mt-0.5">{t("dashboard.trackSpending")}</p>
            </div>
            <div className="divide-y divide-surface-100">
              {budgets.map((budget) => <BudgetProgress key={budget.budget_id} budget={budget} />)}
            </div>
          </div>
        )}

        {!isDataLoading && !spending?.transaction_count && budgets.length === 0 && (
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-surface-800">{t("dashboard.noData")}</h3>
            <p className="text-sm text-surface-400 mt-1 max-w-sm mx-auto">{t("dashboard.noDataDescription")}</p>
          </div>
        )}
      </main>
    </div>
  );
}
