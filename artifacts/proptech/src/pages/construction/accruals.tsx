import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListOrdered, AlertTriangle, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: "Ожидает",    color: "bg-gray-100 text-gray-600 border-gray-200", icon: Clock },
  partial:  { label: "Частично",   color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: DollarSign },
  paid:     { label: "Оплачен",    color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  overdue:  { label: "Просрочен",  color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
};

function fmt(n: any) {
  const v = parseFloat(n);
  if (isNaN(v)) return "0";
  return new Intl.NumberFormat("ru-RU").format(v);
}

function isOverdue(dueDate: string, status: string) {
  return status !== "paid" && new Date(dueDate) < new Date();
}

export default function ConstructionAccruals() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterContract, setFilterContract] = useState("all");

  const { data: accruals = [], isLoading } = useQuery({
    queryKey: ["construction-accruals"],
    queryFn: () => api.get("/construction/accruals").then(r => r.data),
  });
  const { data: contracts = [] } = useQuery({
    queryKey: ["construction-contracts-sales"],
    queryFn: () => api.get("/construction/contracts-sales").then(r => r.data),
  });

  const patchMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/construction/accruals/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["construction-accruals"] }); toast.success("Начисление обновлено"); },
  });

  const filtered = accruals
    .map((a: any) => ({ ...a, isOverdue: isOverdue(a.dueDate, a.status) }))
    .filter((a: any) => {
      const statusKey = a.isOverdue ? "overdue" : a.status;
      return (filterStatus === "all" || statusKey === filterStatus) &&
             (filterContract === "all" || a.contractId === Number(filterContract));
    });

  const totalPending = filtered.filter((a: any) => a.status !== "paid").reduce((s: number, a: any) => s + parseFloat(a.remainingAmount || "0"), 0);
  const totalPaid = filtered.reduce((s: number, a: any) => s + parseFloat(a.paidAmount || "0"), 0);
  const totalOverdue = filtered.filter((a: any) => a.isOverdue).reduce((s: number, a: any) => s + parseFloat(a.remainingAmount || "0"), 0);
  const countOverdue = filtered.filter((a: any) => a.isOverdue).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Начисления</h1>
          <p className="text-gray-500 text-sm mt-0.5">График платежей по договорам</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">К получению</div>
          <div className="text-xl font-bold text-blue-600">{fmt(totalPending)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Получено</div>
          <div className="text-xl font-bold text-emerald-600">{fmt(totalPaid)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Просрочено</div>
          <div className="text-xl font-bold text-red-600">{fmt(totalOverdue)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Просроченных</div>
          <div className="text-xl font-bold text-red-500">{countOverdue} шт.</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 p-3 flex gap-3 items-center">
        <div className="flex gap-2">
          {["all", "pending", "partial", "paid", "overdue"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "Все" : s === "pending" ? "Ожидает" : s === "partial" ? "Частично" : s === "paid" ? "Оплачен" : "Просрочен"}
            </button>
          ))}
        </div>
        <Select value={filterContract} onValueChange={setFilterContract}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Все договоры" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все договоры</SelectItem>
            {contracts.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.contractNumber} — {c.buyerName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">№</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Договор / Покупатель</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Срок платежа</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Статус</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Начислено</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Оплачено</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Остаток</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                <ListOrdered className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                График платежей пуст.<br />
                <span className="text-sm">Сформируйте график в разделе «Договоры»</span>
              </td></tr>
            ) : filtered.map((a: any) => {
              const statusKey = a.isOverdue && a.status !== "paid" ? "overdue" : a.status;
              const sc = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
              const Icon = sc.icon;
              const contract = contracts.find((c: any) => c.id === a.contractId);
              const pct = a.amount > 0 ? Math.round(parseFloat(a.paidAmount || "0") / parseFloat(a.amount) * 100) : 0;
              return (
                <tr key={a.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${a.isOverdue && a.status !== "paid" ? "bg-red-50/30" : ""}`}>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.installmentNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-xs font-mono">{contract?.contractNumber || `#${a.contractId}`}</div>
                    <div className="text-xs text-gray-400">{contract?.buyerName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={a.isOverdue && a.status !== "paid" ? "text-red-600 font-medium" : "text-gray-600"}>{a.dueDate}</div>
                    {a.isOverdue && a.status !== "paid" && (
                      <div className="text-xs text-red-400">
                        {Math.ceil((new Date().getTime() - new Date(a.dueDate).getTime()) / 86400000)} дн. просрочки
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`${sc.color} text-xs`}>
                      <Icon className="w-3 h-3 mr-1" />{sc.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">{fmt(a.amount)} {a.currency}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-mono text-emerald-600">{fmt(a.paidAmount)}</div>
                    <div className="w-16 ml-auto mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-orange-600">{fmt(a.remainingAmount)}</td>
                  <td className="px-4 py-3">
                    {a.status !== "paid" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => patchMut.mutate({ id: a.id, data: { status: "paid", paidAmount: a.amount, remainingAmount: "0", paidAt: new Date().toISOString().slice(0, 10) } })}>
                        Оплачен
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
