import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import NotificationsPanel from "@/components/notifications-panel";
import ChatPanel from "@/components/chat-panel";
import UserProfileDropdown from "@/components/user-profile-dropdown";
import {
  LayoutDashboard, Building2, Users, FileText, Receipt, CreditCard,
  Wallet, PiggyBank, Home, UserCircle, Settings, LogOut,
  TrendingUp, BarChart3, Briefcase, Activity, ScrollText,
  BarChart2, Grid3X3, HardHat, Package, Globe,
  ChevronDown, ChevronRight,
  Layers, Truck, ClipboardList, Hammer, Flag, Map,
  ShoppingBag, Target, PieChart, Coins, DollarSign,
  LineChart, AlertTriangle, Bell, CheckSquare, ArrowRightLeft,
  ListOrdered, Calculator, Building, Send, Calendar,
  BarChart, Landmark, Scale, Factory,
  Search, Plus, MessageCircle, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleId = "construction" | "rental" | "proptech" | "warehouse" | "consolidated";

interface NavItem { href: string; label: string; icon: React.ElementType }
interface NavSection { title: string; items: NavItem[] }
interface Module {
  id: ModuleId; label: string; shortLabel: string; icon: React.ElementType;
  color: string; urlPrefix: string[]; sections: NavSection[];
}

const MODULES: Module[] = [
  {
    id: "construction", label: "Контроль строительства", shortLabel: "Строительство",
    icon: HardHat, color: "#f97316", urlPrefix: ["/construction"],
    sections: [
      { title: "Управление", items: [
        { href: "/construction/dashboard",   label: "Дашборд",      icon: LayoutDashboard },
        { href: "/construction/operations",  label: "Операции",     icon: ArrowRightLeft },
        { href: "/construction/projects",    label: "Проекты",      icon: Map },
        { href: "/construction/stages",      label: "Этапы работ",  icon: Flag },
        { href: "/construction/tasks",       label: "Задачи",       icon: ClipboardList },
      ]},
      { title: "Ресурсы", items: [
        { href: "/construction/workers",     label: "Бригады",        icon: Hammer },
        { href: "/construction/contractors", label: "Подрядчики",     icon: Briefcase },
        { href: "/construction/materials",   label: "Материалы",      icon: Package },
      ]},
      { title: "Финансы", items: [
        { href: "/construction/chess",            label: "Шахматка",       icon: Grid3X3 },
        { href: "/construction/contracts-sales",  label: "Договоры",       icon: FileText },
        { href: "/construction/accruals",         label: "Начисление",     icon: ListOrdered },
        { href: "/construction/cashier",          label: "Приём платежей", icon: DollarSign },
        { href: "/construction/accounts",         label: "Счета",          icon: Landmark },
      ]},
      { title: "Аналитика", items: [
        { href: "/construction/analytics/cashflow", label: "ОДДС",           icon: BarChart3 },
        { href: "/construction/analytics/pnl",      label: "ОПУ",            icon: LineChart },
        { href: "/construction/analytics/expenses", label: "Анализ расходов",icon: PieChart },
        { href: "/construction/analytics/debt",     label: "Задолженности",  icon: AlertTriangle },
      ]},
      { title: "Планирование", items: [
        { href: "/construction/budget",              label: "Бюджет",              icon: Wallet },
        { href: "/construction/planning/forecast",   label: "Будущие поступления", icon: Calendar },
        { href: "/construction/planning/overdue",    label: "Просрочки",           icon: AlertTriangle },
        { href: "/construction/planning/approvals",  label: "Согласование",        icon: CheckSquare },
        { href: "/construction/planning/broadcast",  label: "Рассылка",            icon: Send },
      ]},
      { title: "Справочники", items: [
        { href: "/construction/counterparties", label: "Контрагенты", icon: Users },
        { href: "/construction/employees",      label: "Сотрудники",  icon: UserCircle },
        { href: "/construction/settings",       label: "Настройки",   icon: Settings },
      ]},
    ],
  },
  {
    id: "rental", label: "Аренда", shortLabel: "Аренда",
    icon: Home, color: "#3b82f6", urlPrefix: ["/rental"],
    sections: [
      { title: "Управление", items: [
        { href: "/rental/dashboard",  label: "Дашборд",    icon: BarChart3 },
        { href: "/rental/properties", label: "Объекты",    icon: Building2 },
        { href: "/rental/tenants",    label: "Арендаторы", icon: Users },
        { href: "/rental/contracts",  label: "Договоры",   icon: FileText },
      ]},
      { title: "Финансы", items: [
        { href: "/rental/accruals",   label: "Начисление",         icon: ListOrdered },
        { href: "/rental/payments",   label: "Платежи",            icon: CreditCard },
        { href: "/rental/deposits",   label: "Депозиты",           icon: PiggyBank },
        { href: "/rental/expenses",   label: "Расходы",            icon: Receipt },
        { href: "/rental/statements", label: "Акты собственников", icon: ScrollText },
        { href: "/rental/accounts",   label: "Расчётные счета",    icon: Landmark },
      ]},
      { title: "Аналитика", items: [
        { href: "/rental/analytics/odds",     label: "ОДДС",             icon: BarChart3 },
        { href: "/rental/analytics/opu",      label: "ОПУ",              icon: LineChart },
        { href: "/rental/analytics/debt",     label: "Задолженность",    icon: AlertTriangle },
        { href: "/rental/analytics/history",  label: "История платежей", icon: Activity },
        { href: "/rental/analytics/owners",   label: "Отчёты владельцев", icon: ScrollText },
        { href: "/rental/analytics/summary",  label: "Сводный отчёт",    icon: PieChart },
      ]},
      { title: "Инвесторы", items: [
        { href: "/rental/investors",     label: "Инвесторы",           icon: Users },
        { href: "/rental/investments",   label: "Доли в объектах",     icon: PieChart },
        { href: "/rental/distributions", label: "Распределение", icon: Coins },
      ]},
      { title: "Планирование", items: [
        { href: "/rental/planning/forecast",  label: "Будущие поступления", icon: Calendar },
        { href: "/rental/planning/overdue",   label: "Просрочки",           icon: AlertTriangle },
        { href: "/rental/planning/broadcast", label: "Рассылка",            icon: Send },
      ]},
      { title: "Справочники", items: [
        { href: "/rental/counterparties", label: "Контрагенты", icon: Users },
        { href: "/rental/employees",      label: "Сотрудники",  icon: UserCircle },
        { href: "/rental/settings",       label: "Настройки",   icon: Settings },
      ]},
    ],
  },
  {
    id: "proptech", label: "ПропТех", shortLabel: "ПропТех",
    icon: Building2, color: "#8b5cf6", urlPrefix: ["/proptech", "/sales", "/crm"],
    sections: [
      { title: "Управление", items: [
        { href: "/proptech/dashboard",  label: "Дашборд",   icon: LayoutDashboard },
        { href: "/proptech/properties", label: "Объекты",   icon: Building2 },
        { href: "/proptech/finances",   label: "Финансы",   icon: Wallet },
        { href: "/proptech/documents",  label: "Документы", icon: FileText },
      ]},
      { title: "CRM", items: [
        { href: "/crm/leads",    label: "Лиды",          icon: Target },
        { href: "/crm/pipeline", label: "Воронка",       icon: TrendingUp },
        { href: "/crm/clients",  label: "Клиенты",       icon: Users },
        { href: "/sales/properties", label: "На продажу",icon: Building2 },
        { href: "/sales/contracts",  label: "Договоры",  icon: FileText },
      ]},
      { title: "Аналитика", items: [
        { href: "/proptech/analytics/odds",     label: "ОДДС",             icon: BarChart3 },
        { href: "/proptech/analytics/opu",      label: "ОПУ",              icon: LineChart },
        { href: "/proptech/analytics/debt",     label: "Задолженность",    icon: AlertTriangle },
        { href: "/proptech/analytics/summary",  label: "Сводка объектов",  icon: Grid3X3 },
        { href: "/proptech/analytics/cashflow", label: "Денежный поток",   icon: TrendingUp },
      ]},
      { title: "Инвесторы", items: [
        { href: "/proptech/investors",     label: "Инвесторы",       icon: Users },
        { href: "/proptech/investments",   label: "Доли",            icon: PieChart },
        { href: "/proptech/distributions", label: "Распределение",   icon: Coins },
      ]},
      { title: "Справочники", items: [
        { href: "/proptech/counterparties", label: "Контрагенты", icon: Users },
        { href: "/proptech/settings",       label: "Настройки",   icon: Settings },
      ]},
    ],
  },
  {
    id: "warehouse", label: "Закуп / Снабжение", shortLabel: "Закуп",
    icon: ShoppingBag, color: "#10b981", urlPrefix: ["/warehouse"],
    sections: [
      { title: "Управление", items: [
        { href: "/warehouse/dashboard",  label: "Дашборд",        icon: LayoutDashboard },
        { href: "/warehouse/suppliers",  label: "Поставщики",     icon: Factory },
        { href: "/warehouse/items",      label: "Товары",         icon: ShoppingBag },
        { href: "/warehouse/orders",     label: "Заказы",         icon: ClipboardList },
        { href: "/warehouse/companies",  label: "Компании",       icon: Building },
        { href: "/warehouse/requests",   label: "Заявки прорабов",icon: Target },
      ]},
      { title: "Склад", items: [
        { href: "/warehouse/incoming",  label: "Поступления",      icon: Truck },
        { href: "/warehouse/outgoing",  label: "Списания / выдача",icon: Layers },
        { href: "/warehouse/inventory", label: "Инвентаризация",   icon: Scale },
      ]},
      { title: "Финансы и отчёты", items: [
        { href: "/warehouse/costs",   label: "Стоимость запасов", icon: Wallet },
        { href: "/warehouse/reports", label: "Отчёты",            icon: BarChart },
      ]},
      { title: "Справочники", items: [
        { href: "/warehouse/counterparties", label: "Контрагенты", icon: Users },
        { href: "/warehouse/settings",       label: "Настройки",   icon: Settings },
      ]},
    ],
  },
  {
    id: "consolidated", label: "Сводное", shortLabel: "Сводное",
    icon: Globe, color: "#6b7280", urlPrefix: ["/dashboard", "/counterparties", "/properties", "/users", "/settings", "/import", "/activity", "/companies", "/reports"],
    sections: [
      { title: "Главная", items: [
        { href: "/dashboard",     label: "Главный дашборд",  icon: LayoutDashboard },
        { href: "/properties",    label: "Объекты",          icon: Building2 },
        { href: "/counterparties",label: "Контрагенты",      icon: Users },
        { href: "/companies",     label: "Компании",         icon: Building },
        { href: "/users",         label: "Пользователи",     icon: UserCircle },
      ]},
      { title: "Отчёты", items: [
        { href: "/reports/debt",     label: "Задолженность",   icon: AlertTriangle },
        { href: "/reports/cashflow", label: "Денежный поток",  icon: BarChart3 },
        { href: "/reports/rental",   label: "Сводка аренды",   icon: BarChart2 },
        { href: "/reports/payments", label: "История платежей",icon: Activity },
      ]},
      { title: "Система", items: [
        { href: "/settings",          label: "Настройки",     icon: Settings },
        { href: "/settings/legal",    label: "Юр. лица",      icon: Building },
        { href: "/settings/accounts", label: "Счета",         icon: Landmark },
        { href: "/settings/roles",    label: "Роли",          icon: CheckSquare },
        { href: "/import",            label: "Импорт данных", icon: Calculator },
        { href: "/activity",          label: "Лог действий",  icon: Activity },
      ]},
    ],
  },
];

const MODULE_QUICK_ACTIONS: Record<ModuleId, { label: string; href: string }[]> = {
  construction: [
    { label: "Новая операция",   href: "/construction/operations" },
    { label: "Новый договор",    href: "/construction/contracts-sales" },
    { label: "Новый проект",     href: "/construction/projects" },
    { label: "Согласование",     href: "/construction/planning/approvals" },
    { label: "Новый контрагент", href: "/construction/counterparties" },
  ],
  rental: [
    { label: "Новый платёж",   href: "/rental/payments" },
    { label: "Новый договор",  href: "/rental/contracts" },
    { label: "Новый арендатор",href: "/rental/tenants" },
    { label: "Начисление",     href: "/rental/accruals" },
  ],
  proptech: [
    { label: "Новый лид",    href: "/crm/leads" },
    { label: "Новый договор",href: "/sales/contracts" },
    { label: "Новый клиент", href: "/crm/clients" },
  ],
  warehouse: [
    { label: "Новый заказ",   href: "/warehouse/orders" },
    { label: "Новая заявка",  href: "/warehouse/requests" },
    { label: "Поставщик",     href: "/warehouse/suppliers" },
  ],
  consolidated: [
    { label: "Новый объект",     href: "/properties" },
    { label: "Новый контрагент", href: "/counterparties" },
    { label: "Импорт данных",    href: "/import" },
  ],
};

function detectModule(path: string): ModuleId {
  for (const m of MODULES) {
    if (m.urlPrefix.some(p => path.startsWith(p))) return m.id;
  }
  return "consolidated";
}

interface SectionGroupProps {
  section: NavSection;
  location: string;
  defaultOpen?: boolean;
}

function SectionGroup({ section, location, defaultOpen }: SectionGroupProps) {
  const isActive = section.items.some(i => location === i.href || location.startsWith(i.href + "/"));
  const [open, setOpen] = useState(isActive || !!defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-semibold text-white/30 hover:text-white/50 uppercase tracking-wider transition-colors"
      >
        {section.title}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && (
        <div className="ml-1 space-y-0.5">
          {section.items.map(item => {
            const active = location === item.href || location.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] cursor-pointer transition-all duration-150 group",
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                )}>
                  <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", active ? "text-white" : "text-white/40 group-hover:text-white/70")} />
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [modulePickerOpen, setModulePickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const modulePickerRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modulePickerRef.current && !modulePickerRef.current.contains(e.target as Node)) {
        setModulePickerOpen(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeModuleId = detectModule(location);
  const activeModule = MODULES.find(m => m.id === activeModuleId) || MODULES[MODULES.length - 1];
  const ModuleIcon = activeModule.icon;
  const quickActions = MODULE_QUICK_ACTIONS[activeModuleId];

  const initials = user?.firstName
    ? user.firstName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "АД";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7F8FC" }}>

      {/* ───── SIDEBAR ───── */}
      <aside
        className="w-[220px] flex-shrink-0 flex flex-col overflow-hidden relative z-20"
        style={{ background: "linear-gradient(180deg, #0B1020 0%, #121A33 100%)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#4F46E5" }}>
            <HardHat className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">BuildFlow</div>
            <div className="text-white/40 text-[10px] mt-0.5">Платформа управления</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-2 scrollbar-thin" style={{ scrollbarColor: "#ffffff12 transparent" }}>
          {activeModule.sections.map((section, i) => (
            <SectionGroup
              key={section.title}
              section={section}
              location={location}
              defaultOpen={i === 0}
            />
          ))}
        </nav>

        {/* Quick create */}
        <div className="px-3 pb-2 border-t border-white/10 pt-3">
          <div className="flex items-center gap-1.5 px-2 mb-1.5">
            <Zap className="w-3 h-3 text-white/30" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Быстрое создание</span>
          </div>
          {quickActions.map(qa => (
            <Link key={qa.href} href={qa.href}>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/8 text-[12px] cursor-pointer transition-all">
                <Plus className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                {qa.label}
              </div>
            </Link>
          ))}
        </div>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/8 transition-all cursor-pointer group">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0" style={{ background: "#4F46E5" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[12px] font-medium truncate leading-none">{user?.firstName || "Администратор"}</div>
              <div className="text-white/40 text-[10px] truncate mt-0.5">{user?.email || "admin@buildflow.kg"}</div>
            </div>
            <button onClick={logout} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <LogOut className="w-3.5 h-3.5 text-white/40 hover:text-white/70" />
            </button>
          </div>
        </div>
      </aside>

      {/* ───── MAIN AREA ───── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP HEADER ── */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-3 flex-shrink-0 z-10 shadow-sm">

          {/* Module switcher */}
          <div className="relative" ref={modulePickerRef}>
            <button
              onClick={() => setModulePickerOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-700 bg-white transition-all whitespace-nowrap"
            >
              <ModuleIcon className="w-4 h-4 flex-shrink-0" style={{ color: activeModule.color }} />
              <span>{activeModule.shortLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </button>
            {modulePickerOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-xl py-1 overflow-hidden" style={{ zIndex: 9999, minWidth: "210px" }}>
                {MODULES.map(m => {
                  const Icon = m.icon;
                  const dashboardHref = m.sections[0]?.items[0]?.href || "/dashboard";
                  return (
                    <Link key={m.id} href={dashboardHref}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors whitespace-nowrap",
                          m.id === activeModuleId ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-700"
                        )}
                        onClick={() => setModulePickerOpen(false)}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: m.color }} />
                        {m.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-9 pr-14 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-gray-700 placeholder-gray-400"
              placeholder="Поиск по проектам, контрагентам, договорам..."
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">⌘К</span>
          </div>

          <div className="flex-1" />

          {/* Create button */}
          <div className="relative" ref={createRef}>
            <button
              onClick={() => setCreateOpen(o => !o)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md whitespace-nowrap"
              style={{ background: "#4F46E5" }}
            >
              <Plus className="w-4 h-4" />
              Создать
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-70" />
            </button>
            {createOpen && (
              <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-xl border border-gray-100 shadow-xl py-1" style={{ zIndex: 9999 }}>
                {quickActions.map(qa => (
                  <Link key={qa.href} href={qa.href}>
                    <div className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setCreateOpen(false)}>
                      {qa.label}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationsPanel />

          {/* Messages */}
          <ChatPanel />

          {/* Divider */}
          <div className="w-px h-6 bg-gray-100" />

          {/* User profile */}
          <UserProfileDropdown />
        </header>

        {/* ── CONTENT ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
