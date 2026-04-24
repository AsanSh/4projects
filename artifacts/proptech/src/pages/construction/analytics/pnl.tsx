import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LineChart, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";

function fmtFull(n: any) {
  const v = parseFloat(n || "0");
  if (isNaN(v)) return "0";
  return new Intl.NumberFormat("ru-RU").format(v);
}

export default function ConstructionPnL() {
  const { data: summary } = useQuery({
    queryKey: ["construction-analytics-summary"],
    queryFn: () => api.get("/construction/analytics/summary").then(r => r.data),
  });

  const income = parseFloat(summary?.opStats?.totalIncome || "0");
  const expense = parseFloat(summary?.opStats?.totalExpense || "0");
  const profit = income - expense;
  const margin = income > 0 ? (profit / income * 100).toFixed(1) : "0";

  const totalContracts = parseFloat(summary?.contractStats?.totalAmount || "0");
  const totalPaid = parseFloat(summary?.contractStats?.totalPaid || "0");
  const totalRemaining = parseFloat(summary?.contractStats?.totalRemaining || "0");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ОПУ</h1>
          <p className="text-gray-500 text-sm mt-0.5">Отчёт о прибылях и убытках</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* P&L summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-700 mb-4">Финансовый результат (операции)</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2 text-sm"><TrendingUp className="w-4 h-4 text-emerald-500" />Выручка (доходы)</div>
              <div className="font-mono font-bold text-emerald-600">+{fmtFull(income)}</div>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2 text-sm"><TrendingDown className="w-4 h-4 text-red-500" />Расходы</div>
              <div className="font-mono font-bold text-red-600">-{fmtFull(expense)}</div>
            </div>
            <div className={`flex items-center justify-between py-3 rounded-lg px-3 ${profit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BarChart2 className={`w-4 h-4 ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`} />
                Чистая прибыль
              </div>
              <div className={`font-mono font-bold text-lg ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {profit >= 0 ? "+" : ""}{fmtFull(profit)}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 px-1">
              <span>Рентабельность</span>
              <span className={`font-bold ${parseFloat(margin) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{margin}%</span>
            </div>
          </div>
        </div>

        {/* Sales summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-700 mb-4">Продажи (договоры)</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <div className="text-sm text-gray-600">Всего по договорам</div>
              <div className="font-mono font-bold">{fmtFull(totalContracts)}</div>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <div className="text-sm text-gray-600">Получено</div>
              <div className="font-mono font-bold text-emerald-600">{fmtFull(totalPaid)}</div>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <div className="text-sm text-gray-600">Ожидается</div>
              <div className="font-mono font-bold text-orange-600">{fmtFull(totalRemaining)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1.5">Собранность платежей</div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${totalContracts > 0 ? Math.round(totalPaid / totalContracts * 100) : 0}%` }} />
              </div>
              <div className="text-xs text-right text-gray-400 mt-1">
                {totalContracts > 0 ? Math.round(totalPaid / totalContracts * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="text-sm font-semibold text-gray-700 mb-3">Структура ОПУ</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Статья</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Сумма (KGS)</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">%</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50 bg-emerald-50/40">
                <td className="px-4 py-2.5 font-medium text-emerald-700">Доходы от операций</td>
                <td className="px-4 py-2.5 text-right font-mono text-emerald-600">+{fmtFull(income)}</td>
                <td className="px-4 py-2.5 text-right text-emerald-600">100%</td>
              </tr>
              <tr className="border-b border-gray-50 bg-red-50/30">
                <td className="px-4 py-2.5 font-medium text-red-700">Расходы</td>
                <td className="px-4 py-2.5 text-right font-mono text-red-600">-{fmtFull(expense)}</td>
                <td className="px-4 py-2.5 text-right text-red-600">{income > 0 ? (expense / income * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr className={`${profit >= 0 ? "bg-emerald-100/60" : "bg-red-100/60"} font-bold`}>
                <td className="px-4 py-2.5">Чистая прибыль</td>
                <td className={`px-4 py-2.5 text-right font-mono ${profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {profit >= 0 ? "+" : ""}{fmtFull(profit)}
                </td>
                <td className={`px-4 py-2.5 text-right ${profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{margin}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
