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

import Investors from "@/pages/rental/investors";
import Investments from "@/pages/rental/investments";
import Distributions from "@/pages/rental/distributions";

import {
  ConstructionDashboard, ConstructionProjects, ConstructionStages, ConstructionTasks,
  ConstructionWorkers, ConstructionContractors, ConstructionMaterials,
  ConstructionBudget, ConstructionExpenses, ConstructionReports,
  ConstructionCounterparties, ConstructionEmployees,
  ProptechDashboard, SalesProperties, SalesContracts,
  CrmLeads, CrmPipeline, CrmClients,
  ProptechPayments, ProptechReports, ProptechCounterparties, ProptechEmployees,
  WarehouseDashboard, WarehouseItems, WarehouseIncoming, WarehouseOutgoing,
  WarehouseInventory, WarehouseCosts, WarehouseReports, WarehouseSuppliers, WarehouseEmployees,
  RentalCounterparties, RentalEmployees,
} from "@/pages/placeholder";

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
      <Route path="/"><Redirect to="/dashboard" /></Route>

      {/* ── Сводное (consolidated) ── */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/companies"><ProtectedRoute component={Companies} /></Route>
      <Route path="/users"><ProtectedRoute component={Users} /></Route>
      <Route path="/counterparties"><ProtectedRoute component={Counterparties} /></Route>
      <Route path="/properties/chess"><ProtectedRoute component={ChessBoard} /></Route>
      <Route path="/properties"><ProtectedRoute component={Properties} /></Route>
      <Route path="/import"><ProtectedRoute component={ImportCenter} /></Route>
      <Route path="/activity"><ProtectedRoute component={ActivityLog} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route path="/reports/debt"><ProtectedRoute component={DebtReport} /></Route>
      <Route path="/reports/rental"><ProtectedRoute component={RentalSummaryReport} /></Route>
      <Route path="/reports/cashflow"><ProtectedRoute component={CashflowReport} /></Route>
      <Route path="/reports/payments"><ProtectedRoute component={PaymentsReport} /></Route>

      {/* ── Аренда ── */}
      <Route path="/rental/dashboard"><ProtectedRoute component={RentalDashboard} /></Route>
      <Route path="/rental/properties"><ProtectedRoute component={RentalProperties} /></Route>
      <Route path="/rental/tenants"><ProtectedRoute component={RentalTenants} /></Route>
      <Route path="/rental/contracts"><ProtectedRoute component={RentalContracts} /></Route>
      <Route path="/rental/accruals"><ProtectedRoute component={Accruals} /></Route>
      <Route path="/rental/payments"><ProtectedRoute component={Payments} /></Route>
      <Route path="/rental/deposits"><ProtectedRoute component={Deposits} /></Route>
      <Route path="/rental/expenses"><ProtectedRoute component={Expenses} /></Route>
      <Route path="/rental/statements"><ProtectedRoute component={OwnerStatements} /></Route>
      <Route path="/rental/counterparties"><ProtectedRoute component={RentalCounterparties} /></Route>
      <Route path="/rental/employees"><ProtectedRoute component={RentalEmployees} /></Route>
      <Route path="/rental/investors"><ProtectedRoute component={Investors} /></Route>
      <Route path="/rental/investments"><ProtectedRoute component={Investments} /></Route>
      <Route path="/rental/distributions"><ProtectedRoute component={Distributions} /></Route>

      {/* ── Контроль строительства ── */}
      <Route path="/construction/dashboard"><ProtectedRoute component={ConstructionDashboard} /></Route>
      <Route path="/construction/projects"><ProtectedRoute component={ConstructionProjects} /></Route>
      <Route path="/construction/stages"><ProtectedRoute component={ConstructionStages} /></Route>
      <Route path="/construction/tasks"><ProtectedRoute component={ConstructionTasks} /></Route>
      <Route path="/construction/workers"><ProtectedRoute component={ConstructionWorkers} /></Route>
      <Route path="/construction/contractors"><ProtectedRoute component={ConstructionContractors} /></Route>
      <Route path="/construction/materials"><ProtectedRoute component={ConstructionMaterials} /></Route>
      <Route path="/construction/budget"><ProtectedRoute component={ConstructionBudget} /></Route>
      <Route path="/construction/expenses"><ProtectedRoute component={ConstructionExpenses} /></Route>
      <Route path="/construction/reports"><ProtectedRoute component={ConstructionReports} /></Route>
      <Route path="/construction/counterparties"><ProtectedRoute component={ConstructionCounterparties} /></Route>
      <Route path="/construction/employees"><ProtectedRoute component={ConstructionEmployees} /></Route>

      {/* ── ПропТех ── */}
      <Route path="/proptech/dashboard"><ProtectedRoute component={ProptechDashboard} /></Route>
      <Route path="/sales/properties"><ProtectedRoute component={SalesProperties} /></Route>
      <Route path="/sales/contracts"><ProtectedRoute component={SalesContracts} /></Route>
      <Route path="/crm/leads"><ProtectedRoute component={CrmLeads} /></Route>
      <Route path="/crm/pipeline"><ProtectedRoute component={CrmPipeline} /></Route>
      <Route path="/crm/clients"><ProtectedRoute component={CrmClients} /></Route>
      <Route path="/proptech/payments"><ProtectedRoute component={ProptechPayments} /></Route>
      <Route path="/proptech/reports"><ProtectedRoute component={ProptechReports} /></Route>
      <Route path="/proptech/counterparties"><ProtectedRoute component={ProptechCounterparties} /></Route>
      <Route path="/proptech/employees"><ProtectedRoute component={ProptechEmployees} /></Route>

      {/* ── Центральный склад ── */}
      <Route path="/warehouse/dashboard"><ProtectedRoute component={WarehouseDashboard} /></Route>
      <Route path="/warehouse/items"><ProtectedRoute component={WarehouseItems} /></Route>
      <Route path="/warehouse/incoming"><ProtectedRoute component={WarehouseIncoming} /></Route>
      <Route path="/warehouse/outgoing"><ProtectedRoute component={WarehouseOutgoing} /></Route>
      <Route path="/warehouse/inventory"><ProtectedRoute component={WarehouseInventory} /></Route>
      <Route path="/warehouse/costs"><ProtectedRoute component={WarehouseCosts} /></Route>
      <Route path="/warehouse/reports"><ProtectedRoute component={WarehouseReports} /></Route>
      <Route path="/warehouse/suppliers"><ProtectedRoute component={WarehouseSuppliers} /></Route>
      <Route path="/warehouse/employees"><ProtectedRoute component={WarehouseEmployees} /></Route>

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
