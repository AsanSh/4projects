import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Settings from "@/pages/settings";
import Dashboard from "@/pages/dashboard";
import Companies from "@/pages/companies";
import Users from "@/pages/users";
import Properties from "@/pages/properties";
import Counterparties from "@/pages/counterparties";
import RentalTenants from "@/pages/rental/tenants";
import RentalContracts from "@/pages/rental/leases";
import RentalProperties from "@/pages/rental/rental-properties";
import Accruals from "@/pages/rental/accruals";
import Payments from "@/pages/rental/payments";
import Deposits from "@/pages/rental/deposits";
import Expenses from "@/pages/rental/expenses";
import OwnerStatements from "@/pages/rental/statements";
import RentalDashboard from "@/pages/rental/rental-dashboard";
import ImportCenter from "@/pages/import-center";
import ActivityLog from "@/pages/activity-log";
import ChessBoard from "@/pages/ChessBoard";
import DebtReport from "@/pages/reports/DebtReport";
import RentalSummaryReport from "@/pages/reports/RentalSummaryReport";
import CashflowReport from "@/pages/reports/CashflowReport";
import PaymentsReport from "@/pages/reports/PaymentsReport";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <span className="text-sm text-gray-500">Загрузка...</span>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/companies"><ProtectedRoute component={Companies} /></Route>
      <Route path="/users"><ProtectedRoute component={Users} /></Route>
      <Route path="/counterparties"><ProtectedRoute component={Counterparties} /></Route>
      <Route path="/properties/chess"><ProtectedRoute component={ChessBoard} /></Route>
      <Route path="/properties"><ProtectedRoute component={Properties} /></Route>
      <Route path="/import"><ProtectedRoute component={ImportCenter} /></Route>
      <Route path="/activity"><ProtectedRoute component={ActivityLog} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route path="/rental/dashboard"><ProtectedRoute component={RentalDashboard} /></Route>
      <Route path="/rental/properties"><ProtectedRoute component={RentalProperties} /></Route>
      <Route path="/rental/tenants"><ProtectedRoute component={RentalTenants} /></Route>
      <Route path="/rental/contracts"><ProtectedRoute component={RentalContracts} /></Route>
      <Route path="/rental/accruals"><ProtectedRoute component={Accruals} /></Route>
      <Route path="/rental/payments"><ProtectedRoute component={Payments} /></Route>
      <Route path="/rental/deposits"><ProtectedRoute component={Deposits} /></Route>
      <Route path="/rental/expenses"><ProtectedRoute component={Expenses} /></Route>
      <Route path="/rental/statements"><ProtectedRoute component={OwnerStatements} /></Route>
      <Route path="/reports/debt"><ProtectedRoute component={DebtReport} /></Route>
      <Route path="/reports/rental"><ProtectedRoute component={RentalSummaryReport} /></Route>
      <Route path="/reports/cashflow"><ProtectedRoute component={CashflowReport} /></Route>
      <Route path="/reports/payments"><ProtectedRoute component={PaymentsReport} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
