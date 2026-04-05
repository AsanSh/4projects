import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useListProperties } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface OwnerStatement {
  id: number;
  propertyId: number;
  period: string;
  rentCharged: string;
  rentReceived: string;
  expenses: string;
  netIncome: string;
  currency: string;
  generatedAt: string;
  unitNumber?: string;
}

async function fetchStatements(propertyId?: string, month?: string): Promise<OwnerStatement[]> {
  const params = new URLSearchParams();
  if (propertyId && propertyId !== "all") params.set("propertyId", propertyId);
  if (month) params.set("month", month);
  const res = await fetch(`/api/rental/statements?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Ошибка загрузки актов");
  return res.json();
}

async function generateStatement(propertyId: number, period: string): Promise<OwnerStatement> {
  const res = await fetch("/api/rental/statements/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ propertyId, period }),
  });
  if (!res.ok) throw new Error("Ошибка генерации акта");
  return res.json();
}

function formatCurrency(amount: string | number, currency: string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const cur = currency === "KGS" ? "KGS" : currency === "USD" ? "USD" : "KGS";
  return new Intl.NumberFormat("ru-KG", { style: "currency", currency: cur }).format(num);
}

export default function OwnerStatements() {
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [generatePropertyId, setGeneratePropertyId] = useState("");
  const [generatePeriod, setGeneratePeriod] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: properties } = useListProperties();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statements, isLoading } = useQuery({
    queryKey: ["owner-statements", propertyFilter, monthFilter],
    queryFn: () => fetchStatements(propertyFilter, monthFilter),
  });

  const handleGenerate = async () => {
    if (!generatePropertyId) {
      toast({ title: "Выберите объект", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      await generateStatement(parseInt(generatePropertyId), generatePeriod);
      toast({ title: "Акт сформирован" });
      queryClient.invalidateQueries({ queryKey: ["owner-statements"] });
    } catch {
      toast({ title: "Ошибка", description: "Не удалось сформировать акт", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const totalNetIncome = (statements || []).reduce((s, r) => s + parseFloat(r.netIncome), 0);
  const totalCharged = (statements || []).reduce((s, r) => s + parseFloat(r.rentCharged), 0);
  const totalReceived = (statements || []).reduce((s, r) => s + parseFloat(r.rentReceived), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Акты собственников</h1>
          <p className="text-sm text-gray-500 mt-1">Ежемесячные отчёты о доходах и расходах по объектам</p>
        </div>
      </div>

      {/* Generate section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-800 mb-3">Сформировать новый акт</p>
        <div className="flex flex-wrap gap-3">
          <Select value={generatePropertyId} onValueChange={setGeneratePropertyId}>
            <SelectTrigger className="w-64">
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
          <Input
            type="month"
            value={generatePeriod}
            onChange={(e) => setGeneratePeriod(e.target.value)}
            className="w-44"
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Формирование..." : "Сформировать"}
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      {!isLoading && (statements || []).length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Начислено", value: totalCharged, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Получено", value: totalReceived, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
            { label: "Чистый доход", value: totalNetIncome, icon: totalNetIncome >= 0 ? TrendingUp : TrendingDown, color: totalNetIncome >= 0 ? "text-green-600" : "text-red-500", bg: totalNetIncome >= 0 ? "bg-green-50" : "bg-red-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>
                {formatCurrency(stat.value, "KGS")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Все объекты" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все объекты</SelectItem>
            {(properties || []).map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.projectName} — {p.unitNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-44"
          placeholder="Период"
        />
        {monthFilter && (
          <Button variant="outline" size="sm" onClick={() => setMonthFilter("")}>
            Сбросить
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Объект</TableHead>
              <TableHead>Период</TableHead>
              <TableHead>Начислено</TableHead>
              <TableHead>Получено</TableHead>
              <TableHead>Расходы</TableHead>
              <TableHead>Чистый доход</TableHead>
              <TableHead>Дата формирования</TableHead>
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
            ) : !(statements?.length) ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                  Акты не найдены. Выберите объект и период, затем нажмите «Сформировать».
                </TableCell>
              </TableRow>
            ) : (
              statements.map((s) => {
                const net = parseFloat(s.netIncome);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.unitNumber || `Объект #${s.propertyId}`}</TableCell>
                    <TableCell>{s.period}</TableCell>
                    <TableCell>{formatCurrency(s.rentCharged, s.currency)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(s.rentReceived, s.currency)}</TableCell>
                    <TableCell className="text-red-500">{formatCurrency(s.expenses, s.currency)}</TableCell>
                    <TableCell className={`font-semibold ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {net >= 0 ? "+" : ""}{formatCurrency(s.netIncome, s.currency)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {new Date(s.generatedAt).toLocaleString("ru-KG")}
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
