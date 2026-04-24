import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, TrendingDown, ArrowLeftRight, Search, X, Filter, Download, Upload } from "lucide-react";
import { toast } from "sonner";

const RATE_SOURCES = ["НБКР", "Optima", "RSB", "Bakai", "DoBank", "MBank"];
const CATEGORIES_INCOME = [
  "Платёж по договору", "Первоначальный взнос", "Аванс покупателя", "Инвестиции",
  "Возврат от поставщика", "Перевод между счетами", "Прочие доходы",
];
const CATEGORIES_EXPENSE = [
  "Строительство", "Зарплата бригады", "Подрядчики", "Материалы",
  "Аренда техники", "OPEX", "Налоги и взносы", "Документация", "Земельный участок",
  "Займы другим проектам", "Подотчёт", "Прочие расходы",
];

function fmt(n: any) {
  const v = parseFloat(n);
  if (isNaN(v)) return "0";
  return new Intl.NumberFormat("ru-RU").format(v);
}

function relDate(d: string) {
  if (!d) return "—";
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return "Сегодня";
  if (d === yest) return "Вчера";
  return d;
}

export default function ConstructionOperations() {
  const qc = useQueryClient();
  const [panelType, setPanelType] = useState<"income" | "expense" | "transfer" | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "month" | "income" | "expense" | "transfer">("month");
  const [form, setForm] = useState({
    type: "expense" as "income" | "expense" | "transfer",
    category: "", description: "", date: new Date().toISOString().slice(0, 10),
    amount: "", currency: "KGS", exchangeRateSource: "НБКР", exchangeRate: "89",
    notes: "", projectId: "", accountId: "", status: "approved",
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["construction-operations"] });
      toast.success("Операция добавлена");
      resetForm();
    },
    onError: () => toast.error("Ошибка создания операции"),
  });

  function openPanel(type: "income" | "expense" | "transfer") {
    setPanelType(type);
    setForm(f => ({ ...f, type, category: "" }));
  }

  function resetForm() {
    setForm({ type: panelType || "expense", category: "", description: "", date: new Date().toISOString().slice(0, 10), amount: "", currency: "KGS", exchangeRateSource: "НБКР", exchangeRate: "89", notes: "", projectId: "", accountId: "", status: "approved" });
  }

  const amountKgs = form.currency === "KGS"
    ? parseFloat(form.amount || "0")
    : parseFloat(form.amount || "0") * parseFloat(form.exchangeRate || "1");

  const categories = form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const filtered = ops.filter((op: any) => {
    if (search && !op.description?.toLowerCase().includes(search.toLowerCase()) && !op.category?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType === "month" && !op.date?.startsWith(currentMonth)) return false;
    if (filterType === "income" && op.type !== "income") return false;
    if (filterType === "expense" && op.type !== "expense") return false;
    if (filterType === "transfer" && op.type !== "transfer") return false;
    return true;
  });

  const sortedOps = [...filtered].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const totalIncome = filtered.filter((o: any) => o.type === "income").reduce((s: number, o: any) => s + parseFloat(o.amountKgs || "0"), 0);
  const totalExpense = filtered.filter((o: any) => o.type === "expense").reduce((s: number, o: any) => s + parseFloat(o.amountKgs || "0"), 0);

  const periodLabel = filterType === "month" ? "за текущий месяц" : filterType === "all" ? "за всё время" : filterType === "income" ? "— приходы" : filterType === "expense" ? "— расходы" : "— переводы";

  return (
    <div className="flex h-full relative">
      {/* Main */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${panelType ? "mr-80" : ""}`}>
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Операции {periodLabel}</h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-4">
          <Button onClick={() => openPanel("income")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-4 text-sm font-medium rounded-lg shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Приход
          </Button>
          <Button onClick={() => openPanel("expense")}
            className="bg-red-500 hover:bg-red-600 text-white h-8 px-4 text-sm font-medium rounded-lg shadow-sm">
            <TrendingDown className="w-3.5 h-3.5 mr-1.5" /> Расход
          </Button>
          <Button onClick={() => openPanel("transfer")}
            variant="outline" className="h-8 px-4 text-sm font-medium rounded-lg border-gray-200">
            <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" /> Перевод
          </Button>
          <div className="flex-1" />
          <Button variant="outline" className="h-8 px-3 text-sm border-gray-200 text-gray-500">
            <Filter className="w-3.5 h-3.5 mr-1.5" /> Фильтр
          </Button>
          <Button variant="outline" className="h-8 px-3 text-sm border-gray-200 text-gray-500">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Импорт
          </Button>
          <Button variant="outline" className="h-8 px-3 text-sm border-gray-200 text-gray-500">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Экспорт
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {[
            ["month", "Текущий месяц"],
            ["all", "Все операции"],
            ["income", "Приходы"],
            ["expense", "Расходы"],
            ["transfer", "Переводы"],
          ].map(([v, l]) => (
            <button key={v} onClick={() => setFilterType(v as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterType === v ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
              {l}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input className="pl-8 h-7 text-xs w-44 border-gray-200" placeholder="Поиск по описанию" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Summary row */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 rounded-lg mb-3 text-sm">
            <span className="text-gray-400">Итого за период:</span>
            <span className="text-emerald-600 font-mono font-semibold">+{fmt(totalIncome)}</span>
            <span className="text-red-600 font-mono font-semibold">−{fmt(totalExpense)}</span>
            <span className={`font-mono font-bold ${totalIncome - totalExpense >= 0 ? "text-gray-700" : "text-red-600"}`}>
              = {totalIncome - totalExpense >= 0 ? "+" : ""}{fmt(totalIncome - totalExpense)}
            </span>
          </div>
        )}

        {/* Operations list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 w-6">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left px-2 py-2.5 text-xs font-semibold text-gray-400 w-24">ДАТА</th>
                <th className="text-left px-2 py-2.5 text-xs font-semibold text-gray-400">ОПЕРАЦИЯ</th>
                <th className="text-left px-2 py-2.5 text-xs font-semibold text-gray-400">ПРОЕКТ</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400">СУММА</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400">Загрузка...</td></tr>
              ) : sortedOps.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <ArrowLeftRight className="w-10 h-10 text-gray-200" />
                    <span>Нет операций. Нажмите «Приход» или «Расход» для добавления.</span>
                  </div>
                </td></tr>
              ) : sortedOps.map((op: any) => {
                const proj = projects.find((p: any) => p.id === op.projectId);
                const isIncome = op.type === "income";
                const isTransfer = op.type === "transfer";
                return (
                  <tr key={op.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors cursor-pointer group">
                    <td className="px-4 py-2.5">
                      <input type="checkbox" className="rounded opacity-0 group-hover:opacity-100" />
                    </td>
                    <td className="px-2 py-2.5 text-gray-400 text-xs whitespace-nowrap">{relDate(op.date)}</td>
                    <td className="px-2 py-2.5">
                      <div className="font-medium text-gray-900 text-sm">{op.description}</div>
                      {op.category && (
                        <div className="text-xs text-gray-400 mt-0.5">{op.category}</div>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-xs text-gray-400">{proj?.name || "—"}</td>
                    <td className={`px-4 py-2.5 text-right font-mono font-semibold text-sm ${isIncome ? "text-emerald-600" : isTransfer ? "text-blue-600" : "text-gray-700"}`}>
                      {isIncome ? "+" : isTransfer ? "" : "−"}{fmt(op.amountKgs)}
                      {op.currency !== "KGS" && (
                        <div className="text-[10px] text-gray-400 font-normal">{fmt(op.amount)} {op.currency}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Panel - Adesk style */}
      {panelType && (
        <div className="fixed right-0 top-0 h-screen w-80 bg-white shadow-2xl border-l border-gray-100 flex flex-col z-50" style={{ top: 0 }}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="text-sm font-semibold text-gray-800">
              Добавить операцию {panelType === "income" ? "прихода" : panelType === "expense" ? "расхода" : "перевода"}
            </div>
            <button onClick={() => setPanelType(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-1.5">
              {(["income", "expense", "transfer"] as const).map(t => (
                <button key={t} onClick={() => { setPanelType(t); setForm(f => ({ ...f, type: t, category: "" })); }}
                  className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${panelType === t
                    ? t === "income" ? "bg-emerald-500 text-white border-emerald-500"
                    : t === "expense" ? "bg-red-500 text-white border-red-500"
                    : "bg-blue-500 text-white border-blue-500"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {t === "income" ? "Приход" : t === "expense" ? "Расход" : "Перевод"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <Label className="text-xs text-gray-500">СУММА *</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="flex-1 h-9 text-sm font-mono border-gray-200" placeholder="0,00" autoFocus />
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="w-20 h-9 text-sm border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["KGS", "USD", "EUR", "RUB", "CNY"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.currency !== "KGS" && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-2">
                    <Input type="number" value={form.exchangeRate} onChange={e => setForm(f => ({ ...f, exchangeRate: e.target.value }))}
                      className="flex-1 h-8 text-xs border-gray-200" placeholder="Курс" />
                    <Select value={form.exchangeRateSource} onValueChange={v => setForm(f => ({ ...f, exchangeRateSource: v }))}>
                      <SelectTrigger className="w-24 h-8 text-xs border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>{RATE_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="text-xs text-blue-600 font-mono bg-blue-50 rounded px-2 py-1">
                    ≈ {fmt(amountKgs)} KGS
                  </div>
                </div>
              )}
            </div>

            {/* Account */}
            <div>
              <Label className="text-xs text-gray-500">СЧЁТ</Label>
              <Select value={form.accountId} onValueChange={v => setForm(f => ({ ...f, accountId: v }))}>
                <SelectTrigger className="mt-1 h-9 text-sm border-gray-200"><SelectValue placeholder="Выберите счёт" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не указан</SelectItem>
                  {accounts.map((a: any) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} ({fmt(a.currentBalance)} {a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            {panelType !== "transfer" && (
              <div>
                <Label className="text-xs text-gray-500">СТАТЬЯ</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm border-gray-200"><SelectValue placeholder="Выберите статью" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date */}
            <div>
              <Label className="text-xs text-gray-500">ДАТА</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="mt-1 h-9 text-sm border-gray-200" />
            </div>

            {/* Project */}
            <div>
              <Label className="text-xs text-gray-500">ПРОЕКТ ИЛИ НАПРАВЛЕНИЕ</Label>
              <Select value={form.projectId} onValueChange={v => setForm(f => ({ ...f, projectId: v }))}>
                <SelectTrigger className="mt-1 h-9 text-sm border-gray-200"><SelectValue placeholder="Выберите проект..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не привязан</SelectItem>
                  {projects.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-gray-500">ОПИСАНИЕ *</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 text-sm resize-none border-gray-200" rows={3} placeholder="Краткое описание операции..." />
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs text-gray-500">СТАТУС</Label>
              <div className="flex gap-2 mt-1">
                {[["approved", "Проведена"], ["pending", "Плановая"]].map(([v, l]) => (
                  <button key={v} onClick={() => setForm(f => ({ ...f, status: v }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.status === v ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs text-gray-500">ПРИМЕЧАНИЕ</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="mt-1 text-sm resize-none border-gray-200" rows={2} placeholder="Дополнительно..." />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <Button
              className={`w-full h-9 text-sm font-semibold ${panelType === "income" ? "bg-emerald-500 hover:bg-emerald-600" : panelType === "expense" ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}
              disabled={createMut.isPending || !form.description || !form.amount}
              onClick={() => createMut.mutate({
                ...form,
                amountKgs: amountKgs,
                projectId: form.projectId && form.projectId !== "none" ? Number(form.projectId) : null,
                accountId: form.accountId && form.accountId !== "none" ? Number(form.accountId) : null,
              })}>
              {createMut.isPending ? "Сохранение..." : "Добавить операцию"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
