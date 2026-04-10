import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HardHat, TrendingUp, Wallet, CheckSquare, Building2, PieChart,
  ArrowRight, AlertCircle, Clock,
} from "lucide-react";

function fmtKgs(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн ₸`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} тыс ₸`;
  return `${v.toFixed(0)} ₸`;
}

const statusColors: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
};
const statusLabels: Record<string, string> = {
  planning: "Планирование", active: "Активен", completed: "Завершён", paused: "Приостановлен",
};

interface DashData {
  totalProjects: number; activeProjects: number; completedProjects: number;
  totalBudget: number; totalSpent: number; budgetRemaining: number;
  totalTasks: number; doneTasks: number;
  totalUnits: number; soldUnits: number; soldRevenue: number;
  projects: any[];
}

export default function ConstructionDashboard() {
  const { data, isLoading } = useQuery<DashData>({
    queryKey: ["construction-dashboard"],
    queryFn: () => api.get("/construction/dashboard").then(r => r.data),
  });

  const spentPct = data && data.totalBudget > 0 ? Math.min(100, (data.totalSpent / data.totalBudget) * 100) : 0;
  const taskPct = data && data.totalTasks > 0 ? Math.round((data.doneTasks / data.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Дашборд строительства</h1>
          <p className="text-sm text-gray-500 mt-0.5">Сводка по всем строительным проектам</p>
        </div>
        <Link href="/construction/projects">
          <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
            <Building2 className="w-4 h-4" /> К проектам
          </Button>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего проектов", value: data?.totalProjects, sub: `Активных: ${data?.activeProjects || 0}`, icon: HardHat, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Бюджет (план)", value: data ? fmtKgs(data.totalBudget) : "—", sub: `Освоено: ${data ? fmtKgs(data.totalSpent) : "—"}`, icon: Wallet, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Задачи", value: data ? `${data.doneTasks} / ${data.totalTasks}` : "—", sub: `Выполнено: ${taskPct}%`, icon: CheckSquare, color: "text-violet-500", bg: "bg-violet-50" },
          { label: "Квартиры", value: data ? `${data.soldUnits} / ${data.totalUnits}` : "—", sub: data ? `Выручка: ${fmtKgs(data.soldRevenue)}` : "—", icon: PieChart, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
            </div>
            {isLoading ? <Skeleton className="h-8 w-24 mb-1" /> : (
              <p className="text-2xl font-bold text-gray-900">{c.value ?? "—"}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Budget progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">Освоение бюджета</h3>
            <p className="text-sm text-gray-400">По всем проектам</p>
          </div>
          <span className={`text-lg font-bold ${spentPct > 90 ? "text-red-500" : spentPct > 70 ? "text-yellow-500" : "text-emerald-500"}`}>
            {spentPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${spentPct > 90 ? "bg-red-500" : spentPct > 70 ? "bg-yellow-500" : "bg-emerald-500"}`}
            style={{ width: `${spentPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Освоено: {data ? fmtKgs(data.totalSpent) : "—"}</span>
          <span>Остаток: {data ? fmtKgs(data.budgetRemaining) : "—"}</span>
          <span>План: {data ? fmtKgs(data.totalBudget) : "—"}</span>
        </div>
      </div>

      {/* Recent projects */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Проекты</h3>
          <Link href="/construction/projects">
            <button className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
              Все проекты <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {isLoading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1"><Skeleton className="h-4 w-48 mb-1" /><Skeleton className="h-3 w-32" /></div>
            </div>
          )) : !data?.projects?.length ? (
            <div className="px-5 py-10 text-center text-gray-400">
              <HardHat className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет проектов. <Link href="/construction/projects"><span className="text-orange-500 cursor-pointer">Создайте первый</span></Link></p>
            </div>
          ) : data.projects.map((p: any) => (
            <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <HardHat className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.address || p.region || "Адрес не указан"}</p>
              </div>
              <Badge className={statusColors[p.status] || ""} variant="secondary">
                {statusLabels[p.status] || p.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
