import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Wallet } from "lucide-react";

const MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

function fmt(n: any) {
  const v = parseFloat(n || "0");
  if (isNaN(v)) return "0";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "М";
  if (v >= 1_000) return (v / 1_000).toFixed(0) + "К";
  return new Intl.NumberFormat("ru-RU").format(v);
}

function fmtFull(n: any) {
  const v = parseFloat(n || "0");
  if (isNaN(v)) return "0";
  return new Intl.NumberFormat("ru-RU").format(v);
}

export default function ConstructionCashflow() {
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["construction-cashflow", year],
    queryFn: () => api.get(`/construction/analytics/cashflow?year=${year}`).then(r => r.data),
  });

  // Build monthly matrix
  const monthly: Record<string, { income: number; expense: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    monthly[key] = { income: 0, expense: 0 };
  }
  rows.forEach((r: any) => {
    if (monthly[r.month]) {
      if (r.type === "income") monthly[r.month].income += parseFloat(r.total || "0");
      if (r.type === "expense") monthly[r.month].expense += parseFloat(r.total || "0");
    }
  });

  const months = Object.entries(monthly);
  const maxVal = Math.max(...months.map(([, v]) => Math.max(v.income, v.expense)), 1);
  const totalIncome = months.reduce((s, [, v]) => s + v.income, 0);
  const totalExpense = months.reduce((s, [, v]) => s + v.expense, 0);
  const netCashflow = totalIncome - totalExpense;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ОДДС</h1>
          <p className="text-gray-500 text-sm mt-0.5">Отчёт о движении денежных средств</p>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-xs text-gray-500">Всего приходов</span></div>
          <div className="text-2xl font-bold text-emerald-600">{fmtFull(totalIncome)}</div>
          <div className="text-xs text-gray-400 mt-0.5">KGS за {year}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">Всего расходов</span></div>
          <div className="text-2xl font-bold text-red-600">{fmtFull(totalExpense)}</div>
          <div className="text-xs text-gray-400 mt-0.5">KGS за {year}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Wallet className="w-4 h-4 text-blue-500" /><span className="text-xs text-gray-500">Чистый поток</span></div>
          <div className={`text-2xl font-bold ${netCashflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmtFull(netCashflow)}</div>
          <div className="text-xs text-gray-400 mt-0.5">KGS за {year}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="text-sm font-semibold text-gray-700 mb-4">Динамика денежных потоков</div>
        <div className="flex items-end gap-1 h-48">
          {months.map(([key, v]) => {
            const monthIndex = parseInt(key.split("-")[1]) - 1;
            const incH = Math.round((v.income / maxVal) * 180);
            const expH = Math.round((v.expense / maxVal) * 180);
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="flex items-end gap-0.5 h-44">
                  <div className="w-full bg-emerald-400/80 rounded-t-sm transition-all" style={{ height: incH || 2 }} title={`Приход: ${fmtFull(v.income)}`} />
                  <div className="w-full bg-red-400/80 rounded-t-sm transition-all" style={{ height: expH || 2 }} title={`Расход: ${fmtFull(v.expense)}`} />
                </div>
                <div className="text-[9px] text-gray-400">{MONTHS[monthIndex]}</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-400 rounded" />Приходы</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-400 rounded" />Расходы</div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Месяц</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Приходы</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Расходы</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Поток</th>
              <th className="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {months.map(([key, v]) => {
              const monthIndex = parseInt(key.split("-")[1]) - 1;
              const net = v.income - v.expense;
              return (
                <tr key={key} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-medium text-gray-700">{MONTHS[monthIndex]} {year}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-600">{v.income > 0 ? `+${fmtFull(v.income)}` : "—"}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-600">{v.expense > 0 ? `-${fmtFull(v.expense)}` : "—"}</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {net !== 0 ? (net > 0 ? `+${fmtFull(net)}` : fmtFull(net)) : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${maxVal > 0 ? Math.round(v.income / maxVal * 100) : 0}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2.5">Итого</td>
              <td className="px-4 py-2.5 text-right font-mono text-emerald-600">+{fmtFull(totalIncome)}</td>
              <td className="px-4 py-2.5 text-right font-mono text-red-600">-{fmtFull(totalExpense)}</td>
              <td className={`px-4 py-2.5 text-right font-mono font-bold ${netCashflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {netCashflow >= 0 ? "+" : ""}{fmtFull(netCashflow)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
