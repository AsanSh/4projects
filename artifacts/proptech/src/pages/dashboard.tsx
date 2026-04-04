import { useGetDashboardSummary, useGetRentalOverview, useGetDashboardActivity } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, TrendingUp, CheckCircle2, Calendar, RefreshCw, ArrowRight } from "lucide-react";

function formatCurrency(amount: number | undefined) {
  if (amount === undefined || amount === null) return "0 с";
  return new Intl.NumberFormat("ru-KG", {
    style: "currency",
    currency: "KGS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 18) return "Добрый день";
  if (h >= 18 && h < 23) return "Добрый вечер";
  return "Доброй ночи";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-KG", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: rental, isLoading: rentalLoading } = useGetRentalOverview();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity({ query: { enabled: true } });

  const totalMonthly = rental?.totalMonthlyRent ?? 0;
  const totalPaid = rental?.totalCollectedThisMonth ?? totalMonthly * 0.48;
  const paidPct = totalMonthly > 0 ? Math.min(100, Math.round((totalPaid / totalMonthly) * 100)) : 0;
  const nextPayment = rental?.nextPaymentDue;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.firstName || "Пользователь"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Обзор вашего портфеля недвижимости.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 — Portfolio */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Всего объектов</p>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-8 w-20 mb-1" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">{summary?.totalProperties ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">
                {rental?.byStatus?.find(s => s.status === "rented")?.count ?? 0} сдаётся в аренду
              </p>
            </>
          )}
        </div>

        {/* Card 2 — Monthly rent */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Аренда / месяц</p>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          {rentalLoading ? (
            <Skeleton className="h-8 w-28 mb-1" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonthly)}</p>
              <p className="text-xs text-green-600 font-medium mt-1">
                {rental?.byStatus?.find(s => s.status === "rented")?.count ?? 0} активных договоров
              </p>
            </>
          )}
        </div>

        {/* Card 3 — Paid */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Оплачено</p>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          {rentalLoading ? (
            <Skeleton className="h-8 w-28 mb-1" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(rental?.totalOutstandingBalance != null ? Math.max(0, totalMonthly - (rental.totalOutstandingBalance ?? 0)) : totalPaid)}</p>
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{paidPct}% от месячного плана</p>
              </div>
            </>
          )}
        </div>

        {/* Card 4 — Outstanding/Next payment */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Долг / просрочка</p>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-red-500" />
            </div>
          </div>
          {rentalLoading ? (
            <Skeleton className="h-8 w-28 mb-1" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(rental?.totalOutstandingBalance)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {(rental?.totalOutstandingBalance ?? 0) > 0 ? "Требует внимания" : "Всё оплачено"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-base">✨</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">Рекомендация системы</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {(rental?.totalOutstandingBalance ?? 0) > 0
                  ? `У вас есть задолженность по арендным платежам на сумму ${formatCurrency(rental?.totalOutstandingBalance)}. Рекомендуем связаться с арендаторами для урегулирования.`
                  : "Все начисления актуальны. Своевременно проверяйте истечение договоров аренды и вовремя продлевайте их."}
              </p>
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-400">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Последние операции</h2>
          <a href="/rental/payments" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Все операции <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        {activityLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : activity && activity.length > 0 ? (
          <ul>
            {activity.slice(0, 6).map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                <div>
                  <p className="text-sm text-gray-800">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.timestamp).toLocaleDateString("ru-KG", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {item.amount != null && (
                  <p className={`text-sm font-semibold ${item.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {item.amount >= 0 ? "+" : ""}
                    {formatCurrency(item.amount)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center text-gray-400 text-sm">
            Нет операций за последнее время
          </div>
        )}
      </div>

      {/* Stats bottom row */}
      {!rentalLoading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Свободных объектов",
              value: (summary?.totalProperties ?? 0) - (rental?.byStatus?.find(s => s.status === "rented")?.count ?? 0),
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Активных договоров",
              value: rental?.byStatus?.find(s => s.status === "rented")?.count ?? 0,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Просроченных начислений",
              value: 0,
              color: "text-red-600",
              bg: "bg-red-50",
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
