
"use client";

import { useCallback, useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window === "undefined"
    ? "http://127.0.0.1:8000"
    : `http://${window.location.hostname}:8000`);

type Category = {
  id: number;
  name: string;
  total_expenses: number;
};

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  created_at: string;
};

type Summary = {
  total: number;
  count: number;
  average: number;
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    count: 0,
    average: 0,
  });

  const [categoryName, setCategoryName] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      const [categoryRes, expenseRes, summaryRes] = await Promise.all([
        fetch(`${API}/categories`),
        fetch(`${API}/expenses`),
        fetch(`${API}/summary`),
      ]);

      if (!categoryRes.ok || !expenseRes.ok || !summaryRes.ok) {
        throw new Error("Could not load expense data.");
      }

      const categoryData = await categoryRes.json();
      const expenseData = await expenseRes.json();
      const summaryData = await summaryRes.json();

      setCategories(categoryData);
      setExpenses(expenseData);
      setSummary(summaryData);

      setCategoryId((current) => {
        if (
          current &&
          categoryData.some(
            (category: Category) => String(category.id) === current
          )
        ) {
          return current;
        }

        return categoryData.length
          ? String(categoryData[0].id)
          : "";
      });

      setError("");
    } catch {
      setError("Cannot connect to FastAPI. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial data loading synchronizes this UI with the backend.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshData();
  }, [refreshData]);

  async function createCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not create category.");
      }

      setCategoryName("");
      setCategoryId(String(data.id));
      setMessage("Category created successfully.");
      await refreshData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  async function createExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!title.trim()) {
      setError("Expense title is required.");
      return;
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    if (!categoryId) {
      setError("Please create and select a category first.");
      return;
    }

    try {
      const response = await fetch(`${API}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          category_id: Number(categoryId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not create expense.");
      }

      setTitle("");
      setAmount("");
      setMessage("Expense added successfully.");
      await refreshData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Personal Finance
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Expense Tracker
            </h1>
            <p className="mt-2 text-slate-500">
              Manage your spending, one expense at a time.
            </p>
          </div>

          <button
            onClick={() => void refreshData()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium shadow-sm hover:bg-slate-100"
          >
            Refresh data
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700"
          >
            {message}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total spending", value: money(summary.total) },
            { label: "Total expenses", value: String(summary.count) },
            { label: "Average expense", value: money(summary.average) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">
                {item.label}
              </p>
              <p className="mt-3 break-words text-2xl font-bold">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Categories</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create categories to organize your expenses.
            </p>

            <form onSubmit={createCategory} className="mt-5 flex gap-3">
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Food, Travel"
                maxLength={100}
                required
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Add
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <span className="font-medium">{category.name}</span>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                    {category.total_expenses} expenses
                  </span>
                </div>
              ))}

              {!loading && categories.length === 0 && (
                <p className="py-4 text-sm text-slate-500">
                  No categories yet. Create one above.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Add an expense</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the expense details below.
            </p>

            <form onSubmit={createExpense} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="expense-title"
                  className="mb-2 block text-sm font-medium"
                >
                  Expense title
                </label>
                <input
                  id="expense-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lunch"
                  maxLength={200}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="expense-amount"
                  className="mb-2 block text-sm font-medium"
                >
                  Amount (₹)
                </label>
                <input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="250.50"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="expense-category"
                  className="mb-2 block text-sm font-medium"
                >
                  Category
                </label>
                <select
                  id="expense-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  disabled={categories.length === 0}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                >
                  {categories.length === 0 && (
                    <option value="">Create a category first</option>
                  )}
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={categories.length === 0}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Add expense
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Recent expenses</h2>
            <p className="mt-1 text-sm text-slate-500">
              All your recorded expenses and categories.
            </p>
          </div>

          {loading ? (
            <p className="py-8 text-center text-slate-500">
              Loading expenses...
            </p>
          ) : expenses.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No expenses yet. Add your first expense above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-4 font-medium">Title</th>
                    <th className="px-3 py-4 font-medium">Category</th>
                    <th className="px-3 py-4 font-medium">Date</th>
                    <th className="px-3 py-4 text-right font-medium">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-4 font-medium">
                        {expense.title}
                      </td>
                      <td className="px-3 py-4">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {new Date(expense.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold">
                        {money(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="py-6 text-center text-sm text-slate-400">
          Expense Tracker · Next.js + FastAPI + SQLite
        </footer>
      </div>
    </main>
  );
}
