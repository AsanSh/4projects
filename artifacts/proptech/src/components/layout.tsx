import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  Search, Plus, MessageCircle, Zap, X,
  ShieldCheck, CalendarDays, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleId = "construction" | "rental" | "proptech" | "warehouse" | "consolidated";

interface NavItem { href: string; label: string; icon: React.ElementType }
interface NavSection { title: string; items: NavItem[] }
interface Module {
  id: ModuleId; label: string; shortLabel: string; icon: React.ElementType;
  color: string; gradient: string; urlPrefix: string[]; sections: NavSection[];
}

const MODULES: Module[] = [
  {
    id: "construction", label: "Контроль строительства", shortLabel: "Строительство",
    icon: HardHat, color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    urlPrefix: ["/construction"],
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
    icon: Home, color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    urlPrefix: ["/rental", "/settings/categories", "/settings/periods"],
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
      { title: "Администратор", items: [
        { href: "/rental/counterparties", label: "Контрагенты",       icon: Users },
        { href: "/rental/employees",      label: "Сотрудники",        icon: UserCircle },
        { href: "/settings/categories",   label: "Категории расходов",icon: Receipt },
        { href: "/settings/periods",      label: "Периоды учёта",     icon: CalendarDays },
        { href: "/rental/admin/log",      label: "Лог операций",      icon: Activity },
        { href: "/rental/settings",       label: "Настройки",         icon: Settings },
      ]},
    ],
  },
  {
    id: "proptech", label: "ПропТех", shortLabel: "ПропТех",
    icon: Building2, color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    urlPrefix: ["/proptech", "/sales", "/crm"],
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
    icon: ShoppingBag, color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    urlPrefix: ["/warehouse"],
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
    icon: Globe, color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    urlPrefix: ["/dashboard", "/counterparties", "/properties", "/users", "/settings", "/import", "/activity", "/companies", "/reports"],
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
        { href: "/settings",            label: "Настройки",     icon: Settings },
        { href: "/settings/legal",      label: "Юр. лица",      icon: Building },
        { href: "/settings/accounts",   label: "Счета",         icon: Landmark },
        { href: "/settings/roles",      label: "Роли",          icon: CheckSquare },
        { href: "/settings/categories", label: "Статьи операций", icon: Coins },
        { href: "/import",              label: "Импорт данных", icon: Calculator },
        { href: "/activity",            label: "Лог действий",  icon: Activity },
      ]},
    ],
  },
];

const MODULE_QUICK_ACTIONS: Record<ModuleId, { label: string; href: string; icon: React.ElementType }[]> = {
  construction: [
    { label: "Новая операция",   href: "/construction/operations",       icon: ArrowRightLeft },
    { label: "Новый договор",    href: "/construction/contracts-sales",  icon: FileText },
    { label: "Новый проект",     href: "/construction/projects",         icon: Map },
    { label: "Согласование",     href: "/construction/planning/approvals",icon: CheckSquare },
    { label: "Новый контрагент", href: "/construction/counterparties",   icon: Users },
  ],
  rental: [
    { label: "Новый платёж",    href: "/rental/payments",  icon: CreditCard },
    { label: "Новый договор",   href: "/rental/contracts", icon: FileText },
    { label: "Новый арендатор", href: "/rental/tenants",   icon: Users },
    { label: "Начисление",      href: "/rental/accruals",  icon: ListOrdered },
  ],
  proptech: [
    { label: "Новый лид",    href: "/crm/leads",        icon: Target },
    { label: "Новый договор",href: "/sales/contracts",  icon: FileText },
    { label: "Новый клиент", href: "/crm/clients",      icon: Users },
  ],
  warehouse: [
    { label: "Новый заказ",  href: "/warehouse/orders",    icon: ClipboardList },
    { label: "Новая заявка", href: "/warehouse/requests",  icon: Target },
    { label: "Поставщик",    href: "/warehouse/suppliers", icon: Factory },
  ],
  consolidated: [
    { label: "Новый объект",     href: "/properties",    icon: Building2 },
    { label: "Новый контрагент", href: "/counterparties",icon: Users },
    { label: "Импорт данных",    href: "/import",        icon: Calculator },
  ],
};

function detectModule(path: string): ModuleId {
  for (const m of MODULES) {
    if (m.urlPrefix.some(p => path.startsWith(p))) return m.id;
  }
  return "consolidated";
}

// ─── Neumorphic Nav Item ────────────────────────────────────────────────────
function NavItemTile({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <motion.div
        className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl text-[12.5px] cursor-pointer select-none relative overflow-hidden"
        style={active ? {
          background: "rgba(255,255,255,0.12)",
          boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.25), inset -1px -1px 3px rgba(255,255,255,0.06)",
        } : {
          background: "transparent",
        }}
        whileHover={{
          background: "rgba(255,255,255,0.07)",
          boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.2), inset -1px -1px 2px rgba(255,255,255,0.04)",
          transition: { duration: 0.15 },
        }}
        whileTap={{ scale: 0.97 }}
      >
        {active && (
          <motion.div
            layoutId="active-nav-pill"
            className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
            style={{ background: "rgba(255,255,255,0.6)" }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <Icon className={cn(
          "w-3.5 h-3.5 flex-shrink-0 transition-colors",
          active ? "text-white" : "text-white/35"
        )} />
        <span className={cn(
          "truncate transition-colors",
          active ? "text-white font-medium" : "text-white/55"
        )}>{item.label}</span>
      </motion.div>
    </Link>
  );
}

// ─── Collapsible Section ────────────────────────────────────────────────────
function SectionGroup({ section, location, defaultOpen }: {
  section: NavSection; location: string; defaultOpen?: boolean
}) {
  const isActive = section.items.some(i => location === i.href || location.startsWith(i.href + "/"));
  const [open, setOpen] = useState(isActive || !!defaultOpen);

  return (
    <div className="mb-0.5">
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10.5px] font-semibold text-white/25 hover:text-white/45 uppercase tracking-widest transition-colors"
        whileTap={{ scale: 0.98 }}
      >
        {section.title}
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronRight className="w-3 h-3" />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="space-y-0.5 ml-0.5 pb-1">
              {section.items.map(item => {
                const active = location === item.href || location.startsWith(item.href + "/");
                return <NavItemTile key={item.href} item={item} active={active} />;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Module Switcher Tiles ──────────────────────────────────────────────────
function ModuleTile({ m, active, onClick }: { m: Module; active: boolean; onClick: () => void }) {
  const Icon = m.icon;
  const dashHref = m.sections[0]?.items[0]?.href || "/dashboard";
  return (
    <Link href={dashHref}>
      <motion.div
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer relative overflow-hidden"
        style={active ? {
          background: "rgba(255,255,255,0.08)",
          boxShadow: "inset 1px 1px 4px rgba(0,0,0,0.2)",
        } : {}}
        whileHover={{
          background: "rgba(255,255,255,0.05)",
          transition: { duration: 0.12 },
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
          style={{ background: m.gradient }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className={cn("text-sm font-medium leading-none", active ? "text-white" : "text-white/70")}>{m.shortLabel}</div>
          <div className="text-[10px] text-white/30 mt-0.5 truncate max-w-[130px]">{m.label}</div>
        </div>
        {active && (
          <motion.div
            layoutId="module-active"
            className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/60"
          />
        )}
      </motion.div>
    </Link>
  );
}

// ─── FAB Bloom Button ───────────────────────────────────────────────────────
function FABBloom({ actions, moduleColor }: {
  actions: { label: string; href: string; icon: React.ElementType }[];
  moduleColor: string;
}) {
  const [open, setOpen] = useState(false);

  const angles = actions.map((_, i) => {
    const spread = Math.min(160, actions.length * 32);
    const start = 90 - spread / 2;
    return start + (spread / Math.max(actions.length - 1, 1)) * i;
  });

  return (
    <div className="relative flex flex-col items-center">
      {/* Sub-buttons bloom upward */}
      <AnimatePresence>
        {open && actions.map((action, i) => {
          const Icon = action.icon;
          const delay = i * 0.04;
          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -(i + 1) * 46, scale: 1 }}
              exit={{ opacity: 0, y: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 28, delay }}
              className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
              style={{ pointerEvents: open ? "auto" : "none" }}
            >
              <Link href={action.href}>
                <motion.div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-[11px] font-medium cursor-pointer shadow-lg whitespace-nowrap"
                  style={{ background: "rgba(30,35,60,0.95)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
                  onClick={() => setOpen(false)}
                  whileHover={{ scale: 1.04, background: "rgba(50,58,90,0.98)" }}
                  whileTap={{ scale: 0.96 }}
                >
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: moduleColor + "33" }}>
                    <Icon className="w-3 h-3" style={{ color: moduleColor }} />
                  </div>
                  {action.label}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="relative z-10 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white text-[12px] font-semibold shadow-lg"
        style={{
          background: open
            ? "rgba(255,255,255,0.1)"
            : `linear-gradient(135deg, ${moduleColor}cc, ${moduleColor}88)`,
          boxShadow: open
            ? "inset 2px 2px 6px rgba(0,0,0,0.3)"
            : `0 4px 15px ${moduleColor}44, 0 2px 4px rgba(0,0,0,0.2)`,
          border: `1px solid ${open ? "rgba(255,255,255,0.1)" : moduleColor + "55"}`,
        }}
        whileTap={{ scale: 0.96 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </motion.div>
        {!open && <span>Создать</span>}
      </motion.button>
    </div>
  );
}

// ─── 3D Flip User Card ──────────────────────────────────────────────────────
function UserCard({ user, logout }: { user: any; logout: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const initials = user?.firstName
    ? user.firstName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "АД";

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ perspective: 600, height: 52 }}
      onClick={() => setFlipped(f => !f)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex items-center gap-2.5 px-2 py-2 rounded-xl"
          style={{ backfaceVisibility: "hidden",
            background: "rgba(255,255,255,0.04)",
            boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.2)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7c3aed)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[12px] font-medium truncate leading-none">{user?.firstName || "Администратор"}</div>
            <div className="text-white/35 text-[10px] truncate mt-0.5">{user?.email || "admin@buildflow.kg"}</div>
          </div>
          <Settings className="w-3.5 h-3.5 text-white/20" />
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 flex items-center justify-around px-3 rounded-xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)",
            background: "rgba(255,255,255,0.07)",
            boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.25)" }}
        >
          <button
            className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <Settings className="w-4 h-4" />
            <span className="text-[9px]">Профиль</span>
          </button>
          <div className="w-px h-6 bg-white/10" />
          <button
            className="flex flex-col items-center gap-1 text-red-400/70 hover:text-red-400 transition-colors"
            onClick={(e) => { e.stopPropagation(); logout(); }}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[9px]">Выйти</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [modulePickerOpen, setModulePickerOpen] = useState(false);
  const modulePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modulePickerRef.current && !modulePickerRef.current.contains(e.target as Node)) {
        setModulePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeModuleId = detectModule(location);
  const activeModule = MODULES.find(m => m.id === activeModuleId) || MODULES[MODULES.length - 1];
  const ModuleIcon = activeModule.icon;
  const quickActions = MODULE_QUICK_ACTIONS[activeModuleId];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F2F8" }}>

      {/* ───── SIDEBAR ───── */}
      <aside
        className="w-[216px] flex-shrink-0 flex flex-col overflow-hidden relative z-20"
        style={{
          background: "linear-gradient(180deg, #0B0F1F 0%, #111827 60%, #0d1426 100%)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.35), inset -1px 0 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <motion.div
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: activeModule.gradient }}
            animate={{ background: activeModule.gradient }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <div className="text-white font-bold text-[14px] leading-none tracking-tight">BuildFlow</div>
            <div className="text-white/30 text-[10px] mt-0.5 tracking-wide">ERP Platform</div>
          </div>
        </div>

        {/* Module Switcher */}
        <div className="flex-shrink-0 px-3 py-2" ref={modulePickerRef}>
          <motion.button
            onClick={() => setModulePickerOpen(o => !o)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium transition-all"
            style={modulePickerOpen ? {
              background: "rgba(255,255,255,0.06)",
              boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.3)",
            } : {
              background: "rgba(255,255,255,0.04)",
              boxShadow: "2px 2px 6px rgba(0,0,0,0.2), -1px -1px 3px rgba(255,255,255,0.03)",
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: activeModule.gradient }}
              animate={{ background: activeModule.gradient }}
              transition={{ duration: 0.3 }}
            >
              <ModuleIcon className="w-3.5 h-3.5 text-white" />
            </motion.div>
            <span className="text-white/80 flex-1 text-left truncate">{activeModule.shortLabel}</span>
            <motion.div
              animate={{ rotate: modulePickerOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {modulePickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scaleY: 0.92 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -8, scaleY: 0.92 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  transformOrigin: "top",
                  background: "rgba(10,14,30,0.97)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  marginTop: 6,
                  overflow: "hidden",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                {MODULES.map(m => (
                  <ModuleTile
                    key={m.id}
                    m={m}
                    active={m.id === activeModuleId}
                    onClick={() => setModulePickerOpen(false)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 12px 8px" }} />

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto px-2 space-y-0.5"
          style={{ scrollbarWidth: "none" }}
        >
          {activeModule.sections.map((section, i) => (
            <SectionGroup
              key={section.title}
              section={section}
              location={location}
              defaultOpen={i === 0}
            />
          ))}
          <div className="h-4" />
        </nav>

        {/* FAB Quick Create */}
        <div className="px-3 pb-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
          <FABBloom actions={quickActions} moduleColor={activeModule.color} />
        </div>

        {/* User Card */}
        <div className="px-3 pb-3 flex-shrink-0">
          <UserCard user={user} logout={logout} />
        </div>
      </aside>

      {/* ───── MAIN AREA ───── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP HEADER ── */}
        <header
          className="h-14 flex items-center px-5 gap-3 flex-shrink-0 relative z-50"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
          }}
        >
          {/* Active module badge */}
          <motion.div
            key={activeModuleId}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0"
            style={{
              background: activeModule.color + "15",
              color: activeModule.color,
              border: `1px solid ${activeModule.color}25`,
            }}
          >
            <ModuleIcon className="w-4 h-4" />
            {activeModule.shortLabel}
          </motion.div>

          {/* Search */}
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-9 pr-14 py-1.5 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-gray-700 placeholder-gray-400"
              placeholder="Поиск по проектам, контрагентам, договорам..."
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">⌘К</span>
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <NotificationsPanel />
          {/* Messages */}
          <ChatPanel />

          <div className="w-px h-6 bg-gray-200" />

          {/* User profile */}
          <UserProfileDropdown />
        </header>

        {/* ── CONTENT ── */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>

    </div>
  );
}
