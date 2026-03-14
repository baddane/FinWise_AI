import Link from "next/link";
import { useRouter } from "next/router";
import { LayoutDashboard, CreditCard, BarChart3, MessageSquare, Settings, LogOut, Sparkles, ListChecks } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "next-i18next";

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation("common");
  const pathname = router.pathname;

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/babysteps", label: t("nav.babySteps"), icon: ListChecks },
    { href: "/transactions", label: t("nav.transactions"), icon: CreditCard },
    { href: "/analysis", label: t("nav.analysis"), icon: BarChart3 },
    { href: "/chat", label: t("nav.aiAdvisor"), icon: MessageSquare },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const toggleLanguage = () => {
    const newLocale = i18n.language === "en" ? "fr" : "en";
    router.push(router.pathname, router.asPath, { locale: newLocale });
  };

  return (
    <aside className="w-[260px] bg-white border-r border-surface-200/60 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900 leading-tight">FinWise AI</h1>
            <p className="text-[11px] text-surface-400 font-medium">{t("nav.financialAdvisor")}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-3 pt-2 pb-2 text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
          {t("nav.menu")}
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100"
                  : "text-surface-500 hover:bg-surface-50 hover:text-surface-800"
              )}
            >
              <Icon size={18} className={clsx("transition-colors", isActive ? "text-brand-600" : "text-surface-400")} />
              {label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-surface-100 space-y-1">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-surface-500 hover:bg-surface-50 hover:text-surface-800 w-full transition-all duration-200"
        >
          <span className="text-base">{i18n.language === "en" ? "🇫🇷" : "🇬🇧"}</span>
          <span>{i18n.language === "en" ? "Français" : "English"}</span>
        </button>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-surface-500 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200 group"
        >
          <LogOut size={18} className="text-surface-400 group-hover:text-red-500 transition-colors" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
