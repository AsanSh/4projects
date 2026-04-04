import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Building2, Users, FileText, Home, Upload, Settings, LayoutDashboard, Menu, LogOut, Wallet, Receipt, CreditCard } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logout();
      }
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/companies", label: "Companies", icon: Building2 },
    { href: "/users", label: "Users", icon: Users },
    { href: "/counterparties", label: "Counterparties", icon: Users },
    { href: "/properties", label: "Properties", icon: Home },
    { href: "/contracts", label: "Contracts", icon: FileText },
    { href: "/import", label: "Import Data", icon: Upload },
    { href: "/rental/properties", label: "Rental Properties", icon: Home },
    { href: "/rental/tenants", label: "Tenants", icon: Users },
    { href: "/rental/contracts", label: "Lease Contracts", icon: FileText },
    { href: "/rental/accruals", label: "Accruals", icon: Receipt },
    { href: "/rental/payments", label: "Payments", icon: CreditCard },
    { href: "/rental/deposits", label: "Deposits", icon: Wallet },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-r border-border md:h-screen md:sticky md:top-0 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h1 className="text-xl font-bold text-sidebar-foreground">BuildFlow</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 text-sidebar-foreground">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-sidebar-foreground border-sidebar-border" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 md:hidden">
          <h1 className="text-lg font-bold">BuildFlow</h1>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
