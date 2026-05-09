import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, HardHat, MapPin, Building, Calculator } from "lucide-react";

function fmtNum(v: string | number | null | undefined) {
  if (!v) return "—";
  const n = parseFloat(String(v));
  return new Intl.NumberFormat("ru-RU").format(n);
}

const BUILD_TYPES = [
  { value: "apartment", label: "Жилой дом (квартиры)" },
  { value: "commercial", label: "Коммерческая недвижимость" },
  { value: "office", label: "Офисный центр" },
  { value: "warehouse", label: "Склад" },
  { value: "mixed", label: "Многофункциональный" },
  { value: "cottage", label: "Коттедж / дача" },
];
const CONST_TYPES = [
  { value: "monolith", label: "Монолит" },
  { value: "brick", label: "Кирпич" },
  { value: "panel", label: "Панельный" },
  { value: "frame", label: "Каркасный" },
  { value: "wood", label: "Дерево" },
];
const STATUS_OPTS = [
  { value: "planning", label: "Планирование" },
  { value: "active", label: "Активен" },
  { value: "paused", label: "Приостановлен" },
  { value: "completed", label: "Завершён" },
];
const CURRENCY_OPTS = ["KGS", "USD", "EUR", "RUB", "CNY"];
const RATE_SOURCES = [
  { value: "nbkr", label: "НБКР (официальный)" },
  { value: "optima", label: "Optima Bank" },
  { value: "rsb", label: "RSB Bank" },
  { value: "bakai", label: "Bakai Bank" },
  { value: "dobank", label: "Dos-Credit Bank" },
  { value: "mbank", label: "MBank" },
  { value: "manual", label: "Ввести вручную" },
];
const STATUS_COLORS: Record<string, string> = {
  planning: "bg-gray-100 text-white", active: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700", paused: "bg-amber-100 text-amber-700",
};

interface Project {
  id: number; name: string; address?: string; region?: string; status: string;
  buildingType: string; constructionType: string;
  totalFloors?: number; totalUnits?: number; totalArea?: string;
  costPerSqm?: string; currency: string; exchangeRateSource: string; exchangeRate?: string;
  estimatedCostKgs?: string; startDate?: string; plannedEndDate?: string; description?: string;
  createdAt: string;
}

const emptyForm = () => ({
  name: "", address: "", region: "", status: "planning",
  buildingType: "apartment", constructionType: "monolith",
  totalFloors: "", totalUnits: "", totalArea: "",
  costPerSqm: "", currency: "KGS", exchangeRateSource: "nbkr", exchangeRate: "1",
  startDate: "", plannedEndDate: "", description: "",
});

function ProjectDialog({ project, onClose, onSaved }: {
  project: Project | null | "new"; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const isEdit = project && project !== "new";
  const init = isEdit ? project as Project : null;
  const [form, setForm] = useState(() =>
    init ? {
      name: init.name, address: init.address || "", region: init.region || "",
      status: init.status, buildingType: init.buildingType, constructionType: init.constructionType,
      totalFloors: String(init.totalFloors || ""), totalUnits: String(init.totalUnits || ""),
      totalArea: init.totalArea || "", costPerSqm: init.costPerSqm || "",
      currency: init.currency, exchangeRateSource: init.exchangeRateSource,
      exchangeRate: init.exchangeRate || "1",
      startDate: init.startDate || "", plannedEndDate: init.plannedEndDate || "",
      description: init.description || "",
    } : emptyForm()
  );
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const area = parseFloat(form.totalArea || "0");
  const cps = parseFloat(form.costPerSqm || "0");
  const rate = parseFloat(form.exchangeRate || "1");
  const estimatedLocal = area * cps;
  const estimatedKgs = form.currency === "KGS" ? estimatedLocal : estimatedLocal * rate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast({ title: "Укажите название проекта", variant: "destructive" }); return; }
    setLoading(true);
    try {
      // Подготовка данных - конвертация строк в числа
      const payload = {
        ...form,
        totalFloors: form.totalFloors ? parseInt(form.totalFloors) : null,
        totalUnits: form.totalUnits ? parseInt(form.totalUnits) : null,
        totalArea: form.totalArea ? parseFloat(form.totalArea) : null,
        costPerSqm: form.costPerSqm ? parseFloat(form.costPerSqm) : null,
        exchangeRate: form.exchangeRate ? parseFloat(form.exchangeRate) : 1,
        totalBudget: estimatedKgs,
      };

      if (isEdit) {
        await api.patch(`/construction/projects/${(init as Project).id}`, payload);
      } else {
        await api.post("/construction/projects", payload);
      }

      toast({ title: isEdit ? "Проект обновлён" : "Проект создан" });
      onSaved(); onClose();
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.response?.data?.message || err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={!!project} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать проект" : "Новый строительный проект"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Основная информация */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Основное</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Название проекта *</Label>
                <Input className="mt-1" value={form.name} onChange={e => set("name", e.target.value)} placeholder='ЖК "Бишкек Хайтс"' required />
              </div>
              <div>
                <Label>Статус</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Регион</Label>
                <Input className="mt-1" value={form.region} onChange={e => set("region", e.target.value)} placeholder="Бишкек" />
              </div>
              <div className="col-span-2">
                <Label>Адрес</Label>
                <Input className="mt-1" value={form.address} onChange={e => set("address", e.target.value)} placeholder="ул. Манаса, 45" />
              </div>
            </div>
          </div>

          {/* Характеристики здания */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> Характеристики здания
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Тип здания</Label>
                <Select value={form.buildingType} onValueChange={v => set("buildingType", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{BUILD_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Тип конструкции</Label>
                <Select value={form.constructionType} onValueChange={v => set("constructionType", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONST_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Этажей</Label>
                <Input className="mt-1" type="number" min="1" value={form.totalFloors} onChange={e => set("totalFloors", e.target.value)} placeholder="16" />
              </div>
              <div>
                <Label>Квартир / юнитов</Label>
                <Input className="mt-1" type="number" min="1" value={form.totalUnits} onChange={e => set("totalUnits", e.target.value)} placeholder="120" />
              </div>
              <div className="col-span-2">
                <Label>Общая площадь (кв.м)</Label>
                <Input className="mt-1" type="number" min="0" step="0.01" value={form.totalArea} onChange={e => set("totalArea", e.target.value)} placeholder="8400" />
              </div>
            </div>
          </div>

          {/* Себестоимость */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Расчёт себестоимости
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Стоимость за 1 кв.м</Label>
                <Input className="mt-1" type="number" min="0" value={form.costPerSqm} onChange={e => set("costPerSqm", e.target.value)} placeholder="1200" />
              </div>
              <div>
                <Label>Валюта</Label>
                <Select value={form.currency} onValueChange={v => set("currency", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCY_OPTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.currency !== "KGS" && (
                <>
                  <div>
                    <Label>Источник курса</Label>
                    <Select value={form.exchangeRateSource} onValueChange={v => set("exchangeRateSource", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{RATE_SOURCES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Курс к KGS</Label>
                    <Input className="mt-1" type="number" min="0" step="0.0001" value={form.exchangeRate} onChange={e => set("exchangeRate", e.target.value)} placeholder="88.5" />
                  </div>
                </>
              )}
            </div>

            {/* Auto-calculated cost */}
            {estimatedKgs > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {form.currency !== "KGS" && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">Сумма в {form.currency}</p>
                    <p className="text-lg font-bold text-blue-700">{fmtNum(estimatedLocal)} {form.currency}</p>
                  </div>
                )}
                <div className="bg-emerald-50 p-3 rounded-lg col-span-1">
                  <p className="text-xs text-emerald-600 font-medium">Себестоимость в KGS</p>
                  <p className="text-lg font-bold text-emerald-700">{fmtNum(estimatedKgs)} с</p>
                </div>
              </div>
            )}
          </div>

          {/* Сроки */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Сроки</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Дата начала</Label>
                <Input className="mt-1" type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
              </div>
              <div>
                <Label>Плановая дата сдачи</Label>
                <Input className="mt-1" type="date" value={form.plannedEndDate} onChange={e => set("plannedEndDate", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label>Описание</Label>
            <Textarea className="mt-1" value={form.description} onChange={e => set("description", e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-orange-600" disabled={loading}>
              {loading ? "Сохранение..." : isEdit ? "Сохранить" : "Создать проект"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ConstructionProjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<Project | null | "new">(null);
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery<{ data: Project[], meta?: any }>({
    queryKey: ["construction-projects"],
    queryFn: () => api.get("/construction/projects?page=1&limit=100").then(r => r.data),
  });

  const projects = response?.data || [];
  const projectsArray = Array.isArray(projects) ? projects : [];
  const filtered = projectsArray.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Удалить проект "${name}"?`)) return;
    try {
      await api.delete(`/construction/projects/${id}`);
      toast({ title: "Проект удалён" });
      queryClient.invalidateQueries({ queryKey: ["construction-projects"] });
    } catch (err: any) {
      toast({ title: "Ошибка удаления", description: err.message, variant: "destructive" });
    }
  };

  const BUILD_TYPE_LABELS: Record<string, string> = Object.fromEntries(BUILD_TYPES.map(b => [b.value, b.label]));
  const CONST_TYPE_LABELS: Record<string, string> = Object.fromEntries(CONST_TYPES.map(c => [c.value, c.label]));
  const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUS_OPTS.map(s => [s.value, s.label]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Строительные проекты</h1>
          <p className="text-sm text-gray-500 mt-0.5">Управление проектами и расчёт себестоимости</p>
        </div>
        <Button onClick={() => setDialog("new")} className="bg-amber-500 hover:bg-orange-600 gap-2">
          <Plus className="w-4 h-4" /> Новый проект
        </Button>
      </div>

      <div className="mb-2">
        <Input placeholder="Поиск по названию или адресу..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <HardHat className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">{search ? "Ничего не найдено" : "Проектов пока нет"}</p>
          <p className="text-sm mt-1">Нажмите «Новый проект» чтобы начать</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const estimated = parseFloat(p.estimatedCostKgs || "0");
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate">{p.name}</h3>
                      {(p.address || p.region) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-400 truncate">{p.address || p.region}</p>
                        </div>
                      )}
                    </div>
                    <Badge className={STATUS_COLORS[p.status] || ""} variant="secondary">
                      {STATUS_LABEL[p.status] || p.status}
                    </Badge>
                  </div>

                  {/* Building characteristics */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-400">Тип</p>
                      <p className="text-xs font-semibold text-gray-700 leading-tight mt-0.5 truncate">
                        {BUILD_TYPE_LABELS[p.buildingType]?.split("(")[0].trim() || p.buildingType}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-400">Этажей</p>
                      <p className="text-sm font-bold text-gray-800">{p.totalFloors || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-400">Юнитов</p>
                      <p className="text-sm font-bold text-gray-800">{p.totalUnits || "—"}</p>
                    </div>
                  </div>

                  {/* Cost calculation */}
                  {estimated > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
                      <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Себестоимость</p>
                      <p className="text-lg font-bold text-amber-700">{fmtNum(estimated)} с</p>
                      {p.totalArea && p.costPerSqm && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          {fmtNum(p.totalArea)} м² × {fmtNum(p.costPerSqm)} {p.currency}
                          {p.currency !== "KGS" && ` (×${p.exchangeRate} KGS)`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  {(p.startDate || p.plannedEndDate) && (
                    <p className="text-xs text-gray-400 mb-3">
                      {p.startDate && `Нач: ${new Date(p.startDate).toLocaleDateString("ru-KG")}`}
                      {p.startDate && p.plannedEndDate && " — "}
                      {p.plannedEndDate && `Сдача: ${new Date(p.plannedEndDate).toLocaleDateString("ru-KG")}`}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setDialog(p)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Редактировать
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-rose-600 hover:text-rose-600" onClick={() => handleDelete(p.id, p.name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectDialog
        project={dialog}
        onClose={() => setDialog(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["construction-projects"] })}
      />
    </div>
  );
}

