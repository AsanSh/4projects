import { useState } from "react";
import {
  useListExpenses,
  useCreateExpense,
  useListProperties,
  getListExpensesQueryKey,
  CreateExpenseBodyCategory,
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

const categoryLabels: Record<string, string> = {
  maintenance: "Обслуживание",
  utilities: "Коммунальные услуги",
  management_fee: "Управляющая компания",
  cleaning: "Уборка",
  repair: "Ремонт",
  other: "Прочее",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-KZ", { style: "currency", currency }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-KZ");
}

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
}

function ExpenseDialog({ open, onClose }: ExpenseDialogProps) {
  const createMutation = useCreateExpense();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: properties } = useListProperties();

  const [formData, setFormData] = useState({
    propertyId: "",
    category: "maintenance" as CreateExpenseBodyCategory,
    amount: "",
    currency: "KZT",
    expenseDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          propertyId: parseInt(formData.propertyId),
          category: formData.category,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          expenseDate: formData.expenseDate,
          description: formData.description || null,
        },
      });
      toast({ title: "Расход зарегистрирован" });
      queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
      onClose();
    } catch {
      toast({ title: "Ошибка", description: "Не удалось сохранить расход", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить расход</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Объект *</Label>
            <Select value={formData.propertyId} onValueChange={(v) => setFormData({ ...formData, propertyId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите объект" />
              </SelectTrigger>
              <SelectContent>
                {(properties || []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.projectName} — {p.unitNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Категория *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as CreateExpenseBodyCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
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
                placeholder="50000"
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
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Дата *</Label>
            <Input
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Описание</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Замена батарей, плановое ТО"
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

export default function Expenses() {
  const { data: expenses, isLoading } = useListExpenses();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Расходы</h1>
          <p className="text-muted-foreground text-sm">Учёт расходов по объектам</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Объект</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Описание</TableHead>
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
            ) : !expenses?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Расходы не найдены
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>Объект #{expense.propertyId}</TableCell>
                  <TableCell>{categoryLabels[expense.category] || expense.category}</TableCell>
                  <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(expense.amount, expense.currency)}</TableCell>
                  <TableCell>{expense.description || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ExpenseDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
