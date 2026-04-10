import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  LayoutDashboard, Building2, Users, FileText, Receipt, CreditCard,
  Wallet, PiggyBank, Home, UserCircle, Settings, LogOut,
  TrendingUp, BarChart3, Briefcase, Upload, Activity, ScrollText,
  BarChart2, Grid3X3, HardHat, Package, Globe,
  ChevronDown, ChevronRight, KeyRound, BarChart,
  Layers, Truck, ClipboardList, Hammer, Flag, Map,
  ShoppingBag, Target, Star, PieChart, Coins,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

// ── Module definitions ─────────────────────────────────────────────────────────

type ModuleId = "construction" | "rental" | "proptech" | "warehouse" | "consolidated";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface Module {
  id: ModuleId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;             // bg color for icon
  accentColor: string;       // active item indicator + dot
  urlPrefix: string[];       // URL prefixes that belong to this module
  sections: NavSection[];
}

const MODULES: Module[] = [
  {
    id: "construction",
    label: "Контроль строительства",
    shortLabel: "Строительство",
    icon: HardHat,
    color: "bg-orange-500",
    accentColor: "bg-orange-500",
    urlPrefix: ["/construction"],
    sections: [
      {
        title: "Управление",
        items: [
          { href: "/construction/dashboard", label: "Дашборд", icon: LayoutDashboard },
          { href: "/construction/projects", label: "Проекты", icon: Map },
          { href: "/construction/stages", label: "Этапы работ", icon: Flag },
          { href: "/construction/tasks", label: "Задачи", icon: ClipboardList },
        ],
      },
      {
        title: "Ресурсы",
        items: [
          { href: "/construction/workers", label: "Бригады / рабочие", icon: Hammer },
          { href: "/construction/contractors", label: "Подрядчики", icon: Briefcase },
          { href: "/construction/materials", label: "Материалы", icon: Package },
        ],
      },
      {
        title: "Финансы",
        items: [
          { href: "/construction/chess", label: "Шахматка", icon: Grid3X3 },
          { href: "/construction/budget", label: "Бюджет", icon: Wallet },
          { href: "/construction/expenses", label: "Расходы", icon: Receipt },
          { href: "/construction/reports", label: "Отчёты", icon: BarChart },
        ],
      },
      {
        title: "Справочник",
        items: [
          { href: "/construction/counterparties", label: "Контрагенты", icon: Briefcase },
          { href: "/construction/employees", label: "Сотрудники", icon: UserCircle },
        ],
      },
    ],
  },
  {
    id: "rental",
    label: "Аренда",
    shortLabel: "Аренда",
    icon: Home,
    color: "bg-blue-500",
    accentColor: "bg-blue-500",
    urlPrefix: ["/rental"],
    sections: [
      {
        title: "Управление",
        items: [
          { href: "/rental/dashboard", label: "Дашборд", icon: BarChart3 },
          { href: "/rental/properties", label: "Объекты", icon: Building2 },
          { href: "/rental/tenants", label: "Арендаторы", icon: Users },
          { href: "/rental/contracts", label: "Договоры", icon: FileText },
        ],
      },
      {
        title: "Финансы",
        items: [
          { href: "/rental/accruals", label: "Начисления", icon: Receipt },
          { href: "/rental/payments", label: "Платежи", icon: CreditCard },
          { href: "/rental/deposits", label: "Депозиты", icon: PiggyBank },
          { href: "/rental/expenses", label: "Расходы", icon: Wallet },
          { href: "/rental/statements", label: "Акты собственников", icon: ScrollText },
        ],
      },
      {
        title: "Аналитика",
        items: [
          { href: "/reports/debt", label: "Задолженность", icon: TrendingUp },
          { href: "/reports/rental", label: "Сводка аренды", icon: BarChart2 },
          { href: "/reports/cashflow", label: "Денежный поток", icon: Wallet },
          { href: "/reports/payments", label: "История платежей", icon: CreditCard },
        ],
      },
      {
        title: "Инвесторы",
        items: [
          { href: "/rental/investors", label: "Инвесторы", icon: Users },
          { href: "/rental/investments", label: "Доли в объектах", icon: PieChart },
          { href: "/rental/distributions", label: "Распределение прибыли", icon: Coins },
        ],
      },
      {
        title: "Справочник",
        items: [
          { href: "/rental/counterparties", label: "Контрагенты", icon: Briefcase },
          { href: "/rental/employees", label: "Сотрудники", icon: UserCircle },
          { href: "/properties/chess", label: "Шахматка", icon: Grid3X3 },
        ],
      },
    ],
  },
  {
    id: "proptech",
    label: "ПропТех",
    shortLabel: "ПропТех",
    icon: Building2,
    color: "bg-violet-500",
    accentColor: "bg-violet-500",
    urlPrefix: ["/sales", "/crm", "/proptech"],
    sections: [
      {
        title: "Продажи",
        items: [
          { href: "/proptech/dashboard", label: "Дашборд", icon: LayoutDashboard },
          { href: "/sales/properties", label: "Объекты на продажу", icon: Building2 },
          { href: "/sales/contracts", label: "Договоры продажи", icon: FileText },
        ],
      },
      {
        title: "CRM",
        items: [
          { href: "/crm/leads", label: "Лиды", icon: Target },
          { href: "/crm/pipeline", label: "Воронка продаж", icon: TrendingUp },
          { href: "/crm/clients", label: "Клиенты", icon: Star },
        ],
      },
      {
        title: "Финансы",
        items: [
          { href: "/proptech/payments", label: "Платежи", icon: CreditCard },
          { href: "/proptech/reports", label: "Отчёты", icon: BarChart },
        ],
      },
      {
        title: "Справочник",
        items: [
          { href: "/proptech/counterparties", label: "Контрагенты", icon: Briefcase },
          { href: "/proptech/employees", label: "Сотрудники", icon: UserCircle },
        ],
      },
    ],
  },
  {
    id: "warehouse",
    label: "Центральный склад",
    shortLabel: "Склад",
    icon: Package,
    color: "bg-emerald-500",
    accentColor: "bg-emerald-500",
    urlPrefix: ["/warehouse"],
    sections: [
      {
        title: "Склад",
        items: [
          { href: "/warehouse/dashboard", label: "Дашборд", icon: LayoutDashboard },
          { href: "/warehouse/items", label: "Товары / материалы", icon: ShoppingBag },
          { href: "/warehouse/incoming", label: "Поступления", icon: Truck },
          { href: "/warehouse/outgoing", label: "Списания / выдача", icon: Layers },
          { href: "/warehouse/inventory", label: "Инвентаризация", icon: ClipboardList },
        ],
      },
      {
        title: "Финансы",
        items: [
          { href: "/warehouse/costs", label: "Стоимость запасов", icon: Wallet },
          { href: "/warehouse/reports", label: "Отчёты", icon: BarChart },
        ],
      },
      {
        title: "Справочник",
        items: [
          { href: "/warehouse/suppliers", label: "Поставщики", icon: Briefcase },
          { href: "/warehouse/employees", label: "Сотрудники", icon: UserCircle },
        ],
      },
    ],
  },
  {
    id: "consolidated",
    label: "Сводное",
    shortLabel: "Сводное",
    icon: Globe,
    color: "bg-gray-500",
    accentColor: "bg-gray-400",
    urlPrefix: ["/dashboard", "/counterparties", "/properties", "/users", "/settings", "/import", "/activity", "/companies", "/reports"],
    sections: [
      {
        title: "Сводный дашборд",
        items: [
          { href: "/dashboard", label: "Главный дашборд", icon: LayoutDashboard },
        ],
      },
      {
        title: "Общие справочники",
        items: [
          { href: "/counterparties", label: "Все контрагенты", icon: Briefcase },
          { href: "/properties", label: "Реестр объектов", icon: Building2 },
          { href: "/users", label: "Все сотрудники", icon: UserCircle },
        ],
      },
      {
        title: "Аналитика",
        items: [
          { href: "/reports/debt", label: "Задолженность", icon: TrendingUp },
          { href: "/reports/cashflow", label: "Денежный поток", icon: Wallet },
          { href: "/reports/payments", label: "История платежей", icon: CreditCard },
        ],
      },
      {
        title: "Система",
        items: [
          { href: "/import", label: "Центр импорта", icon: Upload },
          { href: "/activity", label: "Лог активности", icon: Activity },
          { href: "/settings", label: "Настройки", icon: Settings },
        ],
      },
    ],
  },
];

// ── Detect active module from URL ─────────────────────────────────────────────

function detectModuleFromPath(path: string): ModuleId {
  for (const mod of MODULES) {
    for (const prefix of mod.urlPrefix) {
      if (path === prefix || path.startsWith(prefix + "/")) return mod.id;
    }
  }
  return "consolidated";
}

// ── Layout ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();

  const detectedModule = detectModuleFromPath(location);
  const [activeModuleId, setActiveModuleId] = useState<ModuleId>(detectedModule);

  // Sync module to URL changes
  useEffect(() => {
    setActiveModuleId(detectModuleFromPath(location));
  }, [location]);

  // Collapsed sections state per module
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, { onSettled: () => logout() });
  };

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const activeModule = MODULES.find(m => m.id === activeModuleId) || MODULES[MODULES.length - 1];

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";

  return (
    <div className="min-h-screen flex" style={{ background: "#f0f2f5" }}>
      {/* ── Sidebar ── */}
      <aside
        className="hidden md:flex flex-col sticky top-0 h-screen overflow-hidden"
        style={{ background: "#1a1d2e", width: 220, minWidth: 220 }}
      >
        {/* Brand */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
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

        {/* ── Context nav for selected module ── */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 scrollbar-thin">
          {activeModule.sections.map((section, si) => {
            const sectionKey = `${activeModuleId}:${si}`;
            const isCollapsed = collapsedSections[sectionKey];
            const anyActive = section.items.some(i => isActive(i.href));

            return (
              <div key={sectionKey} className="mb-1">
                {/* Section header — clickable to collapse */}
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 mb-0.5 group"
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    anyActive ? activeModule.accentColor : "bg-gray-600"
                  )} />
                  <span className="flex-1 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 group-hover:text-gray-400 transition-colors">
                    {section.title}
                  </span>
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                    : <ChevronDown className="w-3 h-3 text-gray-600 flex-shrink-0" />
                  }
                </button>

                {/* Nav items */}
                {!isCollapsed && section.items.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12.5px] transition-all mb-0.5",
                        active
                          ? "bg-white/10 text-white font-medium"
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", active ? "text-white" : "text-gray-500")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {active && (
                        <div className={cn("w-1 h-3.5 rounded-full flex-shrink-0", activeModule.accentColor)} />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* ── User block ── */}
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

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">BuildFlow</span>
          <span className="text-gray-400 text-sm ml-1">— {activeModule.label}</span>
        </header>

        {/* Module breadcrumb bar */}
        <div
          className="hidden md:flex items-center gap-2 px-6 py-2 border-b border-white/5 flex-shrink-0"
          style={{ background: "#1a1d2e" }}
        >
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            const isSelected = mod.id === activeModuleId;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModuleId(mod.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all",
                  isSelected
                    ? `${mod.color} text-white shadow-sm`
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                )}
              >
                <Icon className="w-3 h-3" />
                {mod.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
