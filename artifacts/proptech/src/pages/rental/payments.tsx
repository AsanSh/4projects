import { useState } from "react";
import {
  useListPayments,
  useCreatePayment,
  useListLeaseContracts,
  getListPaymentsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const methodLabels: Record<string, string> = {
  cash: "Наличные",
  bank_transfer: "Банковский перевод",
  card: "Карта",
  other: "Другое",
};

function formatCurrency(amount: number | string, currency: string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const cur = currency === "KGS" ? "KGS" : currency === "USD" ? "USD" : "KGS";
  return new Intl.NumberFormat("ru-KG", { style: "currency", currency: cur }).format(num);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-KG");
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
}

function PaymentDialog({ open, onClose }: PaymentDialogProps) {
  const createMutation = useCreatePayment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: leases } = useListLeaseContracts();

  const [formData, setFormData] = useState({
    leaseContractId: "",
    amount: "",
    currency: "KGS",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "bank_transfer",
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          leaseContractId: parseInt(formData.leaseContractId),
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod as any,
          note: formData.note || null,
        },
      });
      toast({ title: "Платёж зарегистрирован" });
      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
      onClose();
    } catch {
      toast({ title: "Ошибка", description: "Не удалось сохранить платёж", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Регистрация платежа</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Договор аренды *</Label>
            <Select value={formData.leaseContractId} onValueChange={(v) => setFormData({ ...formData, leaseContractId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите договор" />
              </SelectTrigger>
              <SelectContent>
                {(leases || []).map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.contractNumber} — {l.tenantName || `Арендатор #${l.tenantId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Сумма *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="150000"
                required
              />
            </div>
            <div>
              <Label>Валюта</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KGS">Сом (KGS)</SelectItem>
                  <SelectItem value="USD">Доллар (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Дата платежа *</Label>
            <Input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Способ оплаты</Label>
            <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Наличные</SelectItem>
                <SelectItem value="bank_transfer">Банковский перевод</SelectItem>
                <SelectItem value="card">Карта</SelectItem>
                <SelectItem value="other">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Примечание</Label>
            <Input
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Оплата за апрель 2026"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Payments() {
  const { data: payments, isLoading } = useListPayments();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Платежи</h1>
          <p className="text-muted-foreground text-sm">История поступивших платежей</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Зарегистрировать
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Договор</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Способ оплаты</TableHead>
              <TableHead>Примечание</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !payments?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Платежи не найдены
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>Договор #{payment.leaseContractId}</TableCell>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(payment.amount, payment.currency)}</TableCell>
                  <TableCell>{payment.paymentMethod ? methodLabels[payment.paymentMethod] || payment.paymentMethod : "—"}</TableCell>
                  <TableCell>{payment.note || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
