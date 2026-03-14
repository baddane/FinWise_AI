import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Sparkles } from "lucide-react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { SpendingChart } from "@/components/Charts/SpendingChart";
import { CategoryPieChart } from "@/components/Charts/CategoryPieChart";
import { analysisApi } from "@/services/api";
import { MonthlyTrend, SpendingSummary } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) },
});

export default function AnalysisPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [spending, setSpending] = useState<SpendingSummary | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [insights, setInsights] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([analysisApi.getSpending(), analysisApi.getMonthlyTrends()])
      .then(([spendingData, trendsData]) => {
        setSpending(spendingData);
        setMonthlyTrends(trendsData);
      })
      .finally(() => setIsDataLoading(false));
  }, [isAuthenticated]);

  const handleLogout = () => { logout(); router.push("/login"); };

  const generateInsights = async () => {
    setIsInsightsLoading(true);
    try {
      const result = await analysisApi.getAiInsights();
      setInsights(result.insights);
    } finally {
      setIsInsightsLoading(false);
    }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-[260px] flex-1 p-8 max-w-[1200px]">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-surface-900">{t("analysis.title")}</h1>
          <p className="text-sm text-surface-400 mt-1">{t("analysis.subtitle")}</p>
        </div>

        {isDataLoading ? (
          <div className="card p-12 text-center text-surface-400 text-sm">{t("analysis.loadingData")}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 animate-slide-up">
              <SpendingChart data={monthlyTrends} />
              {spending?.by_category && Object.keys(spending.by_category).length > 0 && (
                <CategoryPieChart data={spending.by_category} />
              )}
            </div>

            <div className="card p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-surface-900">{t("analysis.aiInsights")}</h3>
                  <p className="text-xs text-surface-400 mt-0.5">{t("analysis.poweredByClaude")}</p>
                </div>
                <button onClick={generateInsights} disabled={isInsightsLoading} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50">
                  <Sparkles size={14} />
                  {isInsightsLoading ? t("analysis.analyzing") : t("analysis.generateInsights")}
                </button>
              </div>
              {insights ? (
                <div className="prose prose-sm max-w-none text-surface-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {insights}
                </div>
              ) : (
                <p className="text-surface-400 text-sm">{t("analysis.insightsPlaceholder")}</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
