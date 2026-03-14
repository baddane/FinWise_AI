import { useEffect } from "react";
import { useRouter } from "next/router";
import { Sidebar } from "@/components/Layout/Sidebar";
import { ChatInterface } from "@/components/Chat/ChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) },
});

export default function ChatPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => { logout(); router.push("/login"); };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-[260px] flex-1 p-8 max-w-[1000px] animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-surface-900">{t("chat.title")}</h1>
          <p className="text-sm text-surface-400 mt-1">{t("chat.subtitle")}</p>
        </div>
        <div style={{ height: "calc(100vh - 180px)" }}>
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
