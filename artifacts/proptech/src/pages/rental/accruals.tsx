import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Tag, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  pending: "Ожидает", approved: "Подтверждено", partial: "Частично",
  paid: "Оплачено", overdue: "Просрочено", cancelled: "Отменено",
};

function fmtCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("ru-KG", { style: "currency", currency: "KGS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-KG");
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const authHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

async function patchAccrual(id: number, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/rental/accruals/${id}`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Ошибка обновления начисления");
  return res.json();
}

async function applyDiscount(id: number, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/rental/accruals/${id}/discount`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Ошибка применения льготы");
  return res.json();
}

interface Accrual {
  id: number; leaseContractId: number; period: string; amount: string; paidAmount: string;
  balance: string; dueDate: string; status: string; currency: string;
  discountType?: string | null; discountAmount?: string | null; discountReason?: string | null;
}

interface DiscountDialogProps {
  accrual: Accrual | null;
  onClose: () => void;
  onSaved: () => void;
}

function DiscountDialog({ accrual, onClose, onSaved }: DiscountDialogProps) {
  const { toast } = useToast();
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [reason, setReason] = useState("");
  const [graceDays, setGraceDays] = useState("7");
  const [loading, setLoading] = useState(false);

  if (!accrual) return null;

  const baseAmount = parseFloat(accrual.amount);
  let preview = 0;
  if (discountType === "percent" && discountValue) preview = (baseAmount * parseFloat(discountValue)) / 100;
  else if (discountType === "fixed" && discountValue) preview = parseFloat(discountValue);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await applyDiscount(accrual.id, {
        discountType,
        discountValue: discountType !== "grace" ? parseFloat(discountValue) : parseFloat(graceDays),
        reason,
        gracePeriodDays: discountType === "grace" ? parseInt(graceDays) : undefined,
      });
      toast({ title: "Льгота применена", description: discountType === "grace" ? `Срок продлён на ${graceDays} дн.` : `Скидка ${fmtCurrency(preview)}` });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!accrual} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" /> Применить льготу
          </DialogTitle>
          <DialogDescription>
            Период {accrual.period} · Сумма: {fmtCurrency(parseFloat(accrual.amount))}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Тип льготы</Label>
            <Select value={discountType} onValueChange={setDiscountType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Скидка в процентах (%)</SelectItem>
                <SelectItem value="fixed">Фиксированная скидка (сом)</SelectItem>
                <SelectItem value="grace">Отсрочка платежа (дней)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {discountType === "grace" ? (
            <div>
              <Label>Количество дней отсрочки</Label>
              <Input
                type="number" min="1" max="90"
                value={graceDays} onChange={(e) => setGraceDays(e.target.value)}
                placeholder="7" className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Текущий срок: {formatDate(accrual.dueDate)} → новый срок сдвинется на {graceDays} дней
              </p>
            </div>
          ) : (
            <div>
              <Label>{discountType === "percent" ? "Размер скидки (%)" : "Сумма скидки (KGS)"}</Label>
              <Input
                type="number" min="0"
                max={discountType === "percent" ? "100" : String(baseAmount)}
                value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percent" ? "10" : "5000"} className="mt-1"
              />
              {preview > 0 && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  Скидка: {fmtCurrency(preview)} → итог: {fmtCurrency(Math.max(0, baseAmount - preview))}
                </p>
              )}
            </div>
          )}

          <div>
            <Label>Основание / Причина</Label>
            <Input
              value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Семейные обстоятельства, первый месяц и т.д." className="mt-1"
            />
          </div>

          {accrual.discountType && (
            <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-amber-700">Ранее уже применена льгота типа «{accrual.discountType}». Она будет заменена.</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Применение..." : "Применить льготу"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Accruals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [leaseFilter, setLeaseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [discountAccrual, setDiscountAccrual] = useState<Accrual | null>(null);

  const { data: accruals, isLoading } = useQuery<Accrual[]>({
    queryKey: ["accruals"],
    queryFn: () => api.get("/rental/accruals").then(r => r.data),
  });

  const { data: leases } = useQuery<any[]>({
    queryKey: ["leases"],
    queryFn: () => api.get("/rental/contracts").then(r => r.data),
  });

  const leaseMap = Object.fromEntries(
    (leases || []).map((l: any) => [l.id, `${l.contractNumber} — ${l.tenantName || ""}`.trim()])
  );

  const filtered = (accruals || []).filter((a) => {
    if (leaseFilter !== "all" && String(a.leaseContractId) !== leaseFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = async (id: number, newStatus: string) => {
    setLoadingId(id);
    try {
      await patchAccrual(id, { status: newStatus });
      toast({ title: newStatus === "approved" ? "Начисление подтверждено" : "Начисление отменено" });
      queryClient.invalidateQueries({ queryKey: ["accruals"] });
    } catch {
      toast({ title: "Ошибка", description: "Не удалось обновить начисление", variant: "destructive" });
    } finally {
      setLoadingId(null); }
  };

  const pendingCount = (accruals || []).filter((a) => a.status === "pending").length;
  const totalBalance = (accruals || []).reduce((s, a) => s + parseFloat(a.balance), 0);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Начисления</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ежемесячные начисления по договорам аренды
            {pendingCount > 0 && <span className="ml-2 text-yellow-600 font-medium">· {pendingCount} ожидают</span>}
          </p>
        </div>
        {totalBalance > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Общий остаток</p>
            <p className="text-lg font-bold text-red-600">{fmtCurrency(totalBalance)}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={leaseFilter} onValueChange={setLeaseFilter}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Все договоры" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все договоры</SelectItem>
            {(leases || []).map((l: any) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.contractNumber} — {l.tenantName || `#${l.tenantId}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="approved">Подтверждено</SelectItem>
            <SelectItem value="partial">Частично</SelectItem>
            <SelectItem value="paid">Оплачено</SelectItem>
            <SelectItem value="overdue">Просрочено</SelectItem>
            <SelectItem value="cancelled">Отменено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Договор</TableHead>
              <TableHead>Период</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Скидка</TableHead>
              <TableHead>Оплачено</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead>Срок оплаты</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !filtered.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-400 py-12">
                  {accruals?.length
                    ? "Начисления не соответствуют фильтру"
                    : "Начисления не найдены. Создайте договор аренды — начисления появятся автоматически."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((accrual) => {
                const isBusy = loadingId === accrual.id;
                const canApprove = accrual.status === "pending" || accrual.status === "overdue";
                const canCancel = accrual.status === "pending" || accrual.status === "approved";
                const hasDiscount = parseFloat(accrual.discountAmount || "0") > 0;
                return (
                  <TableRow key={accrual.id} className="hover:bg-gray-50">
                    <TableCell className="text-sm text-gray-600">
                      {leaseMap[accrual.leaseContractId] || `#${accrual.leaseContractId}`}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{accrual.period}</TableCell>
                    <TableCell>{fmtCurrency(parseFloat(accrual.amount))}</TableCell>
                    <TableCell>
                      {hasDiscount ? (
                        <span className="text-xs text-green-700 font-medium bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                          -{fmtCurrency(parseFloat(accrual.discountAmount!))}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-gray-600">{fmtCurrency(parseFloat(accrual.paidAmount))}</TableCell>
                    <TableCell className={cn(
                      "font-medium",
                      parseFloat(accrual.balance) > 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {fmtCurrency(parseFloat(accrual.balance))}
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(accrual.dueDate)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[accrual.status] || ""} variant="secondary">
                        {statusLabels[accrual.status] || accrual.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center flex-wrap">
                        {canApprove && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 text-xs border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusChange(accrual.id, "approved")}
                            disabled={isBusy}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Принять
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => handleStatusChange(accrual.id, "cancelled")}
                            disabled={isBusy}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Отменить
                          </Button>
                        )}
                        {accrual.status !== "paid" && accrual.status !== "cancelled" && (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={() => setDiscountAccrual(accrual)}
                            disabled={isBusy}
                          >
                            <Tag className="w-3.5 h-3.5 mr-1" /> Льгота
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DiscountDialog
        accrual={discountAccrual}
        onClose={() => setDiscountAccrual(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["accruals"] })}
      />
    </div>
  );
}
