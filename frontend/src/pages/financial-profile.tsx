import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User, MapPin, Home, Users, Wallet, Loader2, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { profileApi } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

interface CustomCharge {
  name: string;
  amount: number;
}

interface ProfileForm {
  salary: number;
  currency: string;
  employment_type: string;
  country: string;
  city: string;
  num_children: number;
  housing_type: string;
  housing_amount: number;
  food_budget: number;
  transport_budget: number;
  utilities_budget: number;
  other_charges: number;
}

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "MAD", "XOF", "DZD", "TND", "CHF", "XAF", "CFA"];
const EMPLOYMENT_TYPES = ["employed", "freelance", "business_owner", "retired", "student", "other"];

export default function FinancialProfilePage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { logout } = useAuth();

  const [saving, setSaving] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customCharges, setCustomCharges] = useState<CustomCharge[]>([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      currency: "USD",
      num_children: 0,
      housing_type: "rent",
      employment_type: "employed",
    },
  });

  const salary = watch("salary") || 0;
  const housingAmt = watch("housing_amount") || 0;
  const food = watch("food_budget") || 0;
  const transport = watch("transport_budget") || 0;
  const utilities = watch("utilities_budget") || 0;
  const other = watch("other_charges") || 0;
  const customTotal = customCharges.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const totalCharges = Number(housingAmt) + Number(food) + Number(transport) + Number(utilities) + Number(other) + customTotal;
  const disposable = Number(salary) - totalCharges;

  useEffect(() => {
    profileApi.get().then((data) => {
      if (data) {
        const { custom_charges, ...rest } = data as ProfileForm & { custom_charges?: CustomCharge[] };
        reset(rest as ProfileForm);
        if (custom_charges) setCustomCharges(custom_charges);
      }
    }).catch(() => {});
  }, [reset]);

  const onSave = async (values: ProfileForm) => {
    setSaving(true);
    setError(null);
    try {
      await profileApi.upsert({ ...values, custom_charges: customCharges });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    setError(null);
    setAdvice(null);
    try {
      const lang = router.locale ?? "en";
      const { advice: text } = await profileApi.getAdvice(lang);
      setAdvice(text);
    } catch {
      setError(t("profile.adviceError"));
    } finally {
      setLoadingAdvice(false);
    }
  };

  const addCustomCharge = () => {
    setCustomCharges([...customCharges, { name: "", amount: 0 }]);
  };

  const updateCustomCharge = (idx: number, field: keyof CustomCharge, value: string | number) => {
    setCustomCharges(customCharges.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const removeCustomCharge = (idx: number) => {
    setCustomCharges(customCharges.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex h-screen bg-surface-50">
      <Sidebar onLogout={logout} />
      <main className="flex-1 ml-[260px] overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{t("profile.title")}</h1>
            <p className="text-surface-500 mt-1">{t("profile.subtitle")}</p>
          </div>

          {/* Live Summary Bar */}
          {salary > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
                <p className="text-xs text-surface-400 font-medium uppercase tracking-wide">{t("profile.totalCharges")}</p>
                <p className="text-xl font-bold text-red-500 mt-1">{totalCharges.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
                <p className="text-xs text-surface-400 font-medium uppercase tracking-wide">{t("profile.disposable")}</p>
                <p className={`text-xl font-bold mt-1 ${disposable >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {disposable.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
                <p className="text-xs text-surface-400 font-medium uppercase tracking-wide">{t("profile.savingsRate")}</p>
                <p className={`text-xl font-bold mt-1 ${(disposable / salary) >= 0.2 ? "text-green-600" : "text-amber-500"}`}>
                  {salary > 0 ? `${((disposable / salary) * 100).toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSave)} className="space-y-6">
            {/* Income & Employment */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={18} className="text-brand-600" />
                <h2 className="font-semibold text-surface-800">{t("profile.incomeSection")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.salary")} *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("salary", { required: true, min: 0 })}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="3000"
                  />
                  {errors.salary && <p className="text-red-500 text-xs mt-1">{t("profile.fieldRequired")}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.currency")} *</label>
                  <div className="relative">
                    <select
                      {...register("currency", { required: true })}
                      className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-surface-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.employmentType")}</label>
                  <div className="relative">
                    <select
                      {...register("employment_type")}
                      className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      {EMPLOYMENT_TYPES.map((e) => (
                        <option key={e} value={e}>{t(`profile.emp_${e}`)}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-surface-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={18} className="text-brand-600" />
                <h2 className="font-semibold text-surface-800">{t("profile.locationSection")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.country")}</label>
                  <input
                    {...register("country")}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder={t("profile.countryPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.city")}</label>
                  <input
                    {...register("city")}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder={t("profile.cityPlaceholder")}
                  />
                </div>
              </div>
            </section>

            {/* Family */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-brand-600" />
                <h2 className="font-semibold text-surface-800">{t("profile.familySection")}</h2>
              </div>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.numChildren")}</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  {...register("num_children", { min: 0 })}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </section>

            {/* Housing */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Home size={18} className="text-brand-600" />
                <h2 className="font-semibold text-surface-800">{t("profile.housingSection")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.housingType")}</label>
                  <div className="relative">
                    <select
                      {...register("housing_type")}
                      className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      <option value="rent">{t("profile.rent")}</option>
                      <option value="mortgage">{t("profile.mortgage")}</option>
                      <option value="owner">{t("profile.owner")}</option>
                      <option value="family">{t("profile.family")}</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-surface-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.housingAmount")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("housing_amount", { min: 0 })}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="800"
                  />
                </div>
              </div>
            </section>

            {/* Monthly Charges */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={18} className="text-brand-600" />
                <h2 className="font-semibold text-surface-800">{t("profile.chargesSection")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.foodBudget")}</label>
                  <input
                    type="number" step="0.01" min={0}
                    {...register("food_budget", { min: 0 })}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.transportBudget")}</label>
                  <input
                    type="number" step="0.01" min={0}
                    {...register("transport_budget", { min: 0 })}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.utilitiesBudget")}</label>
                  <input
                    type="number" step="0.01" min={0}
                    {...register("utilities_budget", { min: 0 })}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">{t("profile.otherCharges")}</label>
                  <input
                    type="number" step="0.01" min={0}
                    {...register("other_charges", { min: 0 })}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="200"
                  />
                </div>
              </div>

              {/* Custom Charges */}
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-surface-700">{t("profile.customCharges")}</p>
                  <button
                    type="button"
                    onClick={addCustomCharge}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
                  >
                    <Plus size={14} />
                    {t("profile.addCharge")}
                  </button>
                </div>
                {customCharges.map((charge, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={charge.name}
                      onChange={(e) => updateCustomCharge(idx, "name", e.target.value)}
                      placeholder={t("profile.chargeName")}
                      className="flex-1 border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={charge.amount || ""}
                      onChange={(e) => updateCustomCharge(idx, "amount", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-28 border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomCharge(idx)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {customCharges.length > 0 && (
                  <p className="text-xs text-surface-400 text-right">
                    {t("profile.customTotal")} : <span className="font-semibold text-surface-600">{customTotal.toLocaleString()}</span>
                  </p>
                )}
              </div>
            </section>

            {/* Actions */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
              >
                {saving ? t("profile.saving") : saved ? t("profile.saved") : t("profile.save")}
              </button>
              <button
                type="button"
                onClick={handleGetAdvice}
                disabled={loadingAdvice}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {loadingAdvice ? (
                  <><Loader2 size={16} className="animate-spin" />{t("profile.generating")}</>
                ) : (
                  <><Sparkles size={16} />{t("profile.getAdvice")}</>
                )}
              </button>
            </div>
          </form>

          {/* AI Advice */}
          {loadingAdvice && (
            <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center">
              <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-3" />
              <p className="text-surface-500 text-sm">{t("profile.analyzingProfile")}</p>
            </div>
          )}

          {advice && (
            <div className="bg-white rounded-2xl border border-brand-100 p-6">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-surface-100">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 text-sm">{t("profile.adviceTitle")}</h3>
                  <p className="text-xs text-surface-400">{t("profile.poweredByGemini")}</p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-surface-700
                prose-headings:text-surface-900 prose-headings:font-semibold
                [&_table]:border-collapse [&_table]:w-full [&_table]:text-sm
                [&_th]:bg-surface-50 [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-surface-200 [&_th]:text-left
                [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-surface-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{advice}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});
