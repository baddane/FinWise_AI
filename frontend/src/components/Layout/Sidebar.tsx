"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, BarChart3, MessageSquare, Settings, LogOut, Sparkles } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/chat", label: "AI Advisor", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();

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
            <p className="text-[11px] text-surface-400 font-medium">Financial Advisor</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-3 pt-2 pb-2 text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
          Menu
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
              <Icon
                size={18}
                className={clsx(
                  "transition-colors",
                  isActive ? "text-brand-600" : "text-surface-400"
                )}
              />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-surface-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-surface-500 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200 group"
        >
          <LogOut size={18} className="text-surface-400 group-hover:text-red-500 transition-colors" />
          Logout
        </button>
      </div>
    </aside>
  );
}
