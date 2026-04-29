import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Building2, Wallet, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<string, string> = {
  bank: "Банковский счёт",
  cash: "Касса",
  card: "Карта",
};
const typeColors: Record<string, string> = {
  bank: "bg-blue-100 text-blue-800",
  cash: "bg-green-100 text-green-800",
  card: "bg-purple-100 text-purple-800",
};
const typeIcons: Record<string, JSX.Element> = {
  bank: <Building2 className="w-4 h-4" />,
  cash: <Wallet className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
};

function fmt(n: string | number | null | undefined) {
  const v = parseFloat(String(n || "0"));
  if (isNaN(v)) return "0 ₸";
  return new Intl.NumberFormat("ru-KG", { style: "currency", currency: "KGS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

const emptyForm = {
  name: "", type: "bank", bank: "", bik: "", accountNumber: "", currency: "KGS",
  openingBalance: "0", notes: "",
};

export default function RentalAccounts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: accounts = [], isLoading } = useQuery<any[]>({
    queryKey: ["rental-accounts"],
    queryFn: () => api.get("/rental/accounts").then(r => r.data),
  });

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(acc: any) {
    setEditing(acc);
    setForm({
      name: acc.name || "", type: acc.type || "bank", bank: acc.bank || "",
      bik: acc.bik || "", accountNumber: acc.accountNumber || "",
      currency: acc.currency || "KGS", openingBalance: acc.openingBalance || "0",
      notes: acc.notes || "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast({ title: "Введите название счёта", variant: "destructive" }); return; }
    setLoading(true);
    try {
      if (editing) {
        await api.patch(`/rental/accounts/${editing.id}`, form);
        toast({ title: "Счёт обновлён" });
      } else {
        await api.post("/rental/accounts", form);
        toast({ title: "Счёт создан" });
      }
      queryClient.invalidateQueries({ queryKey: ["rental-accounts"] });
      setOpen(false);
    } catch {
      toast({ title: "Ошибка при сохранении", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить расчётный счёт?")) return;
    setDeleting(id);
    try {
      await api.delete(`/rental/accounts/${id}`);
      queryClient.invalidateQueries({ queryKey: ["rental-accounts"] });
      toast({ title: "Счёт удалён" });
    } catch {
      toast({ title: "Ошибка при удалении", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Расчётные счета</h1>
          <p className="text-gray-500 text-sm mt-0.5">Банковские счета и кассы модуля аренды</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Добавить счёт
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Всего счетов</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{accounts.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Суммарный баланс</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalBalance)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Активных счетов</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {accounts.filter(a => parseFloat(a.currentBalance || "0") > 0).length}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Банк</TableHead>
              <TableHead>Номер счёта</TableHead>
              <TableHead>Валюта</TableHead>
              <TableHead className="text-right">Баланс</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : accounts.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                    <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Нет расчётных счетов. Добавьте первый.</p>
                  </TableCell>
                </TableRow>
              )
              : accounts.map((acc) => (
                <TableRow key={acc.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      {typeIcons[acc.type] || typeIcons.bank}
                      {acc.name}
                    </div>
                    {acc.notes && <p className="text-xs text-gray-400 mt-0.5 ml-6">{acc.notes}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge className={typeColors[acc.type] || typeColors.bank}>
                      {typeLabels[acc.type] || acc.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{acc.bank || "—"}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-600">{acc.accountNumber || "—"}</TableCell>
                  <TableCell className="text-gray-600">{acc.currency}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={parseFloat(acc.currentBalance || "0") >= 0 ? "text-green-600" : "text-red-600"}>
                      {fmt(acc.currentBalance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(acc)}>
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-7 w-7 p-0"
                        disabled={deleting === acc.id}
                        onClick={() => handleDelete(acc.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать счёт" : "Добавить расчётный счёт"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Название *</Label>
              <Input
                className="mt-1.5"
                placeholder="Основной счёт"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Тип</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Банковский счёт</SelectItem>
                    <SelectItem value="cash">Касса</SelectItem>
                    <SelectItem value="card">Карта</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Валюта</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KGS">KGS (сом)</SelectItem>
                    <SelectItem value="USD">USD (доллар)</SelectItem>
                    <SelectItem value="EUR">EUR (евро)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.type === "bank" && (
              <>
                <div>
                  <Label className="text-sm font-medium">Банк</Label>
                  <Input className="mt-1.5" placeholder="Мбанк" value={form.bank}
                    onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">БИК</Label>
                    <Input className="mt-1.5" placeholder="109001" value={form.bik}
                      onChange={e => setForm(f => ({ ...f, bik: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Номер счёта</Label>
                    <Input className="mt-1.5" placeholder="1020000012345678" value={form.accountNumber}
                      onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label className="text-sm font-medium">{editing ? "Начальный баланс" : "Начальный остаток"}</Label>
              <Input className="mt-1.5" type="number" placeholder="0" value={form.openingBalance}
                onChange={e => setForm(f => ({ ...f, openingBalance: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm font-medium">Примечание</Label>
              <Input className="mt-1.5" placeholder="Необязательно" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? "Сохранение..." : editing ? "Сохранить" : "Добавить"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
