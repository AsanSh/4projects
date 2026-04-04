import {
  useListAccruals,
  useListLeaseContracts,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  partial: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  partial: "Частично",
  paid: "Оплачено",
  overdue: "Просрочено",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-KZ", { style: "currency", currency }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-KZ");
}

export default function Accruals() {
  const { data: accruals, isLoading } = useListAccruals();

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Начисления</h1>
          <p className="text-muted-foreground text-sm">Ежемесячные начисления по договорам аренды</p>
        </div>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !accruals?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Начисления не найдены. Создайте договор аренды для генерации начислений.
                </TableCell>
              </TableRow>
            ) : (
              accruals.map((accrual) => (
                <TableRow key={accrual.id}>
                  <TableCell>Договор #{accrual.leaseContractId}</TableCell>
                  <TableCell>{accrual.period}</TableCell>
                  <TableCell>{formatCurrency(accrual.amount, accrual.currency)}</TableCell>
                  <TableCell>{formatCurrency(accrual.paidAmount, accrual.currency)}</TableCell>
                  <TableCell className={accrual.balance > 0 ? "text-red-600 font-medium" : ""}>
                    {formatCurrency(accrual.balance, accrual.currency)}
                  </TableCell>
                  <TableCell>{formatDate(accrual.dueDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[accrual.status]} variant="secondary">
                      {statusLabels[accrual.status] || accrual.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
