import { useEffect } from "react";
import { useRouter } from "next/router";
import { Sidebar } from "@/components/Layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-[260px] flex-1 p-8 max-w-[800px]">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
          <p className="text-sm text-surface-400 mt-1">Manage your account preferences</p>
        </div>

        <div className="card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-surface-900 mb-1">Account</h3>
          <p className="text-xs text-surface-400 mb-4">Manage your account settings</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
