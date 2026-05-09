import { useListRentalProperties } from "@/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  free: "bg-emerald-100 text-emerald-800",
  rented: "bg-blue-100 text-blue-800",
  overdue: "bg-rose-100 text-rose-800",
  archived: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  free: "Свободен",
  rented: "Сдан",
  overdue: "Просрочен",
  archived: "Архив",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-KZ", { style: "currency", currency }).format(amount);
}

export default function RentalProperties() {
  const { data: properties, isLoading } = useListRentalProperties();
  const propertiesArray = Array.isArray(properties) ? properties : [];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Объекты аренды</h1>
        <p className="text-muted-foreground text-sm">Обзор всех объектов с арендной информацией</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Проект</TableHead>
              <TableHead>Номер</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Площадь, м²</TableHead>
              <TableHead>Арендатор</TableHead>
              <TableHead>Аренда</TableHead>
              <TableHead>Статус</TableHead>
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
            ) : !propertiesArray.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Объекты не найдены
                </TableCell>
              </TableRow>
            ) : (
              propertiesArray.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.projectName}</TableCell>
                  <TableCell>{p.unitNumber}</TableCell>
                  <TableCell>{p.type === "apartment" ? "Квартира" : p.type === "office" ? "Офис" : p.type}</TableCell>
                  <TableCell>{p.area ? `${p.area} м²` : "—"}</TableCell>
                  <TableCell>{p.currentTenantName || "—"}</TableCell>
                  <TableCell>
                    {p.currentRentAmount
                      ? formatCurrency(p.currentRentAmount, p.currency || "KZT")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[p.rentalStatus] || ""} variant="secondary">
                      {statusLabels[p.rentalStatus] || p.rentalStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

