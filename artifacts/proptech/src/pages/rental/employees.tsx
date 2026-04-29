import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { UserCircle, Mail, Phone, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  owner: "Владелец",
  employee: "Сотрудник",
  accountant: "Бухгалтер",
};
const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  manager: "bg-blue-100 text-blue-800",
  owner: "bg-purple-100 text-purple-800",
  employee: "bg-gray-100 text-gray-700",
  accountant: "bg-green-100 text-green-800",
};

export default function RentalEmployees() {
  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["company-users"],
    queryFn: () => api.get("/auth/users").then(r => r.data),
  });

  const active = users.filter((u: any) => u.isActive !== false);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Сотрудники</h1>
        <p className="text-gray-500 text-sm mt-0.5">Пользователи модуля аренды</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Всего сотрудников</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Активных</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{active.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Администраторов</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {users.filter((u: any) => u.role === "admin").length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-gray-400">
            <UserCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет данных о сотрудниках</p>
          </div>
        ) : users.map((u: any) => (
          <div key={u.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                {(u.fullName || u.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{u.fullName || u.email}</p>
                <div className="mt-1">
                  <Badge className={`text-[10px] px-1.5 py-0 ${roleColors[u.role] || roleColors.employee}`}>
                    {roleLabels[u.role] || u.role || "Сотрудник"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {u.email && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{u.email}</span>
                </div>
              )}
              {u.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="w-3 h-3" />
                  <span>{u.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
