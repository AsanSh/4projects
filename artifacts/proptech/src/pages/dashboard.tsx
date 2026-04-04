import { useGetDashboardSummary, useGetRentalOverview, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Home, CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: rentalOverview, isLoading: isRentalLoading } = useGetRentalOverview();
  const { data: activity, isLoading: isActivityLoading } = useGetDashboardActivity({ query: { enabled: true } });

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "0 с";
    return new Intl.NumberFormat('ru-KG', { style: 'currency', currency: 'KGS', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-2">Overview of your property portfolio and rental performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.totalProperties || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active in portfolio
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rented Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isRentalLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {rentalOverview?.byStatus.find(s => s.status === 'rented')?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently occupied
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent (Charged)</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isRentalLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(rentalOverview?.totalMonthlyRent)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total expected this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isRentalLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(rentalOverview?.totalOutstandingBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Overdue payments
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isActivityLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-6">
                {activity.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      {item.type === 'payment' ? (
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      ) : item.type === 'contract' ? (
                        <FileText className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Wallet className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Debtors */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Debtors</CardTitle>
          </CardHeader>
          <CardContent>
            {isRentalLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : rentalOverview?.topDebtors && rentalOverview.topDebtors.length > 0 ? (
              <div className="space-y-4">
                {rentalOverview.topDebtors.map((debtor, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{debtor.tenantName}</p>
                      <p className="text-xs text-muted-foreground">
                        Contract: {debtor.contractNumber}
                      </p>
                    </div>
                    <div className="font-medium text-destructive">
                      {formatCurrency(debtor.balance)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No outstanding debts
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Added FileText icon since it wasn't imported
function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}
