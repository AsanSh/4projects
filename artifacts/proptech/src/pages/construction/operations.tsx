import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightLeft, Plus, Search, TrendingUp, TrendingDown, ArrowLeftRight, Filter } from "lucide-react";
import { toast } from "sonner";

const RATE_SOURCES = ["НБКР", "Optima", "RSB", "Bakai", "DoBank", "MBank"];
const CATEGORIES_INCOME = ["Платеж по договору", "Аванс", "Инвестиции", "Прочие доходы"];
const CATEGORIES_EXPENSE = ["Стройматериалы", "Зарплата", "Подрядчики", "Аренда техники", "КМУ", "Проектирование", "Налоги", "Прочие расходы"];

const TYPE_CONFIG = {
  income: { label: "Приход", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: TrendingUp },
  expense: { label: "Расход", color: "bg-red-100 text-red-700 border-red-200", icon: TrendingDown },
  transfer: { label: "Перевод", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ArrowLeftRight },
};

function fmt(n: any) {
  const v = parseFloat(n);
  if (isNaN(v)) return "0";
  return new Intl.NumberFormat("ru-RU").format(v);
}

export default function ConstructionOperations() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({
    type: "expense", category: "", description: "", date: new Date().toISOString().slice(0, 10),
    amount: "", currency: "KGS", exchangeRateSource: "НБКР", exchangeRate: "1",
    paymentMethod: "cash", notes: "", projectId: "", status: "approved",
  });

  const { data: ops = [], isLoading } = useQuery({
    queryKey: ["construction-operations"],
    queryFn: () => api.get("/construction/operations").then(r => r.data),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["construction-projects"],
    queryFn: () => api.get("/construction/projects").then(r => r.data),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["construction-accounts"],
    queryFn: () => api.get("/construction/accounts").then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post("/construction/operations", data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["construction-operations"] }); setOpen(false); toast.success("Операция добавлена"); resetForm(); },
    onError: () => toast.error("Ошибка создания операции"),
  });

  function resetForm() {
    setForm({ type: "expense", category: "", description: "", date: new Date().toISOString().slice(0, 10), amount: "", currency: "KGS", exchangeRateSource: "НБКР", exchangeRate: "1", paymentMethod: "cash", notes: "", projectId: "", status: "approved" });
  }

  const amountKgs = form.currency === "KGS"
    ? parseFloat(form.amount || "0")
    : parseFloat(form.amount || "0") * parseFloat(form.exchangeRate || "1");

  const categories = form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  const filtered = ops.filter((op: any) => {
    const matchSearch = !search || op.description?.toLowerCase().includes(search.toLowerCase()) || op.category?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || op.type === filterType;
    return matchSearch && matchType;
  });

  const totalIncome = filtered.filter((o: any) => o.type === "income").reduce((s: number, o: any) => s + parseFloat(o.amountKgs || "0"), 0);
  const totalExpense = filtered.filter((o: any) => o.type === "expense").reduce((s: number, o: any) => s + parseFloat(o.amountKgs || "0"), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Операции</h1>
          <p className="text-gray-500 text-sm mt-0.5">Реестр приходов, расходов и переводов</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" /> Новая операция
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500 font-medium">Доходы (KGS)</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{fmt(totalIncome)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 font-medium">Расходы (KGS)</span>
          </div>
          <div className="text-xl font-bold text-red-600">{fmt(totalExpense)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 font-medium">Баланс (KGS)</span>
          </div>
          <div className={`text-xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(balance)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 p-3 flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9 h-8 text-sm" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "income", "expense", "transfer"].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterType === t ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t === "all" ? "Все" : t === "income" ? "Приходы" : t === "expense" ? "Расходы" : "Переводы"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Дата</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Тип</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Описание / Статья</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Проект</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Сумма</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Сумма KGS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                Нет операций. Нажмите «Новая операция»
              </td></tr>
            ) : filtered.map((op: any) => {
              const tc = TYPE_CONFIG[op.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.expense;
              const Icon = tc.icon;
              const proj = projects.find((p: any) => p.id === op.projectId);
              return (
                <tr key={op.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{op.date}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`${tc.color} text-xs`}>
                      <Icon className="w-3 h-3 mr-1" />{tc.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{op.description}</div>
                    {op.category && <div className="text-xs text-gray-400">{op.category}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{proj?.name || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {fmt(op.amount)} {op.currency}
                    {op.currency !== "KGS" && <div className="text-xs text-gray-400">× {op.exchangeRate}</div>}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${op.type === "income" ? "text-emerald-600" : op.type === "expense" ? "text-red-600" : "text-blue-600"}`}>
                    {op.type === "expense" ? "-" : "+"}{fmt(op.amountKgs)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Новая операция</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Type */}
            <div className="grid grid-cols-3 gap-2">
              {(["income", "expense", "transfer"] as const).map(t => {
                const tc = TYPE_CONFIG[t];
                return (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: "" }))}
                    className={`py-2 rounded-lg text-sm font-medium border transition-all ${form.type === t ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {tc.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Дата</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Статья</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Выберите статью" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Описание *</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 h-8 text-sm" placeholder="Краткое описание операции" />
            </div>

            <div>
              <Label className="text-xs">Проект</Label>
              <Select value={form.projectId} onValueChange={v => setForm(f => ({ ...f, projectId: v }))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Выберите проект" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не привязан</SelectItem>
                  {projects.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Сумма *</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="mt-1 h-8 text-sm" placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">Валюта</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["KGS", "USD", "EUR", "RUB", "CNY"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.currency !== "KGS" && (
                <div>
                  <Label className="text-xs">Курс KGS</Label>
                  <Input type="number" value={form.exchangeRate} onChange={e => setForm(f => ({ ...f, exchangeRate: e.target.value }))} className="mt-1 h-8 text-sm" />
                </div>
              )}
            </div>

            {form.currency !== "KGS" && (
              <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">
                Итого KGS: <strong>{fmt(amountKgs)}</strong>
                <div className="mt-1">
                  <Label className="text-xs text-blue-600">Источник курса</Label>
                  <Select value={form.exchangeRateSource} onValueChange={v => setForm(f => ({ ...f, exchangeRateSource: v }))}>
                    <SelectTrigger className="mt-1 h-7 text-xs bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RATE_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Способ оплаты</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Наличные</SelectItem>
                    <SelectItem value="transfer">Перевод</SelectItem>
                    <SelectItem value="card">Карта</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Статус</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Проведена</SelectItem>
                    <SelectItem value="pending">На согласовании</SelectItem>
                    <SelectItem value="cancelled">Отменена</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Примечание</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 text-sm resize-none" rows={2} placeholder="Дополнительная информация..." />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setOpen(false); resetForm(); }}>Отмена</Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600"
                disabled={createMut.isPending || !form.description || !form.amount}
                onClick={() => createMut.mutate({
                  ...form,
                  projectId: form.projectId && form.projectId !== "none" ? Number(form.projectId) : null,
                })}>
                {createMut.isPending ? "Сохранение..." : "Добавить операцию"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
