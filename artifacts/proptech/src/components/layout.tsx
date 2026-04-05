import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  LayoutDashboard, Building2, Users, FileText, Receipt, CreditCard,
  Wallet, PiggyBank, Home, UserCircle, Settings, LogOut, ChevronRight,
  TrendingUp, BarChart3, Briefcase, Upload, Activity, ScrollText,
  BarChart2, Grid3X3, ShoppingCart, Bell, Wrench, FolderOpen,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  key?: string;
  color: string;
  textColor: string;
  items: NavItem[];
  moduleKey?: string;
}

const ALL_NAV_GROUPS: NavGroup[] = [
  {
    title: "Аренда",
    key: "rental",
    color: "from-blue-500 to-blue-600",
    textColor: "text-blue-600",
    moduleKey: "rental",
    items: [
      { href: "/rental/dashboard", label: "Дашборд аренды", icon: BarChart3 },
      { href: "/rental/properties", label: "Объекты", icon: Building2 },
      { href: "/rental/tenants", label: "Арендаторы", icon: Users },
      { href: "/rental/contracts", label: "Договоры", icon: FileText },
    ],
  },
  {
    title: "Финансы",
    key: "finance",
    color: "from-emerald-500 to-green-600",
    textColor: "text-emerald-600",
    items: [
      { href: "/rental/accruals", label: "Начисления", icon: Receipt },
      { href: "/rental/payments", label: "Платежи", icon: CreditCard },
      { href: "/rental/deposits", label: "Депозиты", icon: PiggyBank },
      { href: "/rental/expenses", label: "Расходы", icon: Wallet },
      { href: "/rental/statements", label: "Акты собственников", icon: ScrollText },
    ],
  },
  {
    title: "Справочник",
    key: "directory",
    color: "from-violet-500 to-purple-600",
    textColor: "text-violet-600",
    items: [
      { href: "/counterparties", label: "Контрагенты", icon: Briefcase },
      { href: "/properties/chess", label: "Шахматка", icon: Grid3X3 },
      { href: "/properties", label: "Реестр объектов", icon: Building2 },
      { href: "/users", label: "Сотрудники", icon: UserCircle },
    ],
  },
  {
    title: "Продажи",
    key: "sales",
    color: "from-amber-500 to-orange-500",
    textColor: "text-amber-600",
    moduleKey: "sales",
    items: [
      { href: "/sales/properties", label: "Объекты на продажу", icon: Building2 },
      { href: "/sales/contracts", label: "Договоры продажи", icon: FileText },
    ],
  },
  {
    title: "CRM",
    key: "crm",
    color: "from-pink-500 to-rose-500",
    textColor: "text-pink-600",
    moduleKey: "crm",
    items: [
      { href: "/crm/leads", label: "Лиды", icon: Users },
      { href: "/crm/pipeline", label: "Воронка продаж", icon: TrendingUp },
    ],
  },
  {
    title: "Обслуживание",
    key: "maintenance",
    color: "from-orange-500 to-amber-600",
    textColor: "text-orange-600",
    moduleKey: "maintenance",
    items: [
      { href: "/maintenance/requests", label: "Заявки", icon: Wrench },
    ],
  },
  {
    title: "Документы",
    key: "documents",
    color: "from-teal-500 to-cyan-600",
    textColor: "text-teal-600",
    moduleKey: "documents",
    items: [
      { href: "/documents", label: "Все документы", icon: FolderOpen },
    ],
  },
  {
    title: "Отчёты",
    key: "reports",
    color: "from-indigo-500 to-blue-600",
    textColor: "text-indigo-600",
    moduleKey: "reports",
    items: [
      { href: "/reports/debt", label: "Задолженность", icon: TrendingUp },
      { href: "/reports/rental", label: "Сводка аренды", icon: BarChart2 },
      { href: "/reports/cashflow", label: "Денежный поток", icon: Wallet },
      { href: "/reports/payments", label: "История платежей", icon: CreditCard },
    ],
  },
  {
    title: "Система",
    key: "system",
    color: "from-gray-400 to-slate-500",
    textColor: "text-gray-500",
    items: [
      { href: "/import", label: "Центр импорта", icon: Upload },
      { href: "/activity", label: "Лог активности", icon: Activity },
      { href: "/settings", label: "Настройки", icon: Settings },
    ],
  },
];

const COLOR_DOT: Record<string, string> = {
  "from-blue-500 to-blue-600": "bg-blue-500",
  "from-emerald-500 to-green-600": "bg-emerald-500",
  "from-violet-500 to-purple-600": "bg-violet-500",
  "from-amber-500 to-orange-500": "bg-amber-500",
  "from-pink-500 to-rose-500": "bg-pink-500",
  "from-orange-500 to-amber-600": "bg-orange-500",
  "from-teal-500 to-cyan-600": "bg-teal-500",
  "from-indigo-500 to-blue-600": "bg-indigo-500",
  "from-gray-400 to-slate-500": "bg-gray-400",
};

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();

  const { data: enabledModules = ["rental"] } = useQuery<string[]>({
    queryKey: ["modules", "enabled"],
    queryFn: () => api.get<string[]>("/modules/enabled").then(r => r.data),
    staleTime: 60_000,
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, { onSettled: () => logout() });
  };

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const visibleGroups = ALL_NAV_GROUPS.filter(group => {
    if (!group.moduleKey) return true;
    return enabledModules.includes(group.moduleKey);
  });

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";

  return (
    <div className="min-h-screen flex" style={{ background: "#f0f2f5" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 sticky top-0 h-screen overflow-hidden"
        style={{ background: "#1a1d2e", minWidth: 224 }}
      >
        {/* Brand */}
        <div className="px-4 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">BuildFlow</p>
              <p className="text-[10px] text-gray-500 leading-tight">Платформа управления</p>
            </div>
          </div>
        </div>

        {/* Top shortcut — Рабочий стол */}
        <div className="px-3 pb-2 flex-shrink-0">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
              isActive("/dashboard")
                ? "bg-white/10 text-white font-medium"
                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
            )}
          >
            <LayoutDashboard className={cn("w-4 h-4 flex-shrink-0", isActive("/dashboard") ? "text-white" : "text-gray-500")} />
            <span>Рабочий стол</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-white/5 flex-shrink-0" />

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-thin">
          {visibleGroups.map((group) => {
            const dot = COLOR_DOT[group.color] || "bg-gray-400";
            const anyActive = group.items.some(i => isActive(i.href));

            return (
              <div key={group.key} className="mb-1">
                {/* Section header */}
                <div className={cn(
                  "flex items-center gap-2 px-2 py-1.5 mb-0.5"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dot)} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {group.title}
                  </span>
                </div>

                {/* Items */}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5",
                        active
                          ? "bg-white/10 text-white font-medium"
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", active ? "text-white" : "text-gray-500")} />
                      <span className="flex-1 truncate text-[13px]">{item.label}</span>
                      {active && (
                        <div className={cn("w-1 h-4 rounded-full flex-shrink-0 bg-gradient-to-b", group.color)} />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User block */}
        <div className="px-3 py-3 border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-semibold text-xs flex-shrink-0 border border-blue-500/30">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-gray-600 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Выйти"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">BuildFlow</span>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
