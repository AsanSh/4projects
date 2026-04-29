import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, Phone, Mail, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function RentalCounterparties() {
  const [search, setSearch] = useState("");

  const { data: tenants = [], isLoading } = useQuery<any[]>({
    queryKey: ["rental-tenants"],
    queryFn: () => api.get("/rental/tenants").then(r => r.data),
  });
  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ["rental-contracts"],
    queryFn: () => api.get("/rental/contracts").then(r => r.data),
  });

  const enriched = tenants
    .map((t: any) => {
      const tenantContracts = contracts.filter((c: any) => c.tenantId === t.id);
      const active = tenantContracts.filter((c: any) => c.status === "active");
      return { ...t, contractCount: tenantContracts.length, activeCount: active.length };
    })
    .filter((t: any) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return t.name?.toLowerCase().includes(q) || t.phone?.includes(q) || t.email?.toLowerCase().includes(q);
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Контрагенты</h1>
          <p className="text-gray-500 text-sm mt-0.5">Арендаторы и партнёры</p>
        </div>
        <Input
          className="w-56 h-8 text-sm"
          placeholder="Поиск..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Всего арендаторов</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{tenants.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Активных договоров</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {contracts.filter((c: any) => c.status === "active").length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Юрлиц</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {tenants.filter((t: any) => t.type === "company").length}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Арендатор</th>
              <th className="text-left p-3 font-medium text-gray-600">Контакты</th>
              <th className="text-left p-3 font-medium text-gray-600">ИНН / Паспорт</th>
              <th className="text-center p-3 font-medium text-gray-600">Договоры</th>
              <th className="text-center p-3 font-medium text-gray-600">Статус</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Загрузка...</td></tr>
            ) : enriched.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Нет контрагентов</p>
                </td>
              </tr>
            ) : enriched.map((t: any) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                      {(t.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {t.type === "company" ? (
                          <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">Юрлицо</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0">Физлицо</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {t.phone && (
                    <div className="flex items-center gap-1 text-gray-600 text-xs">
                      <Phone className="w-3 h-3" /> {t.phone}
                    </div>
                  )}
                  {t.email && (
                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                      <Mail className="w-3 h-3" /> {t.email}
                    </div>
                  )}
                </td>
                <td className="p-3 text-gray-600 text-xs font-mono">{t.inn || t.passportNumber || "—"}</td>
                <td className="p-3 text-center">
                  <span className="text-gray-700 font-medium">{t.contractCount}</span>
                  {t.activeCount > 0 && (
                    <span className="text-xs text-green-600 ml-1">({t.activeCount} акт.)</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {t.activeCount > 0 ? (
                    <Badge className="bg-green-100 text-green-800">Активный</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600">Неактивный</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
