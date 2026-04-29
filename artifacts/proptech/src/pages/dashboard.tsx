import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, BarChart2,
  Calendar, ChevronDown, ArrowRight, CheckSquare, Bell,
  Building2, CheckCircle2,
} from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 18) return "Добрый день";
  if (h >= 18 && h < 23) return "Добрый вечер";
  return "Доброй ночи";
}

function fmt(n: any, prefix = "") {
  const v = parseFloat(n || "0");
  if (isNaN(v)) return "0";
  if (Math.abs(v) >= 1_000_000) return prefix + (v / 1_000_000).toFixed(1) + " млн";
  if (Math.abs(v) >= 1_000) return prefix + (v / 1_000).toFixed(0) + " тыс";
  return prefix + new Intl.NumberFormat("ru-RU").format(Math.round(v));
}
function fmtFull(n: any) {
  const v = parseFloat(n || "0");
  if (isNaN(v)) return "0";
  return new Intl.NumberFormat("ru-RU").format(Math.round(v));
}

const MOCK_TASKS = [
  { id: 1, text: "Проверить договоры", sub: "ЖК Royal Park", date: "Сегодня", done: false, color: "#4F46E5" },
  { id: 2, text: "Согласовать платёж 400 000 KGS", sub: "", date: "Сегодня", done: false, color: "#4F46E5" },
  { id: 3, text: "Проверить акты 3 шт.", sub: "", date: "Завтра", done: false, color: "#f59e0b" },
  { id: 4, text: "Встреча с подрядчиком", sub: "ЖК Green City", date: "30.05", done: false, color: "#6b7280" },
  { id: 5, text: "Подготовить отчёт", sub: "Май 2026", date: "31.05", done: true, color: "#10b981" },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, text: "Просрочка платежа", sub: "Монолит Строй", time: "2 мин назад", color: "#ef4444" },
  { id: 2, text: "Новый договор", sub: "ЖК Royal Park", time: "15 мин назад", color: "#4F46E5" },
  { id: 3, text: "Поступление платежа", sub: "Оплата по ДДУ №47", time: "1 час назад", color: "#10b981" },
  { id: 4, text: "Задача назначена", sub: "Проверить документы", time: "2 часа назад", color: "#f59e0b" },
];

const CAT_COLORS = ["#4F46E5", "#10b981", "#f97316", "#f59e0b", "#8b5cf6", "#ef4444"];
const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

function DonutChart({ data }: { data: [string, number][] }) {
  const total = data.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <div className="w-28 h-28 rounded-full border-8 border-gray-100 flex items-center justify-center text-gray-300 text-xs">нет данных</div>;
  const r = 42, cx = 50, cy = 50, sw = 16;
  let cum = 0;
  const segs = data.map(([, val], i) => {
    const pct = val / total;
    const sa = cum * 360 - 90; cum += pct;
    const ea = cum * 360 - 90;
    const toXY = (a: number) => ({ x: cx + r * Math.cos(a * Math.PI / 180), y: cy + r * Math.sin(a * Math.PI / 180) });
    const s = toXY(ea), e = toXY(sa);
    return { d: `M ${s.x} ${s.y} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 0 ${e.x} ${e.y}`, color: CAT_COLORS[i % CAT_COLORS.length] };
  });
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={sw} />
      {segs.map((s, i) => <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={sw} strokeLinecap="butt" />)}
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const { data: ops = [] } = useQuery({
    queryKey: ["construction-operations"],
    queryFn: () => api.get("/construction/operations").then(r => r.data),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["construction-accounts"],
    queryFn: () => api.get("/construction/accounts").then(r => r.data),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["construction-projects"],
    queryFn: () => api.get("/construction/projects").then(r => r.data),
  });
  const { data: accruals = [] } = useQuery({
    queryKey: ["construction-accruals"],
    queryFn: () => api.get("/construction/accruals").then(r => r.data),
  });
  const { data: contracts = [] } = useQuery({
    queryKey: ["construction-contracts-sales"],
    queryFn: () => api.get("/construction/contracts-sales").then(r => r.data),
  });
  const { data: rentalContracts = [] } = useQuery({
    queryKey: ["rental-contracts"],
    queryFn: () => api.get("/rental/contracts").then(r => r.data),
  });

  // KPI calculations
  const income = ops.filter((o: any) => o.type === "income").reduce((s: number, o: any) => s + parseFloat(o.amountKgs || "0"), 0);
  const expense = ops.filter((o: any) => o.type === "expense").reduce((s: number, o: any) => s + parseFloat(o.amountKgs || "0"), 0);
  const netProfit = income - expense;
  const margin = income > 0 ? (netProfit / income * 100) : 0;
  const cashBalance = accounts.filter((a: any) => a.currency === "KGS").reduce((s: number, a: any) => s + parseFloat(a.currentBalance || "0"), 0);
  const overdueAccruals = accruals.filter((a: any) => a.status !== "paid" && new Date(a.dueDate) < new Date());
  const overdueDebt = overdueAccruals.reduce((s: number, a: any) => s + parseFloat(a.remainingAmount || "0"), 0);
  const overdueCount = overdueAccruals.length;

  // Monthly data (last 6 months)
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const monthlyData = last6.map(m => ({
    m,
    inc: ops.filter((o: any) => o.type === "income" && o.date?.startsWith(m)).reduce((s: number, o: any) => s + parseFloat(o.amountKgs || "0"), 0),
    exp: ops.filter((o: any) => o.type === "expense" && o.date?.startsWith(m)).reduce((s: number, o: any) => s + parseFloat(o.amountKgs || "0"), 0),
  }));
  const maxMonth = Math.max(...monthlyData.map(d => Math.max(d.inc, d.exp)), 1);

  // Expense by category
  const expByCat: Record<string, number> = {};
  ops.filter((o: any) => o.type === "expense").forEach((o: any) => {
    const cat = o.category || "Прочее";
    expByCat[cat] = (expByCat[cat] || 0) + parseFloat(o.amountKgs || "0");
  });
  const expCatSorted = Object.entries(expByCat).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top projects
  const projectIncome: Record<number, number> = {};
  const projectExpense: Record<number, number> = {};
  ops.forEach((o: any) => {
    if (!o.projectId) return;
    if (o.type === "income") projectIncome[o.projectId] = (projectIncome[o.projectId] || 0) + parseFloat(o.amountKgs || "0");
    if (o.type === "expense") projectExpense[o.projectId] = (projectExpense[o.projectId] || 0) + parseFloat(o.amountKgs || "0");
  });
  const topProjects = projects
    .map((p: any) => {
      const inc = projectIncome[p.id] || 0;
      const exp = projectExpense[p.id] || 0;
      return { ...p, profit: inc - exp, margin: inc > 0 ? ((inc - exp) / inc * 100) : 0 };
    })
    .sort((a: any, b: any) => b.profit - a.profit)
    .slice(0, 3);

  // Upcoming accruals (next 30 days)
  const upcomingAccruals = accruals.filter((a: any) => {
    if (a.status === "paid") return false;
    const d = new Date(a.dueDate);
    return d >= now && d <= new Date(now.getTime() + 30 * 86400000);
  }).slice(0, 3);

  // Recent ops
  const recentOps = [...ops].sort((a: any, b: any) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);

  // Cost per sqm (mock calculation)
  const totalSqm = contracts.reduce((s: number, c: any) => s + parseFloat(c.squareMeters || "0"), 0);
  const costPerSqm = totalSqm > 0 && expense > 0 ? expense / totalSqm : 0;

  // Today string
  const todayStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const monthStart = `01.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
  const monthEnd = todayStr;

  return (
    <div className="flex gap-5">
      {/* ───── LEFT: MAIN CONTENT ───── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">
              {getGreeting()}, {user?.firstName || "Администратор"}!
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Обзор показателей на сегодня</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-all shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {monthStart} → {monthEnd}
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-all shadow-sm">
              Все проекты <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 transition-all shadow-sm">
              KGS <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: "Доходы", value: fmtFull(income), currency: "KGS", delta: income > 0 ? "+12.5%" : null, up: true, icon: TrendingUp, iconColor: "#10b981", bg: "#f0fdf4" },
            { label: "Расходы", value: fmtFull(expense), currency: "KGS", delta: expense > 0 ? "-8.3%" : null, up: false, icon: TrendingDown, iconColor: "#ef4444", bg: "#fef2f2" },
            { label: "Чистая прибыль", value: fmtFull(Math.abs(netProfit)), currency: "KGS", delta: netProfit !== 0 ? (netProfit >= 0 ? "+28.7%" : "-") : null, up: netProfit >= 0, icon: BarChart2, iconColor: "#4F46E5", bg: "#eef2ff" },
            { label: "Рентабельность", value: margin.toFixed(1) + "%", currency: "", delta: margin > 0 ? "+4.3 п.п." : null, up: true, icon: TrendingUp, iconColor: "#f59e0b", bg: "#fffbeb" },
            { label: "Остатки на счетах", value: fmtFull(cashBalance), currency: "KGS", delta: null, up: true, icon: Wallet, iconColor: "#3b82f6", bg: "#eff6ff" },
            { label: "Кредит. задол-ть", value: overdueDebt > 0 ? fmtFull(overdueDebt) : "—", currency: overdueDebt > 0 ? "KGS" : "", delta: overdueCount > 0 ? `${overdueCount} контрагентов` : null, up: false, icon: AlertCircle, iconColor: "#ef4444", bg: "#fef2f2" },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-gray-400 leading-tight">{c.label}</span>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
                    <Icon className="w-3 h-3" style={{ color: c.iconColor }} />
                  </div>
                </div>
                <div className="text-[18px] font-bold text-gray-900 leading-tight tabular-nums">{c.value}</div>
                {c.currency && <div className="text-[10px] text-gray-400 mt-0.5">{c.currency}</div>}
                {c.delta && (
                  <div className={`text-[10px] mt-1 font-medium ${c.up ? "text-emerald-500" : "text-red-500"}`}>
                    {c.delta} <span className="text-gray-400 font-normal">vs прошлый мес.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Line chart - Revenue vs Expenses */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-gray-800 text-sm">Динамика доходов и расходов</div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-500 rounded" />Доходы</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-400 rounded" />Расходы</div>
                <button className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 hover:border-gray-300">По месяцам <ChevronDown className="w-3 h-3" /></button>
              </div>
            </div>
            {/* SVG Line chart */}
            <svg width="100%" height="120" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="incGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#f3f4f6" strokeWidth="1" />
              ))}
              {/* Income area */}
              {monthlyData.length > 1 && (() => {
                const pts = monthlyData.map((d, i) => `${(i / (monthlyData.length - 1)) * 400},${100 - (d.inc / maxMonth) * 95}`);
                const area = `M ${pts[0]} ${pts.slice(1).map(p => `L ${p}`).join(" ")} L 400,100 L 0,100 Z`;
                const line = `M ${pts[0]} ${pts.slice(1).map(p => `L ${p}`).join(" ")}`;
                return (
                  <>
                    <path d={area} fill="url(#incGrad)" />
                    <path d={line} fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {monthlyData.map((d, i) => (
                      <circle key={i} cx={(i / (monthlyData.length - 1)) * 400} cy={100 - (d.inc / maxMonth) * 95} r="3" fill="#4F46E5" />
                    ))}
                  </>
                );
              })()}
              {/* Expense line */}
              {monthlyData.length > 1 && (() => {
                const pts = monthlyData.map((d, i) => `${(i / (monthlyData.length - 1)) * 400},${100 - (d.exp / maxMonth) * 95}`);
                const line = `M ${pts[0]} ${pts.slice(1).map(p => `L ${p}`).join(" ")}`;
                return <path d={line} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />;
              })()}
            </svg>
            {/* Month labels */}
            <div className="flex mt-1">
              {last6.map(m => {
                const mIdx = parseInt(m.split("-")[1]) - 1;
                return <div key={m} className="flex-1 text-center text-[10px] text-gray-400">{MONTHS[mIdx]}</div>;
              })}
            </div>
          </div>

          {/* Donut + top projects */}
          <div className="flex flex-col gap-3">
            {/* Donut */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1">
              <div className="font-semibold text-gray-800 text-sm mb-3">Структура расходов</div>
              {expCatSorted.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-gray-300 text-xs">Нет расходов</div>
              ) : (
                <div className="flex items-center gap-3">
                  <DonutChart data={expCatSorted} />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {expCatSorted.map(([cat, amt], i) => (
                      <div key={cat} className="flex items-center gap-1.5 text-[11px]">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                        <span className="text-gray-600 truncate flex-1">{cat}</span>
                        <span className="font-mono text-gray-500 flex-shrink-0">{expense > 0 ? Math.round(amt / expense * 100) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Top Projects (full row) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-800 text-sm">Топ прибыльных проектов</div>
            <Link href="/construction/projects">
              <button className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">Все проекты <ArrowRight className="w-3 h-3" /></button>
            </Link>
          </div>
          {topProjects.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">Нет данных по проектам</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {topProjects.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-emerald-600 mt-0.5">Прибыль: {fmtFull(p.profit)} KGS</div>
                    <div className="text-[10px] text-gray-400">Рент.: {p.margin.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Mini metrics row ── */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Себестоимость 1м²", value: costPerSqm > 0 ? fmt(costPerSqm) : "—", sub: "KGS/м²", delta: costPerSqm > 0 ? "vs прош. мес." : "" },
            { label: "Себестоимость проекта", value: fmt(expense), sub: "KGS всего", delta: expense > 0 ? "-1.3%" : "" },
            { label: "Отклонение от бюджета", value: fmt(netProfit), sub: "KGS", delta: netProfit < 0 ? "-6.2%" : "+0%", neg: netProfit < 0 },
            { label: "Самый доходный клиент", value: contracts[0]?.buyerName?.split(" ")[0] || "—", sub: contracts[0] ? fmt(contracts[0].paidAmount) + " KGS" : "" },
            { label: "Топ контрагент по расходам", value: ops.filter((o: any) => o.type === "expense")[0]?.description?.split(" ").slice(0, 2).join(" ") || "—", sub: "" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="text-[10px] text-gray-400 font-medium mb-1.5 leading-tight">{c.label}</div>
              <div className="text-base font-bold text-gray-900 truncate">{c.value}</div>
              {c.sub && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{c.sub}</div>}
              {c.delta && <div className={`text-[10px] mt-1 font-medium ${(c as any).neg ? "text-red-500" : "text-emerald-500"}`}>{c.delta}</div>}
            </div>
          ))}
        </div>

        {/* ── Bottom tables row ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Overdue */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-800">Просрочки платежей</span>
                {overdueAccruals.length > 0 && (
                  <span className="w-5 h-5 bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center rounded-full">{Math.min(9, overdueAccruals.length)}</span>
                )}
              </div>
              <Link href="/construction/planning/overdue">
                <button className="text-[11px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1">Все просрочки <ArrowRight className="w-3 h-3" /></button>
              </Link>
            </div>
            {overdueAccruals.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />Нет просрочек
              </div>
            ) : (
              <table className="w-full">
                <thead><tr className="border-b border-gray-50">
                  <th className="text-left px-4 py-2 text-[10px] text-gray-400">КОНТРАГЕНТ</th>
                  <th className="text-right px-4 py-2 text-[10px] text-gray-400">СУММА</th>
                  <th className="text-right px-4 py-2 text-[10px] text-gray-400">ДНЕЙ</th>
                </tr></thead>
                <tbody>
                  {overdueAccruals.slice(0, 3).map((a: any) => {
                    const days = Math.ceil((now.getTime() - new Date(a.dueDate).getTime()) / 86400000);
                    const contract = contracts.find((c: any) => c.id === a.contractId);
                    return (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-700 truncate max-w-[100px]">{contract?.buyerName || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-right font-mono text-red-600">{fmt(a.remainingAmount)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${days > 30 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>{days}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-800">Ближайшие поступления</span>
                {upcomingAccruals.length > 0 && (
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center rounded-full">{upcomingAccruals.length}</span>
                )}
              </div>
              <Link href="/construction/planning/forecast">
                <button className="text-[11px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1">Все поступления <ArrowRight className="w-3 h-3" /></button>
              </Link>
            </div>
            {upcomingAccruals.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-200" />Нет предстоящих
              </div>
            ) : (
              <table className="w-full">
                <thead><tr className="border-b border-gray-50">
                  <th className="text-left px-4 py-2 text-[10px] text-gray-400">КОНТРАГЕНТ</th>
                  <th className="text-right px-4 py-2 text-[10px] text-gray-400">СУММА</th>
                  <th className="text-right px-4 py-2 text-[10px] text-gray-400">ДАТА</th>
                </tr></thead>
                <tbody>
                  {upcomingAccruals.map((a: any) => {
                    const contract = contracts.find((c: any) => c.id === a.contractId);
                    return (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-700 truncate max-w-[100px]">{contract?.buyerName || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-right font-mono text-blue-600">{fmt(a.remainingAmount)}</td>
                        <td className="px-4 py-2.5 text-right text-[10px] text-gray-400">{a.dueDate?.slice(5).replace("-", ".")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent operations */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-800">Недавние операции</span>
              <Link href="/construction/operations">
                <button className="text-[11px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1">Все операции <ArrowRight className="w-3 h-3" /></button>
              </Link>
            </div>
            {recentOps.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">Нет операций</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOps.slice(0, 4).map((op: any) => {
                  const isIncome = op.type === "income";
                  const isTransfer = op.type === "transfer";
                  return (
                    <div key={op.id} className="px-4 py-2.5 hover:bg-gray-50/70 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-800 truncate">{op.description}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{op.category || "Операция"} · {op.date}</div>
                        </div>
                        <div className={`text-xs font-mono font-semibold flex-shrink-0 ${isIncome ? "text-emerald-600" : isTransfer ? "text-blue-600" : "text-gray-600"}`}>
                          {isIncome ? "+" : isTransfer ? "⇄" : "−"}{fmt(op.amountKgs)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───── RIGHT PANEL ───── */}
      <div className="w-64 flex-shrink-0 space-y-4">

        {/* My Tasks */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-sm text-gray-800">Мои задачи</span>
              <span className="w-5 h-5 bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center rounded-full">
                {tasks.filter(t => !t.done).length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {tasks.map(task => (
              <div key={task.id} className="px-4 py-2.5 flex items-start gap-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}>
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border ${task.done ? "bg-indigo-500 border-indigo-500" : "border-gray-200"}`}>
                  {task.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium leading-snug ${task.done ? "line-through text-gray-400" : "text-gray-700"}`}>{task.text}</div>
                  {task.sub && <div className="text-[10px] text-gray-400 mt-0.5">{task.sub}</div>}
                </div>
                <div className={`text-[10px] flex-shrink-0 font-medium mt-0.5 ${task.date === "Сегодня" ? "text-indigo-500" : task.date === "Завтра" ? "text-amber-500" : "text-gray-400"}`}>
                  {task.date}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-50">
            <Link href="/construction/planning/approvals">
              <button className="text-[11px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1 w-full justify-center py-1">
                Все задачи <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-sm text-gray-800">Уведомления</span>
              <span className="w-5 h-5 bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center rounded-full">
                {MOCK_NOTIFICATIONS.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {MOCK_NOTIFICATIONS.map(n => (
              <div key={n.id} className="px-4 py-2.5 flex items-start gap-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: n.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700">{n.text}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{n.sub}</div>
                </div>
                <div className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5 whitespace-nowrap">{n.time}</div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-50">
            <button className="text-[11px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1 w-full justify-center py-1">
              Все уведомления <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
