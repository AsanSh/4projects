import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  PiggyBank,
  Home,
  UserCircle,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
    ],
  },
  {
    title: "Недвижимость",
    items: [
      { href: "/rental/properties", label: "Объекты", icon: Building2 },
      { href: "/rental/tenants", label: "Арендаторы", icon: Users },
      { href: "/rental/contracts", label: "Договоры аренды", icon: FileText },
    ],
  },
  {
    title: "Финансы",
    items: [
      { href: "/rental/accruals", label: "Начисления", icon: Receipt },
      { href: "/rental/payments", label: "Платежи", icon: CreditCard },
      { href: "/rental/deposits", label: "Депозиты", icon: PiggyBank },
      { href: "/rental/expenses", label: "Расходы", icon: Wallet },
    ],
  },
  {
    title: "Справочники",
    items: [
      { href: "/counterparties", label: "Контрагенты", icon: Briefcase },
      { href: "/companies", label: "Компании", icon: Home },
      { href: "/users", label: "Сотрудники", icon: UserCircle },
    ],
  },
  {
    items: [
      { href: "/settings", label: "Настройки", icon: Settings },
    ],
  },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, { onSettled: () => logout() });
  };

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";

  return (
    <div className="min-h-screen flex" style={{ background: "#f4f6f9" }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 sticky top-0 h-screen"
        style={{ minWidth: 240 }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">BuildFlow</p>
              <p className="text-[11px] text-gray-400 leading-tight">Платформа управления</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.title && (
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5",
                      active
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-blue-600" : "text-gray-400")} />
                    <span>{item.label}</span>
                    {active && <ChevronRight className="w-3 h-3 ml-auto text-blue-400" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User block */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Выйти"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">BuildFlow</span>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
