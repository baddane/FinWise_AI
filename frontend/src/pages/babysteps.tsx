import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  CheckCircle2, Circle, ChevronRight, Plus, Trash2,
  TrendingDown, PiggyBank, Flame, Target,
} from "lucide-react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { ramseyApi } from "@/services/api";
import { BabyStepsStatus, Debt, SavingsGoal } from "@/types";
import { clsx } from "clsx";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) },
});

const STEP_ICONS = [PiggyBank, Flame, Target, TrendingDown, TrendingDown, TrendingDown, CheckCircle2];
const STEP_COLORS = [
  "text-amber-500 bg-amber-50 border-amber-200",
  "text-red-500 bg-red-50 border-red-200",
  "text-blue-500 bg-blue-50 border-blue-200",
  "text-emerald-500 bg-emerald-50 border-emerald-200",
  "text-purple-500 bg-purple-50 border-purple-200",
  "text-orange-500 bg-orange-50 border-orange-200",
  "text-brand-500 bg-brand-50 border-brand-200",
];

const DEBT_TYPES = ["credit_card", "student", "car", "medical", "personal", "mortgage", "other"];

export default function BabyStepsPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { isAuthenticated, isLoading, logout } = useAuth();

  const [status, setStatus] = useState<BabyStepsStatus | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // forms
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState<"bs1" | "bs3" | null>(null);
  const [debtForm, setDebtForm] = useState({ name: "", balance: "", minimum_payment: "", interest_rate: "", debt_type: "credit_card" });
  const [goalForm, setGoalForm] = useState({ current_amount: "", target_amount: "" });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  const load = () => {
    if (!isAuthenticated) return;
    Promise.all([ramseyApi.getStatus(), ramseyApi.listDebts(), ramseyApi.listGoals()])
      .then(([s, d, g]) => { setStatus(s); setDebts(d); setGoals(g); })
      .finally(() => setIsDataLoading(false));
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const handleLogout = () => { logout(); router.push("/login"); };

  const submitDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    await ramseyApi.createDebt({
      name: debtForm.name,
      balance: parseFloat(debtForm.balance),
      original_balance: parseFloat(debtForm.balance),
      minimum_payment: debtForm.minimum_payment ? parseFloat(debtForm.minimum_payment) : null,
      interest_rate: debtForm.interest_rate ? parseFloat(debtForm.interest_rate) : null,
      debt_type: debtForm.debt_type,
    });
    setDebtForm({ name: "", balance: "", minimum_payment: "", interest_rate: "", debt_type: "credit_card" });
    setShowDebtForm(false);
    setIsDataLoading(true);
    load();
  };

  const markDebtPaid = async (id: number) => {
    await ramseyApi.updateDebt(id, { is_paid_off: true });
    setIsDataLoading(true);
    load();
  };

  const deleteDebt = async (id: number) => {
    await ramseyApi.deleteDebt(id);
    setIsDataLoading(true);
    load();
  };

  const submitGoal = async (e: React.FormEvent, stepType: "bs1" | "bs3") => {
    e.preventDefault();
    const existing = goals.find(g => g.step_type === stepType);
    if (existing) {
      await ramseyApi.updateGoal(existing.id, { current_amount: parseFloat(goalForm.current_amount) });
    } else {
      await ramseyApi.createGoal({
        name: stepType === "bs1" ? t("ramsey.bs1Title") : t("ramsey.bs3Title"),
        step_type: stepType,
        target_amount: stepType === "bs1" ? 1000 : parseFloat(goalForm.target_amount || "0"),
        current_amount: parseFloat(goalForm.current_amount || "0"),
      });
    }
    setGoalForm({ current_amount: "", target_amount: "" });
    setShowGoalForm(null);
    setIsDataLoading(true);
    load();
  };

  const markStepDone = async (stepType: string) => {
    await ramseyApi.createGoal({ name: stepType, step_type: stepType, target_amount: 1, current_amount: 1 });
    await ramseyApi.updateGoal(
      (await ramseyApi.listGoals()).find(g => g.step_type === stepType)!.id,
      { is_completed: true }
    );
    setIsDataLoading(true);
    load();
  };

  if (isLoading || !isAuthenticated) return null;

  const currentStep = status?.current_step ?? 1;
  const activeDebts = debts.filter(d => !d.is_paid_off).sort((a, b) => (a.balance ?? 0) - (b.balance ?? 0));
  const bs1Goal = goals.find(g => g.step_type === "bs1");
  const bs3Goal = goals.find(g => g.step_type === "bs3");

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-[260px] flex-1 p-8 max-w-[900px]">

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-surface-900">{t("ramsey.title")}</h1>
          <p className="text-sm text-surface-400 mt-1">{t("ramsey.subtitle")}</p>
        </div>

        {isDataLoading ? (
          <div className="card p-12 text-center text-surface-400 text-sm">{t("ramsey.loading")}</div>
        ) : (
          <div className="space-y-4">

            {/* Steps list */}
            {status?.steps.map((step) => {
              const Icon = STEP_ICONS[step.step - 1];
              const colorClass = STEP_COLORS[step.step - 1];
              const isCurrent = step.step === currentStep;
              const isFuture = step.step > currentStep;

              return (
                <div
                  key={step.step}
                  className={clsx(
                    "card p-5 border-l-4 transition-all",
                    step.is_complete ? "border-l-emerald-400 opacity-70" : isCurrent ? "border-l-brand-500 shadow-md" : "border-l-surface-200"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Step number + icon */}
                    <div className={clsx("w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5", colorClass)}>
                      {step.is_complete ? <CheckCircle2 size={18} /> : isFuture ? <Circle size={18} /> : <Icon size={18} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-surface-400 uppercase tracking-wider">
                          {t("ramsey.step")} {step.step}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
                            {t("ramsey.current")}
                          </span>
                        )}
                        {step.is_complete && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ✓ {t("ramsey.done")}
                          </span>
                        )}
                      </div>
                      <h3 className={clsx("text-base font-bold mt-0.5", isFuture ? "text-surface-400" : "text-surface-900")}>
                        {t(`ramsey.step${step.step}Title`)}
                      </h3>
                      <p className="text-xs text-surface-400 mt-0.5">{t(`ramsey.step${step.step}Desc`)}</p>

                      {/* ── BS1 progress ── */}
                      {step.step === 1 && !step.is_complete && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="flex justify-between text-xs text-surface-500 mb-1">
                              <span>${bs1Goal?.current_amount?.toFixed(0) ?? "0"} {t("ramsey.saved")}</span>
                              <span>${step.target?.toFixed(0)} {t("ramsey.goal")}</span>
                            </div>
                            <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${step.progress_pct ?? 0}%` }} />
                            </div>
                            <p className="text-[11px] text-surface-400 mt-1">{step.progress_pct ?? 0}% {t("ramsey.complete")}</p>
                          </div>
                          <button onClick={() => { setGoalForm({ current_amount: String(bs1Goal?.current_amount ?? ""), target_amount: "1000" }); setShowGoalForm("bs1"); }}
                            className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
                            <Plus size={12} /> {t("ramsey.updateSavings")}
                          </button>
                          {showGoalForm === "bs1" && (
                            <form onSubmit={(e) => submitGoal(e, "bs1")} className="flex gap-2 items-end mt-2">
                              <div>
                                <label className="block text-[11px] text-surface-500 mb-1">{t("ramsey.currentSaved")}</label>
                                <input type="number" min="0" step="0.01" value={goalForm.current_amount}
                                  onChange={e => setGoalForm(f => ({ ...f, current_amount: e.target.value }))}
                                  className="input w-32 text-sm py-1.5" required />
                              </div>
                              <button type="submit" className="btn-primary px-3 py-1.5 text-xs">{t("ramsey.save")}</button>
                              <button type="button" onClick={() => setShowGoalForm(null)} className="text-xs text-surface-400 hover:text-surface-600">{t("ramsey.cancel")}</button>
                            </form>
                          )}
                        </div>
                      )}

                      {/* ── BS2 debt snowball ── */}
                      {step.step === 2 && isCurrent && (
                        <div className="mt-4 space-y-3">
                          {step.snowball_target && (
                            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                              <p className="text-xs font-semibold text-red-700">{t("ramsey.attackNext")}</p>
                              <p className="text-sm font-bold text-red-800 mt-0.5">
                                {step.snowball_target.name} — ${step.snowball_target.balance.toFixed(2)}
                              </p>
                            </div>
                          )}
                          <div className="space-y-2">
                            {activeDebts.map((debt, idx) => (
                              <div key={debt.id} className="flex items-center justify-between bg-surface-50 rounded-xl px-3 py-2.5 border border-surface-100">
                                <div className="flex items-center gap-3">
                                  <span className={clsx("w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                                    idx === 0 ? "bg-red-100 text-red-600" : "bg-surface-200 text-surface-500")}>
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-surface-800">{debt.name}</p>
                                    <p className="text-[11px] text-surface-400">
                                      {debt.interest_rate ? `${debt.interest_rate}% • ` : ""}{t(`ramsey.dtype_${debt.debt_type}`)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-red-600">${debt.balance.toFixed(2)}</span>
                                  <button onClick={() => markDebtPaid(debt.id)} className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold border border-emerald-200 rounded-lg px-2 py-0.5">
                                    ✓ {t("ramsey.paid")}
                                  </button>
                                  <button onClick={() => deleteDebt(debt.id)} className="text-surface-300 hover:text-red-400">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => setShowDebtForm(!showDebtForm)} className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1 mt-1">
                            <Plus size={12} /> {t("ramsey.addDebt")}
                          </button>
                          {showDebtForm && (
                            <form onSubmit={submitDebt} className="grid grid-cols-2 gap-3 mt-2 p-4 bg-surface-50 rounded-xl border border-surface-100">
                              <div className="col-span-2">
                                <label className="block text-[11px] text-surface-500 mb-1">{t("ramsey.debtName")}</label>
                                <input type="text" value={debtForm.name} onChange={e => setDebtForm(f => ({ ...f, name: e.target.value }))} className="input w-full text-sm py-1.5" required placeholder="Visa, Prêt auto..." />
                              </div>
                              <div>
                                <label className="block text-[11px] text-surface-500 mb-1">{t("ramsey.balance")}</label>
                                <input type="number" min="0" step="0.01" value={debtForm.balance} onChange={e => setDebtForm(f => ({ ...f, balance: e.target.value }))} className="input w-full text-sm py-1.5" required />
                              </div>
                              <div>
                                <label className="block text-[11px] text-surface-500 mb-1">{t("ramsey.minPayment")}</label>
                                <input type="number" min="0" step="0.01" value={debtForm.minimum_payment} onChange={e => setDebtForm(f => ({ ...f, minimum_payment: e.target.value }))} className="input w-full text-sm py-1.5" />
                              </div>
                              <div>
                                <label className="block text-[11px] text-surface-500 mb-1">{t("ramsey.interestRate")}</label>
                                <input type="number" min="0" step="0.01" value={debtForm.interest_rate} onChange={e => setDebtForm(f => ({ ...f, interest_rate: e.target.value }))} className="input w-full text-sm py-1.5" placeholder="%" />
                              </div>
                              <div>
                                <label className="block text-[11px] text-surface-500 mb-1">{t("ramsey.type")}</label>
                                <select value={debtForm.debt_type} onChange={e => setDebtForm(f => ({ ...f, debt_type: e.target.value }))} className="input w-full text-sm py-1.5">
                                  {DEBT_TYPES.map(dt => <option key={dt} value={dt}>{t(`ramsey.dtype_${dt}`)}</option>)}
                                </select>
                              </div>
                              <div className="col-span-2 flex gap-2">
                                <button type="submit" className="btn-primary px-4 py-1.5 text-xs">{t("ramsey.addDebtBtn")}</button>
                                <button type="button" onClick={() => setShowDebtForm(false)} className="text-xs text-surface-400 hover:text-surface-600">{t("ramsey.cancel")}</button>
                              </div>
                            </form>
                          )}
                          {activeDebts.length === 0 && !showDebtForm && (
                            <p className="text-xs text-surface-400 italic">{t("ramsey.noDebts")}</p>
                          )}
                        </div>
                      )}

                      {/* ── BS3 progress ── */}
                      {step.step === 3 && isCurrent && (
                        <div className="mt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="bg-surface-50 rounded-xl p-3 border border-surface-100">
                              <p className="text-[11px] text-surface-400">{t("ramsey.target3m")}</p>
                              <p className="text-base font-bold text-surface-800">${step.target_3months?.toFixed(0)}</p>
                            </div>
                            <div className="bg-surface-50 rounded-xl p-3 border border-surface-100">
                              <p className="text-[11px] text-surface-400">{t("ramsey.target6m")}</p>
                              <p className="text-base font-bold text-surface-800">${step.target_6months?.toFixed(0)}</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-surface-500 mb-1">
                              <span>${bs3Goal?.current_amount?.toFixed(0) ?? "0"} {t("ramsey.saved")}</span>
                              <span>${bs3Goal?.target_amount?.toFixed(0) ?? step.target_3months?.toFixed(0)} {t("ramsey.goal")}</span>
                            </div>
                            <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${step.progress_pct ?? 0}%` }} />
                            </div>
                            <p className="text-[11px] text-surface-400 mt-1">{step.progress_pct ?? 0}% {t("ramsey.complete")}</p>
                          </div>
                          <button onClick={() => { setGoalForm({ current_amount: String(bs3Goal?.current_amount ?? ""), target_amount: String(step.target_3months ?? "") }); setShowGoalForm("bs3"); }}
                            className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
                            <Plus size={12} /> {t("ramsey.updateSavings")}
                          </button>
                          {showGoalForm === "bs3" && (
                            <form onSubmit={(e) => submitGoal(e, "bs3")} className="flex gap-2 items-end mt-2">
                              <div>
                                <label className="block text-[11px] text-surface-500 mb-1">{t("ramsey.currentSaved")}</label>
                                <input type="number" min="0" step="0.01" value={goalForm.current_amount}
                                  onChange={e => setGoalForm(f => ({ ...f, current_amount: e.target.value }))}
                                  className="input w-32 text-sm py-1.5" required />
                              </div>
                              <div>
                                <label className="block text-[11px] text-surface-500 mb-1">{t("ramsey.targetAmt")}</label>
                                <input type="number" min="0" step="1" value={goalForm.target_amount}
                                  onChange={e => setGoalForm(f => ({ ...f, target_amount: e.target.value }))}
                                  className="input w-32 text-sm py-1.5" required />
                              </div>
                              <button type="submit" className="btn-primary px-3 py-1.5 text-xs">{t("ramsey.save")}</button>
                              <button type="button" onClick={() => setShowGoalForm(null)} className="text-xs text-surface-400 hover:text-surface-600">{t("ramsey.cancel")}</button>
                            </form>
                          )}
                        </div>
                      )}

                      {/* ── BS4-7 : manual confirm ── */}
                      {step.step >= 4 && isCurrent && !step.is_complete && (
                        <button onClick={() => markStepDone(`bs${step.step}`)}
                          className="mt-3 text-xs text-emerald-600 font-semibold border border-emerald-200 rounded-xl px-3 py-1.5 hover:bg-emerald-50 transition-colors flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> {t("ramsey.markDone")}
                        </button>
                      )}
                    </div>

                    {/* Chevron for future steps */}
                    {isFuture && <ChevronRight size={16} className="text-surface-300 flex-shrink-0 mt-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
