import { useState } from "react";
import { useListAccruals, useListLeaseContracts, getListAccrualsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  approved: "Подтверждено",
  partial: "Частично",
  paid: "Оплачено",
  overdue: "Просрочено",
  cancelled: "Отменено",
};

function formatCurrency(amount: number | string, currency: string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("ru-KG", {
    style: "currency",
    currency: currency === "KGS" ? "KGS" : currency === "USD" ? "USD" : "KGS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-KG");
}

async function patchAccrualStatus(id: number, status: string) {
  const res = await fetch(`/api/rental/accruals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Ошибка обновления начисления");
  return res.json();
}

export default function Accruals() {
  const { data: accruals, isLoading } = useListAccruals();
  const { data: leases } = useListLeaseContracts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [leaseFilter, setLeaseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const leaseMap = Object.fromEntries(
    (leases || []).map((l) => [l.id, `${l.contractNumber} — ${l.tenantName || ""}`.trim()])
  );

  const filtered = (accruals || []).filter((a) => {
    if (leaseFilter !== "all" && String(a.leaseContractId) !== leaseFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const handleStatusChange = async (id: number, newStatus: string) => {
    setLoadingId(id);
    try {
      await patchAccrualStatus(id, newStatus);
      toast({
        title: newStatus === "approved" ? "Начисление подтверждено" : "Начисление отменено",
      });
      queryClient.invalidateQueries({ queryKey: getListAccrualsQueryKey() });
    } catch {
      toast({ title: "Ошибка", description: "Не удалось обновить начисление", variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  const pendingCount = (accruals || []).filter((a) => a.status === "pending").length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Начисления</h1>
          <p className="text-muted-foreground text-sm">
            Ежемесячные начисления по договорам аренды
            {pendingCount > 0 && (
              <span className="ml-2 text-yellow-600 font-medium">· {pendingCount} ожидают подтверждения</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={leaseFilter} onValueChange={setLeaseFilter}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Все договоры" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все договоры</SelectItem>
            {(leases || []).map((l) => (
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Договор</TableHead>
              <TableHead>Период</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Оплачено</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead>Срок оплаты</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-36 text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !filtered.length ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
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
                return (
                  <TableRow key={accrual.id}>
                    <TableCell className="text-sm">
                      {leaseMap[accrual.leaseContractId] || `Договор #${accrual.leaseContractId}`}
                    </TableCell>
                    <TableCell className="font-medium">{accrual.period}</TableCell>
                    <TableCell>{formatCurrency(accrual.amount, accrual.currency)}</TableCell>
                    <TableCell>{formatCurrency(accrual.paidAmount, accrual.currency)}</TableCell>
                    <TableCell
                      className={
                        parseFloat(String(accrual.balance)) > 0 ? "text-red-600 font-medium" : "text-green-600"
                      }
                    >
                      {formatCurrency(accrual.balance, accrual.currency)}
                    </TableCell>
                    <TableCell>{formatDate(accrual.dueDate)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[accrual.status] || ""} variant="secondary">
                        {statusLabels[accrual.status] || accrual.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        {canApprove && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => handleStatusChange(accrual.id, "approved")}
                            disabled={isBusy}
                            title="Подтвердить начисление"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Принять
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => handleStatusChange(accrual.id, "cancelled")}
                            disabled={isBusy}
                            title="Отменить начисление"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Отменить
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
    </div>
  );
}
