import { useState } from "react";
import {
  useListLeaseContracts,
  useCreateLeaseContract,
  LeaseContract,
  LeaseContractStatus,
  CreateLeaseContractBodyStatus,
} from "@workspace/api-client-react";
import { useListTenants, useListProperties } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { getListLeaseContractsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  expired: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  active: "Активный",
  expired: "Истёк",
  terminated: "Расторгнут",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-KZ", { style: "currency", currency }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-KZ");
}

interface LeaseDialogProps {
  open: boolean;
  onClose: () => void;
}

function LeaseDialog({ open, onClose }: LeaseDialogProps) {
  const createMutation = useCreateLeaseContract();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: tenants } = useListTenants();
  const { data: properties } = useListProperties();

  const [formData, setFormData] = useState({
    propertyId: "",
    tenantId: "",
    contractNumber: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    currency: "KZT",
    depositAmount: "",
    accrualDay: "1",
    status: "active" as CreateLeaseContractBodyStatus,
    comment: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          propertyId: parseInt(formData.propertyId),
          tenantId: parseInt(formData.tenantId),
          contractNumber: formData.contractNumber,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          rentAmount: parseFloat(formData.rentAmount),
          currency: formData.currency,
          depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : null,
          accrualDay: formData.accrualDay ? parseInt(formData.accrualDay) : null,
          status: formData.status,
          comment: formData.comment || null,
        },
      });
      toast({ title: "Договор аренды создан" });
      queryClient.invalidateQueries({ queryKey: getListLeaseContractsQueryKey() });
      onClose();
    } catch {
      toast({ title: "Ошибка", description: "Не удалось создать договор", variant: "destructive" });
    }
  };

  const availableProperties = properties?.filter((p) => p.status === "available") || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый договор аренды</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Объект *</Label>
              <Select value={formData.propertyId} onValueChange={(v) => setFormData({ ...formData, propertyId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите объект" />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.projectName} {p.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Арендатор *</Label>
              <Select value={formData.tenantId} onValueChange={(v) => setFormData({ ...formData, tenantId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите арендатора" />
                </SelectTrigger>
                <SelectContent>
                  {(tenants || []).map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Номер договора *</Label>
            <Input
              value={formData.contractNumber}
              onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
              placeholder="ДА-2026-001"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Дата начала *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Дата окончания</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Сумма аренды *</Label>
              <Input
                type="number"
                value={formData.rentAmount}
                onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                placeholder="150000"
                required
              />
            </div>
            <div>
              <Label>Валюта</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KZT">KZT</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Депозит</Label>
              <Input
                type="number"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                placeholder="300000"
              />
            </div>
            <div>
              <Label>День начисления</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={formData.accrualDay}
                onChange={(e) => setFormData({ ...formData, accrualDay: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Статус</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as CreateLeaseContractBodyStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="active">Активный</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Создание..." : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function RentalContracts() {
  const { data: leases, isLoading } = useListLeaseContracts();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Договоры аренды</h1>
          <p className="text-muted-foreground text-sm">Управление договорами аренды</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Новый договор
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Номер</TableHead>
              <TableHead>Объект</TableHead>
              <TableHead>Арендатор</TableHead>
              <TableHead>Период</TableHead>
              <TableHead>Аренда</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !leases?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Договоры аренды не найдены
                </TableCell>
              </TableRow>
            ) : (
              leases.map((lease) => (
                <TableRow key={lease.id}>
                  <TableCell className="font-medium">{lease.contractNumber}</TableCell>
                  <TableCell>{lease.propertyUnitNumber || `#${lease.propertyId}`}</TableCell>
                  <TableCell>{lease.tenantName || `#${lease.tenantId}`}</TableCell>
                  <TableCell>
                    {formatDate(lease.startDate)}
                    {lease.endDate ? ` — ${formatDate(lease.endDate)}` : " (бессрочный)"}
                  </TableCell>
                  <TableCell>{formatCurrency(lease.rentAmount, lease.currency)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[lease.status]} variant="secondary">
                      {statusLabels[lease.status] || lease.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <LeaseDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
