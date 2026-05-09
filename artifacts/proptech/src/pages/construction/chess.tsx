import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Grid3X3, Plus, Layers } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const ah = () => { const t = localStorage.getItem("auth_token"); return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }; };

function fmtNum(v: string | number | null | undefined) {
  if (!v) return "—";
  return new Intl.NumberFormat("ru-KG", { maximumFractionDigits: 0 }).format(parseFloat(String(v)));
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  available: { label: "Свободна", bg: "bg-emerald-50 hover:bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  reserved: { label: "Забронирована", bg: "bg-blue-50 hover:bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  sold: { label: "Продана", bg: "bg-amber-50 hover:bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  occupied: { label: "Заселена", bg: "bg-blue-50 hover:bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  construction: { label: "Строится", bg: "bg-amber-50 hover:bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
};

const UNIT_TYPES = [
  { value: "apartment", label: "Квартира" },
  { value: "studio", label: "Студия" },
  { value: "office", label: "Офис" },
  { value: "commercial", label: "Коммерческое" },
  { value: "parking", label: "Паркинг" },
  { value: "storage", label: "Кладовая" },
];

interface Unit {
  id: number; projectId: number; unitNumber: string; floor?: number; block?: string;
  unitType: string; roomCount?: number; area?: string; pricePerSqm?: string;
  totalPrice?: string; currency: string; status: string; notes?: string;
}
interface Project { id: number; name: string; totalFloors?: number; totalUnits?: number; }

function UnitDialog({ unit, projectId, onClose, onSaved }: { unit: Unit | null | "new"; projectId: number; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const isEdit = unit && unit !== "new";
  const init = isEdit ? unit as Unit : null;
  const [form, setForm] = useState({
    unitNumber: init?.unitNumber || "", floor: String(init?.floor || ""),
    block: init?.block || "", unitType: init?.unitType || "apartment",
    roomCount: String(init?.roomCount || ""), area: init?.area || "",
    pricePerSqm: init?.pricePerSqm || "", currency: init?.currency || "KGS",
    status: init?.status || "available", notes: init?.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const totalPrice = parseFloat(form.area || "0") * parseFloat(form.pricePerSqm || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unitNumber) { toast({ title: "Укажите номер квартиры", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const url = isEdit ? `${BASE}/construction/units/${init!.id}` : `${BASE}/construction/units`;
      await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: ah(), body: JSON.stringify({ ...form, projectId }) });
      toast({ title: isEdit ? "Обновлено" : "Квартира добавлена" });
      onSaved(); onClose();
    } catch { toast({ title: "Ошибка", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={!!unit} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? `Квартира ${init?.unitNumber}` : "Добавить квартиру"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Номер *</Label><Input className="mt-1" value={form.unitNumber} onChange={e => set("unitNumber", e.target.value)} required /></div>
            <div><Label>Этаж</Label><Input className="mt-1" type="number" value={form.floor} onChange={e => set("floor", e.target.value)} /></div>
            <div><Label>Секция / блок</Label><Input className="mt-1" value={form.block} onChange={e => set("block", e.target.value)} placeholder="А" /></div>
            <div>
              <Label>Тип</Label>
              <Select value={form.unitType} onValueChange={v => set("unitType", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{UNIT_TYPES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Комнат</Label><Input className="mt-1" type="number" min="0" value={form.roomCount} onChange={e => set("roomCount", e.target.value)} /></div>
            <div><Label>Площадь (м²)</Label><Input className="mt-1" type="number" step="0.01" value={form.area} onChange={e => set("area", e.target.value)} /></div>
            <div><Label>Цена за м²</Label><Input className="mt-1" type="number" value={form.pricePerSqm} onChange={e => set("pricePerSqm", e.target.value)} /></div>
            <div>
              <Label>Статус</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS_CFG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {totalPrice > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs text-amber-600">Стоимость квартиры</p>
              <p className="text-lg font-bold text-amber-700">{fmtNum(totalPrice)} {form.currency}</p>
            </div>
          )}
          <div><Label>Заметки</Label><Input className="mt-1" value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-orange-600" disabled={loading}>{loading ? "..." : "Сохранить"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkGenerateDialog({ projectId, onClose, onSaved }: { projectId: number; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ floors: "", unitsPerFloor: "", block: "", area: "", pricePerSqm: "", currency: "KGS" });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const total = parseInt(form.floors || "0") * parseInt(form.unitsPerFloor || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.floors || !form.unitsPerFloor) { toast({ title: "Укажите этажи и квартиры", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/construction/units/bulk`, { method: "POST", headers: ah(), body: JSON.stringify({ ...form, projectId }) });
      if (!res.ok) throw new Error();
      toast({ title: `Сгенерировано ${total} квартир` });
      onSaved(); onClose();
    } catch { toast({ title: "Ошибка", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Быстрое заполнение шахматки</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Этажей *</Label><Input className="mt-1" type="number" min="1" value={form.floors} onChange={e => set("floors", e.target.value)} required /></div>
            <div><Label>Квартир на этаже *</Label><Input className="mt-1" type="number" min="1" value={form.unitsPerFloor} onChange={e => set("unitsPerFloor", e.target.value)} required /></div>
            <div><Label>Секция</Label><Input className="mt-1" value={form.block} onChange={e => set("block", e.target.value)} placeholder="А" /></div>
            <div><Label>Площадь (м²)</Label><Input className="mt-1" type="number" value={form.area} onChange={e => set("area", e.target.value)} /></div>
            <div><Label>Цена за м²</Label><Input className="mt-1" type="number" value={form.pricePerSqm} onChange={e => set("pricePerSqm", e.target.value)} /></div>
            <div>
              <Label>Валюта</Label>
              <Select value={form.currency} onValueChange={v => set("currency", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["KGS","USD","EUR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {total > 0 && <p className="text-sm text-amber-600 font-medium text-center">Будет создано {total} квартир</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-orange-600" disabled={loading}>{loading ? "Создание..." : "Сгенерировать"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ConstructionChess() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null | "new">(null);
  const [showBulk, setShowBulk] = useState(false);
  const [blockFilter, setBlockFilter] = useState("all");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["construction-projects"],
    queryFn: async () => {
      const res = await api.get<Project[]>("/construction/projects");
      if (res.data.length && !projectId) setProjectId(res.data[0].id);
      return res.data;
    },
  });

  const { data: units = [], isLoading } = useQuery<Unit[]>({
    queryKey: ["construction-units", projectId],
    queryFn: () => api.get("/construction/units", { params: { projectId: String(projectId) } }).then(r => r.data),
    enabled: !!projectId,
  });

  const blocks = ["all", ...Array.from(new Set(units.map(u => u.block || "Без секции")))];
  const filteredUnits = blockFilter === "all" ? units : units.filter(u => (u.block || "Без секции") === blockFilter);

  // Group by floor descending
  const floors = Array.from(new Set(filteredUnits.map(u => u.floor || 0))).sort((a, b) => b - a);

  const stats = Object.entries(STATUS_CFG).map(([k, v]) => ({
    key: k, label: v.label, count: units.filter(u => u.status === k).length, ...v,
  }));

  const handleStatusChange = async (unit: Unit, newStatus: string) => {
    await fetch(`${BASE}/construction/units/${unit.id}`, {
      method: "PATCH", headers: ah(), body: JSON.stringify({ ...unit, status: newStatus }),
    });
    qc.invalidateQueries({ queryKey: ["construction-units", projectId] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Шахматка</h1>
          <p className="text-sm text-gray-500 mt-0.5">Визуальная карта квартир по этажам</p>
        </div>
        <div className="flex gap-2">
          {projectId && <Button variant="outline" onClick={() => setShowBulk(true)} className="gap-2 text-xs"><Layers className="w-3.5 h-3.5" /> Заполнить шахматку</Button>}
          {projectId && <Button onClick={() => setSelectedUnit("new")} className="bg-amber-500 hover:bg-orange-600 gap-2 text-xs"><Plus className="w-3.5 h-3.5" /> Добавить квартиру</Button>}
        </div>
      </div>

      {/* Project selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Label className="text-sm font-medium whitespace-nowrap">Проект:</Label>
          <div className="flex gap-2 flex-wrap">
            {projects.map(p => (
              <button key={p.id} onClick={() => setProjectId(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${projectId === p.id ? "bg-amber-500 text-white" : "bg-gray-100 text-white hover:bg-gray-200"}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!projectId ? (
        <div className="text-center py-16 text-gray-400"><Grid3X3 className="w-12 h-12 mx-auto mb-2 opacity-20" /><p>Выберите проект</p></div>
      ) : (
        <>
          {/* Legend + Stats */}
          <div className="flex flex-wrap gap-3">
            {stats.map(s => (
              <div key={s.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${s.bg} ${s.border}`}>
                <div className={`w-3 h-3 rounded ${s.bg.replace("hover:", "").replace("50", "400").split(" ")[0]}`} />
                <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
                <span className={`text-xs font-bold ${s.text}`}>{s.count}</span>
              </div>
            ))}
          </div>

          {/* Block filter */}
          {blocks.length > 2 && (
            <div className="flex gap-2">
              {blocks.map(b => (
                <button key={b} onClick={() => setBlockFilter(b)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${blockFilter === b ? "bg-amber-500 text-white" : "bg-gray-100 text-white hover:bg-gray-200"}`}>
                  {b === "all" ? "Все секции" : `Секция ${b}`}
                </button>
              ))}
            </div>
          )}

          {/* Chess grid */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Загрузка...</div>
          ) : units.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
              <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Шахматка пуста</p>
              <p className="text-sm mt-1">Используйте «Заполнить шахматку» для быстрого создания квартир</p>
              <Button onClick={() => setShowBulk(true)} className="mt-4 bg-amber-500 hover:bg-orange-600 gap-2"><Layers className="w-4 h-4" /> Заполнить шахматку</Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
              <div className="p-4 min-w-max">
                {floors.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">Нет данных для отображения</div>
                ) : floors.map(floor => {
                  const floorUnits = filteredUnits.filter(u => (u.floor || 0) === floor).sort((a, b) => a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }));
                  return (
                    <div key={floor} className="flex items-center gap-2 mb-1.5">
                      <div className="w-12 text-right text-[10px] font-bold text-gray-400 pr-1 flex-shrink-0">
                        {floor > 0 ? `${floor}эт` : "—"}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {floorUnits.map(unit => {
                          const cfg = STATUS_CFG[unit.status] || STATUS_CFG.available;
                          return (
                            <button
                              key={unit.id}
                              onClick={() => setSelectedUnit(unit)}
                              title={`${unit.unitNumber} · ${unit.area ? unit.area + " м²" : ""} · ${cfg.label}`}
                              className={`w-14 h-12 rounded border-2 text-center transition-all flex flex-col items-center justify-center p-0.5 ${cfg.bg} ${cfg.border}`}
                            >
                              <span className={`text-[10px] font-bold ${cfg.text}`}>{unit.unitNumber}</span>
                              {unit.area && <span className={`text-[8px] ${cfg.text} opacity-70`}>{unit.area}м²</span>}
                              {unit.roomCount && <span className={`text-[8px] ${cfg.text} opacity-70`}>{unit.roomCount}к</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {selectedUnit && projectId && (
        <UnitDialog unit={selectedUnit} projectId={projectId} onClose={() => setSelectedUnit(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["construction-units", projectId] })} />
      )}
      {showBulk && projectId && (
        <BulkGenerateDialog projectId={projectId} onClose={() => setShowBulk(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["construction-units", projectId] })} />
      )}
    </div>
  );
}

