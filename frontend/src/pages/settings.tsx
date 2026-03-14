import { useEffect } from "react";
import { useRouter } from "next/router";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) },
});

export default function SettingsPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => { logout(); router.push("/login"); };

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-[260px] flex-1 p-8 max-w-[800px]">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-surface-900">{t("settings.title")}</h1>
          <p className="text-sm text-surface-400 mt-1">{t("settings.subtitle")}</p>
        </div>

        {/* Language */}
        <div className="card p-6 animate-slide-up mb-4">
          <h3 className="text-sm font-semibold text-surface-900 mb-1">{t("settings.language")}</h3>
          <p className="text-xs text-surface-400 mb-4">{t("settings.selectLanguage")}</p>
          <div className="flex gap-3">
            {[
              { locale: "en", label: "🇬🇧 English" },
              { locale: "fr", label: "🇫🇷 Français" },
            ].map(({ locale, label }) => (
              <button
                key={locale}
                onClick={() => changeLanguage(locale)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  i18n.language === locale
                    ? "bg-brand-50 text-brand-700 border-brand-200"
                    : "border-surface-200 text-surface-600 hover:bg-surface-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-surface-900 mb-1">{t("settings.account")}</h3>
          <p className="text-xs text-surface-400 mb-4">{t("settings.manageAccount")}</p>
          <button onClick={handleLogout} className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
            {t("settings.signOut")}
          </button>
        </div>
      </main>
    </div>
  );
}
