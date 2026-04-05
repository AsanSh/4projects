import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, User, Shield, Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

interface Company {
  id: number;
  name: string;
  legalName: string | null;
  bin: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"org" | "profile">("org");

  const [org, setOrg] = useState<Company | null>(null);
  const [form, setForm] = useState({
    name: "",
    legalName: "",
    bin: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    apiFetch("/companies/my")
      .then((data: Company) => {
        setOrg(data);
        setForm({
          name: data.name || "",
          legalName: data.legalName || "",
          bin: data.bin || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
        });
      })
      .catch(() => {
        toast({ title: "Ошибка", description: "Не удалось загрузить данные организации", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast({ title: "Ошибка", description: "Название организации обязательно", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/companies/my", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast({ title: "Сохранено", description: "Данные организации обновлены" });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = (user as any)?.role === "admin";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-500 text-sm mt-1">Управление организацией и аккаунтом</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-0">
        {[
          { id: "org", label: "Организация", icon: Building2 },
          { id: "profile", label: "Мой профиль", icon: User },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Org settings */}
      {activeTab === "org" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{org?.name || "Организация"}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">
                      {isAdmin ? "Администратор" : "Сотрудник"}
                    </span>
                  </div>
                </div>
              </div>

              {isAdmin ? (
                <form onSubmit={handleSaveOrg} className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Название компании *</Label>
                    <Input
                      value={form.name}
                      onChange={set("name")}
                      required
                      className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Юридическое название</Label>
                    <Input
                      value={form.legalName}
                      onChange={set("legalName")}
                      placeholder="Полное юридическое наименование"
                      className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">ИНН / ИНО</Label>
                      <Input
                        value={form.bin}
                        onChange={set("bin")}
                        placeholder="12345678901234"
                        className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Телефон</Label>
                      <Input
                        value={form.phone}
                        onChange={set("phone")}
                        placeholder="+996 700 000 000"
                        className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email организации</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="info@company.kg"
                      className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Юридический адрес</Label>
                    <Input
                      value={form.address}
                      onChange={set("address")}
                      placeholder="г. Бишкек, ул. Манаса 72"
                      className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="h-11 px-6 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Сохранить изменения
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Название", value: org?.name },
                    { label: "Юридическое название", value: org?.legalName },
                    { label: "ИНН / ИНО", value: org?.bin },
                    { label: "Телефон", value: org?.phone },
                    { label: "Email", value: org?.email },
                    { label: "Адрес", value: org?.address },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex py-2 border-b border-gray-50 last:border-0">
                      <span className="w-48 text-sm text-gray-500 flex-shrink-0">{label}</span>
                      <span className="text-sm text-gray-900 font-medium">{value || "—"}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pt-2">Обратитесь к администратору для изменения данных организации.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
              {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </p>
              <p className="text-sm text-gray-500">{(user as any)?.email}</p>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                isAdmin ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
              }`}>
                <Shield className="h-3 w-3" />
                {isAdmin ? "Администратор" : "Сотрудник"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "Email", value: (user as any)?.email },
              { label: "Имя", value: (user as any)?.firstName },
              { label: "Фамилия", value: (user as any)?.lastName },
              { label: "Роль", value: isAdmin ? "Администратор" : "Сотрудник" },
            ].map(({ label, value }) => (
              <div key={label} className="flex py-2.5 border-b border-gray-50 last:border-0">
                <span className="w-36 text-sm text-gray-500 flex-shrink-0">{label}</span>
                <span className="text-sm text-gray-900 font-medium">{value || "—"}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 pt-4">
            Для изменения личных данных или пароля обратитесь к администратору.
          </p>
        </div>
      )}
    </div>
  );
}
