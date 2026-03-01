import { useEffect } from "react";
import { useRouter } from "next/router";
import { Sidebar } from "@/components/Layout/Sidebar";
import { ChatInterface } from "@/components/Chat/ChatInterface";
import { useAuth } from "@/hooks/useAuth";

export default function ChatPage() {
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Advisor</h1>
          <p className="text-gray-500 mt-1">Get personalized financial advice</p>
        </div>
        <div style={{ height: "calc(100vh - 180px)" }}>
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
