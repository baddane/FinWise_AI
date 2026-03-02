import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { transactionsApi } from "@/services/api";
import { Transaction } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function TransactionsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    type: "expense" as "income" | "expense",
    description: "",
    merchant: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    transactionsApi.list({ limit: 100 })
      .then(setTransactions)
      .finally(() => setIsDataLoading(false));
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleDelete = async (id: number) => {
    await transactionsApi.delete(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError("Please enter a valid amount.");
      return;
    }
    try {
      const created = await transactionsApi.create({
        amount,
        type: form.type,
        description: form.description || null,
        merchant: form.merchant || null,
        category_id: null,
        date: new Date(form.date).toISOString(),
      });
      setTransactions((prev) => [created, ...prev]);
      setShowForm(false);
      setForm({ amount: "", type: "expense", description: "", merchant: "", date: new Date().toISOString().split("T")[0] });
    } catch {
      setFormError("Failed to create transaction. Please try again.");
    }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar onLogout={handleLogout} />
      <main className="ml-[260px] flex-1 p-8 max-w-[1200px]">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Transactions</h1>
            <p className="text-sm text-surface-400 mt-1">Manage your income and expenses</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-6 animate-slide-up">
            <h3 className="text-sm font-semibold text-surface-900 mb-4">New Transaction</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "income" | "expense" })}
                  className="input w-full"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Merchant</label>
                <input
                  type="text"
                  value={form.merchant}
                  onChange={(e) => setForm({ ...form, merchant: e.target.value })}
                  placeholder="Optional"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              {formError && (
                <p className="sm:col-span-2 text-xs text-red-600">{formError}</p>
              )}
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="btn-primary px-5 py-2">Save</button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(""); }}
                  className="px-5 py-2 rounded-xl border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card overflow-hidden animate-slide-up">
          {isDataLoading ? (
            <div className="p-12 text-center text-surface-400 text-sm">Loading transactions…</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-surface-400 text-sm">No transactions yet. Add your first one!</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Description</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Merchant</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-surface-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3.5">
                      {t.type === "income" ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                          <ArrowUpCircle size={12} /> Income
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                          <ArrowDownCircle size={12} /> Expense
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-surface-700">{t.description ?? "—"}</td>
                    <td className="px-5 py-3.5 text-surface-500">{t.merchant ?? "—"}</td>
                    <td className="px-5 py-3.5 text-surface-500">
                      {format(new Date(t.date), "MMM d, yyyy")}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-semibold tabular-nums ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                      {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-surface-300 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
