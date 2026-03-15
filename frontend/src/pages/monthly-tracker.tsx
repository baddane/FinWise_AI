import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { Plus, Trash2, TrendingDown, ArrowUpCircle, ArrowDownCircle, Receipt, CalendarDays } from "lucide-react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { transactionsApi, profileApi } from "@/services/api";
import { Transaction } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) },
});

export default function MonthlyTrackerPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { isAuthenticated, isLoading, logout } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState("");
  const [profileBudget, setProfileBudget] = useState<number | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const descRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const monthLabel = format(now, "MMMM yyyy", { locale: router.locale === "fr" ? fr : undefined });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  const loadData = () => {
    if (!isAuthenticated) return;
    Promise.all([
      transactionsApi.list({ limit: 500, start_date: monthStart, end_date: monthEnd }),
      profileApi.get(),
    ]).then(([txs, profile]) => {
      setTransactions(txs);
      if (profile?.currency) setCurrency(profile.currency);
      if (profile) {
        const custom = (profile.custom_charges || []).reduce((s: number, c: { amount: number }) => s + (c.amount || 0), 0);
        const total = [
          profile.housing_amount,
          profile.food_budget,
          profile.transport_budget,
          profile.utilities_budget,
        ].reduce((s: number, v: number | null) => s + (v || 0), 0) + custom;
        if (total > 0) setProfileBudget(total);
      }
    }).finally(() => setIsDataLoading(false));
  };

  useEffect(() => { loadData(); }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) {
      setError(t("tracker.invalidEntry"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await transactionsApi.create({
        amount: amt,
        type,
        description: description.trim(),
        merchant: null,
        category_id: null,
        date: new Date().toISOString(),
      });
      setDescription("");
      setAmount("");
      descRef.current?.focus();
      loadData();
    } catch {
      setError(t("tracker.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await transactionsApi.delete(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const expenses = transactions.filter((t) => t.type === "expense");
  const incomes = transactions.filter((t) => t.type === "income");
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
  const budgetUsed = profileBudget ? (totalExpenses / profileBudget) * 100 : null;

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-surface-50">
      <Sidebar onLogout={() => { logout(); router.push("/login"); }} />
      <main className="flex-1 ml-[260px] overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-surface-900">{t("tracker.title")}</h1>
              <p className="text-surface-500 mt-1 flex items-center gap-1.5 text-sm">
                <CalendarDays size={14} />
                <span className="capitalize">{monthLabel}</span>
              </p>
            </div>
          </div>

          {/* Summary cards */}
          {!isDataLoading && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
                <p className="text-xs text-surface-400 font-medium uppercase tracking-wide">{t("tracker.totalExpenses")}</p>
                <p className="text-xl font-bold text-red-500 mt-1">
                  {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {currency && <span className="text-sm font-normal ml-1">{currency}</span>}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
                <p className="text-xs text-surface-400 font-medium uppercase tracking-wide">{t("tracker.totalIncome")}</p>
                <p className="text-xl font-bold text-green-600 mt-1">
                  {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {currency && <span className="text-sm font-normal ml-1">{currency}</span>}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
                {profileBudget ? (
                  <>
                    <p className="text-xs text-surface-400 font-medium uppercase tracking-wide">{t("tracker.budgetUsed")}</p>
                    <p className={`text-xl font-bold mt-1 ${(budgetUsed ?? 0) > 100 ? "text-red-500" : (budgetUsed ?? 0) > 80 ? "text-amber-500" : "text-green-600"}`}>
                      {budgetUsed?.toFixed(0)}%
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      / {profileBudget.toLocaleString()} {currency}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-surface-400 font-medium uppercase tracking-wide">{t("tracker.net")}</p>
                    <p className={`text-xl font-bold mt-1 ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {(totalIncome - totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {currency && <span className="text-sm font-normal ml-1">{currency}</span>}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Budget bar */}
          {!isDataLoading && profileBudget && (
            <div className="bg-white rounded-xl border border-surface-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-surface-600">{t("tracker.budgetProgress")}</p>
                <p className="text-xs text-surface-400">
                  {totalExpenses.toFixed(0)} / {profileBudget.toLocaleString()} {currency}
                </p>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${(budgetUsed ?? 0) > 100 ? "bg-red-500" : (budgetUsed ?? 0) > 80 ? "bg-amber-400" : "bg-green-500"}`}
                  style={{ width: `${Math.min(budgetUsed ?? 0, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Add entry form */}
          <div className="bg-white rounded-2xl border border-surface-200 p-5">
            <p className="text-sm font-semibold text-surface-800 mb-4">{t("tracker.addEntry")}</p>
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Type toggle */}
              <div className="flex rounded-lg border border-surface-200 overflow-hidden flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${type === "expense" ? "bg-red-50 text-red-600" : "text-surface-400 hover:bg-surface-50"}`}
                >
                  <ArrowDownCircle size={13} />
                  {t("tracker.expense")}
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${type === "income" ? "bg-green-50 text-green-600" : "text-surface-400 hover:bg-surface-50"}`}
                >
                  <ArrowUpCircle size={13} />
                  {t("tracker.income")}
                </button>
              </div>

              {/* Description */}
              <input
                ref={descRef}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("tracker.descriptionPlaceholder")}
                className="flex-1 min-w-0 border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />

              {/* Amount */}
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("tracker.amountPlaceholder")}
                className="w-32 flex-shrink-0 border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />

              {/* Add button */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50 flex-shrink-0"
              >
                <Plus size={15} />
                {saving ? t("tracker.adding") : t("tracker.add")}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          {/* Transactions list */}
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
              <Receipt size={15} className="text-surface-400" />
              <p className="text-sm font-semibold text-surface-800">
                {t("tracker.entries")}
                <span className="ml-2 text-xs font-normal text-surface-400">
                  ({transactions.length} {t("tracker.entriesCount")})
                </span>
              </p>
            </div>

            {isDataLoading ? (
              <div className="p-8 text-center text-surface-400 text-sm">{t("tracker.loading")}</div>
            ) : transactions.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-50 flex items-center justify-center mx-auto mb-3">
                  <TrendingDown size={20} className="text-surface-300" />
                </div>
                <p className="text-surface-400 text-sm">{t("tracker.empty")}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("tracker.colType")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("tracker.colDescription")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("tracker.colDate")}</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("tracker.colAmount")}</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-50/50 transition-colors group">
                      <td className="px-5 py-3.5">
                        {tx.type === "expense" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <ArrowDownCircle size={11} /> {t("tracker.expense")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <ArrowUpCircle size={11} /> {t("tracker.income")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-surface-700">
                        {tx.description || <span className="text-surface-300 italic">{t("tracker.noDescription")}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-surface-400">
                        {format(new Date(tx.date), "dd MMM", { locale: router.locale === "fr" ? fr : undefined })}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-semibold tabular-nums text-sm ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                        {tx.type === "income" ? "+" : "−"}
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {currency && <span className="ml-1 text-xs font-normal text-surface-400">{currency}</span>}
                      </td>
                      <td className="px-3 py-3.5">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
