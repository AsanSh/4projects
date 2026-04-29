import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function fmtFull(n: any) {
  const v = parseFloat(n || "0");
  if (isNaN(v)) return "0 ₸";
  return new Intl.NumberFormat("ru-KG", { style: "currency", currency: "KGS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

function daysUntil(d: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RentalForecast() {
  const [horizon, setHorizon] = useState("30");

  const { data: accruals = [], isLoading } = useQuery<any[]>({
    queryKey: ["rental-accruals"],
    queryFn: () => api.get("/rental/accruals").then(r => r.data),
  });
  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ["rental-contracts"],
    queryFn: () => api.get("/rental/contracts").then(r => r.data),
  });
  const { data: tenants = [] } = useQuery<any[]>({
    queryKey: ["rental-tenants"],
    queryFn: () => api.get("/rental/tenants").then(r => r.data),
  });

  const today = new Date().toISOString().split("T")[0];

  const upcoming = accruals
    .filter((a: any) => {
      if (parseFloat(a.balance || "0") <= 0) return false;
      const days = daysUntil(a.dueDate);
      return days >= 0 && days <= parseInt(horizon);
    })
    .map((a: any) => {
      const contract = contracts.find((c: any) => c.id === a.leaseContractId);
      const tenant = contract ? tenants.find((t: any) => t.id === contract.tenantId) : null;
      return { ...a, contract, tenant, daysLeft: daysUntil(a.dueDate) };
    })
    .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

  const totalExpected = upcoming.reduce((s: number, a: any) => s + parseFloat(a.balance || "0"), 0);

  function urgencyBadge(days: number) {
    if (days <= 3) return <Badge className="bg-red-100 text-red-800">Срочно</Badge>;
    if (days <= 7) return <Badge className="bg-orange-100 text-orange-800">Скоро</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">{days} дн.</Badge>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Прогноз поступлений</h1>
          <p className="text-gray-500 text-sm mt-0.5">Ожидаемые платежи по предстоящим начислениям</p>
        </div>
        <Select value={horizon} onValueChange={setHorizon}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 дней</SelectItem>
            <SelectItem value="14">14 дней</SelectItem>
            <SelectItem value="30">30 дней</SelectItem>
            <SelectItem value="60">60 дней</SelectItem>
            <SelectItem value="90">90 дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">Ожидается за {horizon} дн.</span>
          </div>
          <p className="text-xl font-bold text-green-600">{fmtFull(totalExpected)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">Платежей к получению</span>
          </div>
          <p className="text-xl font-bold text-blue-600">{upcoming.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-500">Срочных (≤3 дн.)</span>
          </div>
          <p className="text-xl font-bold text-red-500">{upcoming.filter((a: any) => a.daysLeft <= 3).length}</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Арендатор</th>
              <th className="text-left p-3 font-medium text-gray-600">Период</th>
              <th className="text-right p-3 font-medium text-gray-600">Остаток</th>
              <th className="text-left p-3 font-medium text-gray-600">Дата оплаты</th>
              <th className="text-center p-3 font-medium text-gray-600">Статус</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Загрузка...</td></tr>
            ) : upcoming.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-400 text-sm">
                  Нет предстоящих платежей в течение {horizon} дней
                </td>
              </tr>
            ) : upcoming.map((a: any) => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <p className="font-medium text-gray-900">{a.tenant?.name || "—"}</p>
                  <p className="text-xs text-gray-400">{a.contract?.propertyAddress || `Дог. #${a.leaseContractId}`}</p>
                </td>
                <td className="p-3 text-gray-600">{a.period}</td>
                <td className="p-3 text-right font-semibold text-gray-800">{fmtFull(a.balance)}</td>
                <td className="p-3 text-gray-600">
                  {a.dueDate ? new Date(a.dueDate).toLocaleDateString("ru-KG") : "—"}
                </td>
                <td className="p-3 text-center">{urgencyBadge(a.daysLeft)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
