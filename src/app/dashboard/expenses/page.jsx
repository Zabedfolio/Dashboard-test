"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { fmt } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  TrendingUp, 
  PieChart as PieIcon,
  Calendar as CalendarIcon,
  DollarSign,
  Receipt,
  ArrowUpRight,
  History,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Check,
  X
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  Line,
  LineChart,
  Area,
  AreaChart,
  CartesianGrid
} from "recharts";
import { cn } from "@/lib/utils";

const DEFAULT_CATEGORIES = [
  "Inventory",
  "Packaging",
  "Delivery / Shipping",
  "Marketing / Ads",
  "Salary",
  "Utilities",
  "Miscellaneous",
];

const CATEGORY_COLORS = {
  Inventory: "hsl(var(--chart-1))",
  Packaging: "hsl(var(--chart-2))",
  "Delivery / Shipping": "hsl(var(--chart-3))",
  "Marketing / Ads": "hsl(var(--chart-4))",
  Salary: "hsl(var(--chart-5))",
  Utilities: "hsl(var(--chart-1))",
  Miscellaneous: "hsl(var(--muted-foreground))",
};

const EXPENSE_TABLE = process.env.NEXT_PUBLIC_EXPENSE_TABLE || "expenses";

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
};
const sevenDaysAgoISO = () => {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return date.toISOString().slice(0, 10);
};

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

function normalizeExpense(row) {
  return {
    id: row.id,
    date: row.Date || todayISO(),
    title: row.title || "",
    amount: Number(row.amount || 0),
    category: row.category || "Miscellaneous",
    created_at: row.created_at,
  };
}

export default function ExpensesPage() {
  const supabase = useMemo(() => createClient(), []);
  const pendingDeletes = useRef(new Map());
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("this-month");
  const [customStart, setCustomStart] = useState(monthStartISO());
  const [customEnd, setCustomEnd] = useState(todayISO());
  const [sort, setSort] = useState({ key: "date", direction: "desc" });
  const [newCategory, setNewCategory] = useState("");
  const [customCategories, setCustomCategories] = useState([]);
  const [entry, setEntry] = useState({
    date: todayISO(),
    title: "",
    amount: "",
    category: "Inventory",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      console.log("Current user:", data.user);
    });
    loadExpenses();
    return () => {
      pendingDeletes.current.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  async function loadExpenses() {
    setLoading(true);
    const { data, error } = await supabase
      .from(EXPENSE_TABLE)
      .select("id,Date,title,amount,category,created_at")
      .order("Date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(`Failed to load expenses: ${error.message}`);
      setLoading(false);
      return;
    }

    setExpenses((data || []).map(normalizeExpense));
    setLoading(false);
  }

  const categories = useMemo(() => {
    const fromRows = expenses.map((expense) => expense.category).filter(Boolean);
    return [...new Set([...DEFAULT_CATEGORIES, ...customCategories, ...fromRows])];
  }, [expenses, customCategories]);

  const filteredExpenses = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    let rows = expenses;

    if (query) {
      rows = rows.filter((expense) => expense.title.toLowerCase().includes(query));
    }

    if (categoryFilter !== "all") {
      rows = rows.filter((expense) => expense.category === categoryFilter);
    }

    const today = todayISO();
    if (dateFilter === "today") {
      rows = rows.filter((expense) => expense.date === today);
    } else if (dateFilter === "last-7") {
      const start = sevenDaysAgoISO();
      rows = rows.filter((expense) => expense.date >= start && expense.date <= today);
    } else if (dateFilter === "this-month") {
      const start = monthStartISO();
      rows = rows.filter((expense) => expense.date >= start && expense.date <= today);
    } else if (dateFilter === "custom") {
      rows = rows.filter((expense) => expense.date >= customStart && expense.date <= customEnd);
    }

    return [...rows].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      const direction = sort.direction === "asc" ? 1 : -1;
      if (sort.key === "amount") return (left - right) * direction;
      return String(left).localeCompare(String(right)) * direction;
    });
  }, [categoryFilter, customEnd, customStart, dateFilter, debouncedSearch, expenses, sort]);

  const summary = useMemo(() => {
    const today = todayISO();
    const monthStart = monthStartISO();
    const todayRows = expenses.filter((expense) => expense.date === today);
    const monthRows = expenses.filter((expense) => expense.date >= monthStart && expense.date <= today);
    const sum = (rows) => rows.reduce((total, expense) => total + Number(expense.amount || 0), 0);
    const highest = monthRows.reduce((max, expense) => Math.max(max, Number(expense.amount || 0)), 0);

    return {
      todayTotal: sum(todayRows),
      monthTotal: sum(monthRows),
      allTimeTotal: sum(expenses),
      todayCount: todayRows.length,
      highestMonthExpense: highest,
    };
  }, [expenses]);

  const insights = useMemo(() => {
    const today = todayISO();
    const monthStart = monthStartISO();
    const monthRows = expenses.filter((expense) => expense.date >= monthStart && expense.date <= today);
    
    const categoryMap = monthRows.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const categoryTotals = Object.entries(categoryMap)
      .map(([category, total]) => ({
        name: category,
        value: total,
        fill: CATEGORY_COLORS[category] || "var(--muted-foreground)"
      }))
      .sort((a, b) => b.value - a.value);

    const dailyTotals = monthRows.reduce((acc, expense) => {
      acc[expense.date] = (acc[expense.date] || 0) + expense.amount;
      return acc;
    }, {});

    const daysInMonth = new Date().getDate();
    const trend = Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      const date = `${monthStart.slice(0, 8)}${day}`;
      return {
        date: day,
        total: dailyTotals[date] || 0,
      };
    });

    const activeDays = Object.keys(dailyTotals).length;
    const averageDaily = activeDays ? summary.monthTotal / activeDays : 0;

    return {
      categoryTotals,
      trend,
      averageDaily,
      topCategory: categoryTotals[0]?.name || "None",
      maxTrend: Math.max(...trend.map((item) => item.total), 1),
    };
  }, [expenses, summary.monthTotal, categories]);

  function updateEntry(field, value) {
    setEntry((current) => ({ ...current, [field]: value }));
  }

  async function addExpense() {
    const amount = Number(entry.amount);
    const title = entry.title.trim();

    if (!title || !amount || amount <= 0) {
      toast.error("Enter a title and a valid amount.");
      return;
    }

    const optimistic = normalizeExpense({
      id: `temp-${crypto.randomUUID()}`,
      date: entry.date,
      title,
      amount,
      category: entry.category,
      created_at: new Date().toISOString(),
    });

    setSaving(true);
    setExpenses((current) => [optimistic, ...current]);
    setEntry((current) => ({ ...current, title: "", amount: "" }));

    const { data, error } = await supabase
      .from(EXPENSE_TABLE)
      .insert({
        Date: optimistic.date,
        title: optimistic.title,
        amount: optimistic.amount,
        category: optimistic.category,
      })
      .select("id,Date,title,amount,category,created_at")
      .single();

    setSaving(false);
    if (error) {
      setExpenses((current) => current.filter((expense) => expense.id !== optimistic.id));
      toast.error(`Add failed: ${error.message}`);
      return;
    }

    setExpenses((current) =>
      current.map((expense) => (expense.id === optimistic.id ? normalizeExpense(data) : expense))
    );
  }

  function handleEntryKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addExpense();
    }
  }

  function startEdit(id, field, value) {
    setEditingCell(`${id}:${field}`);
    setDraftValue(String(value ?? ""));
  }

  async function commitEdit(expense, field, value = draftValue) {
    const nextValue = field === "amount" ? Number(value) : value;
    if (field === "amount" && (!nextValue || nextValue <= 0)) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    setEditingCell(null);
    if (expense[field] === nextValue) return;

    const previous = expense[field];
    setExpenses((current) =>
      current.map((row) => (row.id === expense.id ? { ...row, [field]: nextValue } : row))
    );

    const { error } = await supabase
      .from(EXPENSE_TABLE)
      .update({ [field === "date" ? "Date" : field]: nextValue })
      .eq("id", expense.id);

    if (error) {
      setExpenses((current) =>
        current.map((row) => (row.id === expense.id ? { ...row, [field]: previous } : row))
      );
      toast.error(`Update failed: ${error.message}`);
    }
  }

  function handleEditKeyDown(event, expense, field) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit(expense, field);
    }
    if (event.key === "Escape") {
      setEditingCell(null);
    }
  }

  function deleteExpense(expense) {
    setExpenses((current) => current.filter((row) => row.id !== expense.id));

    const timeout = window.setTimeout(async () => {
      pendingDeletes.current.delete(expense.id);
      const { error } = await supabase.from(EXPENSE_TABLE).delete().eq("id", expense.id);
      if (error) {
        setExpenses((current) => [expense, ...current]);
        toast.error(`Delete failed: ${error.message}`);
      }
    }, 4500);

    pendingDeletes.current.set(expense.id, timeout);
    toast("Expense deleted", {
      description: expense.title,
      action: {
        label: "Undo",
        onClick: () => {
          window.clearTimeout(timeout);
          pendingDeletes.current.delete(expense.id);
          setExpenses((current) => [expense, ...current]);
        },
      },
    });
  }

  function addCategory() {
    const value = newCategory.trim();
    if (!value) return;
    setCustomCategories((current) => [...new Set([...current, value])]);
    setEntry((current) => ({ ...current, category: value }));
    setNewCategory("");
  }

  function setSortKey(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expense Ledger</h1>
            <p className="text-muted-foreground text-sm">Real-time accounting & business cost control</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
            <Button size="sm" className="h-9 shadow-md shadow-primary/20">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Entry Bar - Spreadsheet Style */}
        <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
          <div className="p-1">
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_140px_200px_100px] items-center gap-1">
              <div className="px-2 py-1.5 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={entry.date}
                  onChange={(e) => updateEntry("date", e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-0"
                />
              </div>
              <div className="border-l px-2 py-1.5">
                <input
                  placeholder="What was this for?"
                  value={entry.title}
                  onChange={(e) => updateEntry("title", e.target.value)}
                  onKeyDown={handleEntryKeyDown}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 placeholder:text-muted-foreground/50"
                  autoComplete="off"
                />
              </div>
              <div className="border-l px-2 py-1.5 flex items-center gap-1">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={entry.amount}
                  onChange={(e) => updateEntry("amount", e.target.value)}
                  onKeyDown={handleEntryKeyDown}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 tabular-nums"
                />
              </div>
              <div className="border-l px-2 py-0.5">
                <Select value={entry.category} onValueChange={(v) => updateEntry("category", v)}>
                  <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 shadow-none px-2 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />
                          {c}
                        </div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 flex gap-1 border-t mt-1">
                      <Input 
                        placeholder="Add new..." 
                        className="h-7 text-xs" 
                        value={newCategory} 
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            addCategory();
                          }
                        }}
                      />
                      <Button size="icon" className="h-7 w-7 shrink-0" onClick={addCategory}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-l pl-1">
                <Button 
                  onClick={addExpense} 
                  disabled={saving}
                  className="w-full h-8 text-xs font-medium bg-primary hover:bg-primary/90 transition-all active:scale-95"
                >
                  {saving ? "..." : "POST"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard label="Today" value={summary.todayTotal} count={summary.todayCount} icon={Receipt} color="text-blue-500" />
        <SummaryCard label="This Month" value={summary.monthTotal} icon={CalendarIcon} color="text-emerald-500" />
        <SummaryCard label="All Time" value={summary.allTimeTotal} icon={DollarSign} color="text-violet-500" />
        <SummaryCard label="Top Category" value={insights.topCategory} icon={PieIcon} color="text-orange-500" isAmount={false} />
        <SummaryCard label="Daily Average" value={insights.averageDaily} icon={TrendingUp} color="text-pink-500" />
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3 rounded-xl border bg-card/50 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-background border-none ring-1 ring-border focus-visible:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-full md:w-[160px] bg-background">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-9 w-full md:w-[160px] bg-background">
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last-7">Last 7 days</SelectItem>
                  <SelectItem value="this-month">This month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 w-full md:w-auto animate-in slide-in-from-right-2">
                <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-9 w-full md:w-[130px]" />
                <span className="text-muted-foreground">to</span>
                <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-9 w-full md:w-[130px]" />
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-md">
                  <tr className="border-b">
                    <SortableHead label="Date" sortKey="date" sort={sort} onClick={setSortKey} className="pl-4" />
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Description</th>
                    <SortableHead label="Category" sortKey="category" sort={sort} onClick={setSortKey} />
                    <SortableHead label="Amount" sortKey="amount" sort={sort} onClick={setSortKey} align="right" />
                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span>Syncing ledger...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-muted-foreground italic">
                        No transactions found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <ExpenseRow
                        key={expense.id}
                        expense={expense}
                        categories={categories}
                        editingCell={editingCell}
                        draftValue={draftValue}
                        setDraftValue={setDraftValue}
                        startEdit={startEdit}
                        commitEdit={commitEdit}
                        handleEditKeyDown={handleEditKeyDown}
                        deleteExpense={deleteExpense}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          {/* Analytics: Trends */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold">Spending Trend</h3>
                <p className="text-xs text-muted-foreground">Daily activity this month</p>
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="h-[200px] w-full">
              <ChartContainer config={{ total: { label: "Spent", color: "hsl(var(--primary))" } }}>
                <AreaChart data={insights.trend}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    interval={Math.floor(insights.trend.length / 5)}
                  />
                  <YAxis hide domain={[0, insights.maxTrend * 1.1]} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          {/* Analytics: Category Breakdown */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold">Cost Distribution</h3>
                <p className="text-xs text-muted-foreground">By category (Monthly)</p>
              </div>
              <PieIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-4">
              {insights.categoryTotals.slice(0, 5).map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{item.name}</span>
                    <span className="tabular-nums text-muted-foreground">{fmt(item.value)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(item.value / summary.monthTotal) * 100}%`,
                        backgroundColor: item.fill 
                      }}
                    />
                  </div>
                </div>
              ))}
              {insights.categoryTotals.length > 5 && (
                <p className="text-[10px] text-center text-muted-foreground">
                  +{insights.categoryTotals.length - 5} more categories
                </p>
              )}
            </div>
          </div>

          {/* Tips / Insights */}
          <div className="rounded-xl border bg-primary/5 border-primary/10 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Ledger Insights</h4>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs leading-relaxed">
                  Your spending peaked on day <span className="font-bold">{insights.trend.sort((a,b) => b.total - a.total)[0]?.date}</span> this month.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <PieIcon className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs leading-relaxed">
                  <span className="font-bold">{insights.topCategory}</span> remains your primary cost driver.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, count, icon: Icon, color, isAmount = true }) {
  return (
    <div className="relative group overflow-hidden rounded-xl border bg-card p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
      <div className={cn("absolute -right-2 -bottom-2 h-16 w-16 opacity-5 group-hover:opacity-10 transition-opacity", color)}>
        <Icon className="h-full w-full" />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className={cn("p-1.5 sm:p-2 rounded-lg bg-current/10", color)}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</span>
      </div>
      <div className="flex items-baseline flex-wrap gap-1 sm:gap-2 min-w-0">
        <div className="text-base sm:text-xl font-bold tabular-nums tracking-tight truncate w-full">
          {isAmount ? fmt(value) : value}
        </div>
        {count !== undefined && (
          <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">
            ({count} TX)
          </span>
        )}
      </div>
    </div>
  );
}

function SortableHead({ label, sortKey, sort, onClick, align = "left", className }) {
  const active = sort.key === sortKey;
  return (
    <th className={cn("px-4 py-3 font-semibold text-muted-foreground", align === "right" ? "text-right" : "text-left", className)}>
      <button 
        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors" 
        onClick={() => onClick(sortKey)}
      >
        {label}
        <div className="flex flex-col">
          <ChevronUp className={cn("h-2 w-2 -mb-0.5", active && sort.direction === "asc" ? "text-primary" : "text-muted-foreground/30")} />
          <ChevronDown className={cn("h-2 w-2", active && sort.direction === "desc" ? "text-primary" : "text-muted-foreground/30")} />
        </div>
      </button>
    </th>
  );
}

function ExpenseRow({
  expense,
  categories,
  editingCell,
  draftValue,
  setDraftValue,
  startEdit,
  commitEdit,
  handleEditKeyDown,
  deleteExpense,
}) {
  const isToday = expense.date === todayISO();

  return (
    <tr className={cn(
      "group border-b last:border-b-0 transition-colors duration-150 animate-in fade-in-0 slide-in-from-left-2",
      isToday ? "bg-primary/[0.03]" : "hover:bg-muted/40"
    )}>
      <EditableCell
        expense={expense}
        field="date"
        type="date"
        value={expense.date}
        editingCell={editingCell}
        draftValue={draftValue}
        setDraftValue={setDraftValue}
        startEdit={startEdit}
        commitEdit={commitEdit}
        handleEditKeyDown={handleEditKeyDown}
        className="pl-4 font-mono text-xs text-muted-foreground"
      />
      <EditableCell
        expense={expense}
        field="title"
        value={expense.title}
        editingCell={editingCell}
        draftValue={draftValue}
        setDraftValue={setDraftValue}
        startEdit={startEdit}
        commitEdit={commitEdit}
        handleEditKeyDown={handleEditKeyDown}
        className="font-medium"
      />
      <td className="px-4 py-2">
        {editingCell === `${expense.id}:category` ? (
          <Select
            value={draftValue}
            onValueChange={(value) => commitEdit(expense, "category", value)}
            open={true}
            onOpenChange={(open) => !open && setEditingCell(null)}
          >
            <SelectTrigger className="h-8 border-primary ring-1 ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
                    {category}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <button
            className="flex items-center gap-2 rounded-full px-2.5 py-1 text-xs border bg-background hover:bg-muted transition-colors"
            onClick={() => startEdit(expense.id, "category", expense.category)}
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[expense.category] }} />
            {expense.category}
          </button>
        )}
      </td>
      <EditableCell
        expense={expense}
        field="amount"
        type="number"
        value={expense.amount}
        display={fmt(expense.amount)}
        align="right"
        editingCell={editingCell}
        draftValue={draftValue}
        setDraftValue={setDraftValue}
        startEdit={startEdit}
        commitEdit={commitEdit}
        handleEditKeyDown={handleEditKeyDown}
        className="font-bold tabular-nums"
      />
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteExpense(expense)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function EditableCell({
  expense,
  field,
  value,
  display,
  type = "text",
  align = "left",
  editingCell,
  draftValue,
  setDraftValue,
  startEdit,
  commitEdit,
  handleEditKeyDown,
  className
}) {
  const active = editingCell === `${expense.id}:${field}`;

  return (
    <td className={cn("px-4 py-2", align === "right" ? "text-right" : "text-left")}>
      {active ? (
        <div className="relative">
          <Input
            className={cn(
              "h-8 min-w-[80px] bg-background border-primary ring-1 ring-primary/20 animate-in zoom-in-95",
              align === "right" ? "text-right tabular-nums" : ""
            )}
            type={type}
            value={draftValue}
            autoFocus
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={() => commitEdit(expense, field)}
            onKeyDown={(event) => handleEditKeyDown(event, expense, field)}
          />
          <div className="absolute -top-6 right-0 flex gap-1 animate-in slide-in-from-bottom-1">
            <div className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[8px] font-bold">ENTER TO SAVE</div>
          </div>
        </div>
      ) : (
        <button
          className={cn(
            "w-full rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60 focus:bg-muted/60 outline-none",
            align === "right" ? "text-right tabular-nums" : "text-left",
            className
          )}
          onClick={() => startEdit(expense.id, field, value)}
        >
          {display ?? value}
        </button>
      )}
    </td>
  );
}

