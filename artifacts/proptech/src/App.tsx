import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
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

const queryClient = new QueryClient();

const Contracts = () => <div className="p-8">Contracts Content</div>;
const ImportData = () => <div className="p-8">Import Data Content</div>;
const Statements = () => <div className="p-8">Statements Content</div>;
const Settings = () => <div className="p-8">Settings Content</div>;

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/companies"><ProtectedRoute component={Companies} /></Route>
      <Route path="/users"><ProtectedRoute component={Users} /></Route>
      <Route path="/counterparties"><ProtectedRoute component={Counterparties} /></Route>
      <Route path="/properties"><ProtectedRoute component={Properties} /></Route>
      <Route path="/contracts"><ProtectedRoute component={Contracts} /></Route>
      <Route path="/import"><ProtectedRoute component={ImportData} /></Route>
      <Route path="/rental/properties"><ProtectedRoute component={RentalProperties} /></Route>
      <Route path="/rental/tenants"><ProtectedRoute component={RentalTenants} /></Route>
      <Route path="/rental/contracts"><ProtectedRoute component={RentalContracts} /></Route>
      <Route path="/rental/accruals"><ProtectedRoute component={Accruals} /></Route>
      <Route path="/rental/payments"><ProtectedRoute component={Payments} /></Route>
      <Route path="/rental/deposits"><ProtectedRoute component={Deposits} /></Route>
      <Route path="/rental/expenses"><ProtectedRoute component={Expenses} /></Route>
      <Route path="/rental/statements"><ProtectedRoute component={Statements} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
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
