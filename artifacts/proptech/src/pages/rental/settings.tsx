import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Bell, FileText, CreditCard } from "lucide-react";

const tabs = [
  { id: "general", label: "Общие", icon: Settings },
  { id: "billing", label: "Начисления", icon: CreditCard },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "documents", label: "Документы", icon: FileText },
];

export default function RentalSettings() {
  const { toast } = useToast();
  const [tab, setTab] = useState("general");
  const [general, setGeneral] = useState({
    companyName: "", currency: "KGS", timezone: "Asia/Bishkek",
    lateFeePercent: "0.1", lateFeeGraceDays: "3", vatPercent: "12",
  });
  const [billing, setBilling] = useState({
    accrualDay: "1", dueDays: "5", autoAccrual: "true", roundUp: "true",
  });
  const [notif, setNotif] = useState({
    overdueReminder: "3", upcomingReminder: "5", channel: "sms",
  });

  function save() {
    toast({ title: "Настройки сохранены" });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Настройки модуля аренды</h1>
        <p className="text-gray-500 text-sm mt-0.5">Конфигурация правил и параметров</p>
      </div>

      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-2xl space-y-5">
        {tab === "general" && (
          <>
            <div>
              <Label className="text-sm font-medium">Название компании</Label>
              <Input className="mt-1.5" value={general.companyName}
                onChange={e => setGeneral(f => ({ ...f, companyName: e.target.value }))}
                placeholder="ИП Иванов Иван" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Валюта</Label>
                <Select value={general.currency} onValueChange={v => setGeneral(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KGS">KGS — Кыргызский сом</SelectItem>
                    <SelectItem value="USD">USD — Доллар США</SelectItem>
                    <SelectItem value="EUR">EUR — Евро</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Часовой пояс</Label>
                <Select value={general.timezone} onValueChange={v => setGeneral(f => ({ ...f, timezone: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Bishkek">Asia/Bishkek (UTC+6)</SelectItem>
                    <SelectItem value="Asia/Almaty">Asia/Almaty (UTC+6)</SelectItem>
                    <SelectItem value="Europe/Moscow">Europe/Moscow (UTC+3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Пеня (% в день)</Label>
                <Input className="mt-1.5" type="number" step="0.01" value={general.lateFeePercent}
                  onChange={e => setGeneral(f => ({ ...f, lateFeePercent: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">Льготный период (дн.)</Label>
                <Input className="mt-1.5" type="number" value={general.lateFeeGraceDays}
                  onChange={e => setGeneral(f => ({ ...f, lateFeeGraceDays: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">НДС (%)</Label>
                <Input className="mt-1.5" type="number" value={general.vatPercent}
                  onChange={e => setGeneral(f => ({ ...f, vatPercent: e.target.value }))} />
              </div>
            </div>
          </>
        )}

        {tab === "billing" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">День начисления</Label>
                <Input className="mt-1.5" type="number" min="1" max="31" value={billing.accrualDay}
                  onChange={e => setBilling(f => ({ ...f, accrualDay: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">День месяца для авто-начислений</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Срок оплаты (дней)</Label>
                <Input className="mt-1.5" type="number" min="1" value={billing.dueDays}
                  onChange={e => setBilling(f => ({ ...f, dueDays: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">После даты начисления</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Авто-начисление</Label>
                <Select value={billing.autoAccrual} onValueChange={v => setBilling(f => ({ ...f, autoAccrual: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Включено</SelectItem>
                    <SelectItem value="false">Выключено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Округление суммы</Label>
                <Select value={billing.roundUp} onValueChange={v => setBilling(f => ({ ...f, roundUp: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Вверх до целого</SelectItem>
                    <SelectItem value="false">Без округления</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {tab === "notifications" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Напомнить за (дней до срока)</Label>
                <Input className="mt-1.5" type="number" value={notif.upcomingReminder}
                  onChange={e => setNotif(f => ({ ...f, upcomingReminder: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">Уведомить о долге (дней после)</Label>
                <Input className="mt-1.5" type="number" value={notif.overdueReminder}
                  onChange={e => setNotif(f => ({ ...f, overdueReminder: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Канал уведомлений</Label>
              <Select value={notif.channel} onValueChange={v => setNotif(f => ({ ...f, channel: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">СМС</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="all">Все каналы</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {tab === "documents" && (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Шаблоны документов — в разработке</p>
          </div>
        )}

        <div className="pt-2">
          <Button onClick={save} className="gap-2">
            <Save className="w-4 h-4" /> Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  );
}
