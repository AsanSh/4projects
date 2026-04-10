import { ReactNode } from "react";
import { Construction, Hammer, Package, Building2, Home } from "lucide-react";

interface PlaceholderProps {
  module: string;
  page: string;
  icon?: ReactNode;
  description?: string;
}

export function Placeholder({ module, page, icon, description }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        {icon || <Construction className="w-8 h-8 text-gray-400" />}
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">{page}</h2>
      <p className="text-sm text-gray-400 mb-2">Модуль: {module}</p>
      <p className="text-sm text-gray-400 max-w-sm">
        {description || "Раздел находится в разработке. Скоро будет доступен."}
      </p>
      <div className="mt-6 px-4 py-2 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
        В разработке
      </div>
    </div>
  );
}

export const ConstructionDashboard = () => <Placeholder module="Контроль строительства" page="Дашборд строительства" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionProjects = () => <Placeholder module="Контроль строительства" page="Проекты" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionStages = () => <Placeholder module="Контроль строительства" page="Этапы работ" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionTasks = () => <Placeholder module="Контроль строительства" page="Задачи" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionWorkers = () => <Placeholder module="Контроль строительства" page="Бригады / рабочие" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionContractors = () => <Placeholder module="Контроль строительства" page="Подрядчики" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionMaterials = () => <Placeholder module="Контроль строительства" page="Материалы" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionBudget = () => <Placeholder module="Контроль строительства" page="Бюджет" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionExpenses = () => <Placeholder module="Контроль строительства" page="Расходы" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionReports = () => <Placeholder module="Контроль строительства" page="Отчёты" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionCounterparties = () => <Placeholder module="Контроль строительства" page="Контрагенты" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;
export const ConstructionEmployees = () => <Placeholder module="Контроль строительства" page="Сотрудники" icon={<Hammer className="w-8 h-8 text-orange-400" />} />;

export const ProptechDashboard = () => <Placeholder module="ПропТех" page="Дашборд продаж" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;
export const SalesProperties = () => <Placeholder module="ПропТех" page="Объекты на продажу" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;
export const SalesContracts = () => <Placeholder module="ПропТех" page="Договоры продажи" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;
export const CrmLeads = () => <Placeholder module="ПропТех" page="Лиды" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;
export const CrmPipeline = () => <Placeholder module="ПропТех" page="Воронка продаж" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;
export const CrmClients = () => <Placeholder module="ПропТех" page="Клиенты" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;
export const ProptechPayments = () => <Placeholder module="ПропТех" page="Платежи" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;
export const ProptechReports = () => <Placeholder module="ПропТех" page="Отчёты" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;
export const ProptechCounterparties = () => <Placeholder module="ПропТех" page="Контрагенты" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;
export const ProptechEmployees = () => <Placeholder module="ПропТех" page="Сотрудники" icon={<Building2 className="w-8 h-8 text-violet-400" />} />;

export const WarehouseDashboard = () => <Placeholder module="Центральный склад" page="Дашборд склада" icon={<Package className="w-8 h-8 text-emerald-400" />} />;
export const WarehouseItems = () => <Placeholder module="Центральный склад" page="Товары / материалы" icon={<Package className="w-8 h-8 text-emerald-400" />} />;
export const WarehouseIncoming = () => <Placeholder module="Центральный склад" page="Поступления" icon={<Package className="w-8 h-8 text-emerald-400" />} />;
export const WarehouseOutgoing = () => <Placeholder module="Центральный склад" page="Списания / выдача" icon={<Package className="w-8 h-8 text-emerald-400" />} />;
export const WarehouseInventory = () => <Placeholder module="Центральный склад" page="Инвентаризация" icon={<Package className="w-8 h-8 text-emerald-400" />} />;
export const WarehouseCosts = () => <Placeholder module="Центральный склад" page="Стоимость запасов" icon={<Package className="w-8 h-8 text-emerald-400" />} />;
export const WarehouseReports = () => <Placeholder module="Центральный склад" page="Отчёты склада" icon={<Package className="w-8 h-8 text-emerald-400" />} />;
export const WarehouseSuppliers = () => <Placeholder module="Центральный склад" page="Поставщики" icon={<Package className="w-8 h-8 text-emerald-400" />} />;
export const WarehouseEmployees = () => <Placeholder module="Центральный склад" page="Сотрудники" icon={<Package className="w-8 h-8 text-emerald-400" />} />;

export const RentalCounterparties = () => <Placeholder module="Аренда" page="Контрагенты аренды" icon={<Home className="w-8 h-8 text-blue-400" />} />;
export const RentalEmployees = () => <Placeholder module="Аренда" page="Сотрудники аренды" icon={<Home className="w-8 h-8 text-blue-400" />} />;
