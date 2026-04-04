import { useState, useEffect } from "react";
import {
  useListCounterparties,
  useCreateCounterparty,
  useUpdateCounterparty,
  useDeleteCounterparty,
  Counterparty,
  getListCounterpartiesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CounterpartyType = "individual" | "company";

const typeLabels: Record<string, string> = {
  individual: "Физическое лицо",
  company: "Юридическое лицо",
};

const typeColors: Record<string, string> = {
  individual: "bg-blue-100 text-blue-800",
  company: "bg-purple-100 text-purple-800",
};

interface CounterpartyDialogProps {
  open: boolean;
  onClose: () => void;
  counterparty?: Counterparty;
}

function CounterpartyDialog({ open, onClose, counterparty }: CounterpartyDialogProps) {
  const createMutation = useCreateCounterparty();
  const updateMutation = useUpdateCounterparty();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    type: "individual" as CounterpartyType,
    iin: "",
    phone: "",
    email: "",
    additionalContact: "",
    comment: "",
  });

  useEffect(() => {
    if (counterparty && open) {
      setFormData({
        fullName: counterparty.fullName,
        type: (counterparty.type || "individual") as CounterpartyType,
        iin: counterparty.iin || "",
        phone: counterparty.phone || "",
        email: counterparty.email || "",
        additionalContact: counterparty.additionalContact || "",
        comment: counterparty.comment || "",
      });
    } else if (!counterparty && open) {
      setFormData({
        fullName: "",
        type: "individual",
        iin: "",
        phone: "",
        email: "",
        additionalContact: "",
        comment: "",
      });
    }
  }, [counterparty, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: formData.fullName,
        type: formData.type,
        iin: formData.iin || null,
        phone: formData.phone || null,
        email: formData.email || null,
        additionalContact: formData.additionalContact || null,
        comment: formData.comment || null,
      };

      if (counterparty) {
        await updateMutation.mutateAsync({ id: counterparty.id, data: payload });
        toast({ title: "Контрагент обновлён" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Контрагент добавлен" });
      }

      queryClient.invalidateQueries({ queryKey: getListCounterpartiesQueryKey() });
      onClose();
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err?.response?.data?.error || "Не удалось сохранить контрагента",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{counterparty ? "Редактировать контрагента" : "Добавить контрагента"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Тип *</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v as CounterpartyType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Физическое лицо</SelectItem>
                <SelectItem value="company">Юридическое лицо</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fullName">
              {formData.type === "company" ? "Наименование организации *" : "ФИО *"}
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder={formData.type === "company" ? 'ОсОО "Название компании"' : "Иванов Иван Иванович"}
              required
            />
          </div>

          <div>
            <Label htmlFor="iin">
              {formData.type === "company" ? "ИНН (ОГРН)" : "ИНН (ИИН)"}
            </Label>
            <Input
              id="iin"
              value={formData.iin}
              onChange={(e) => setFormData({ ...formData, iin: e.target.value })}
              placeholder={formData.type === "company" ? "12345678901" : "12345678901234"}
            />
          </div>

          <div>
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+996 700 000 000"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@mail.kg"
            />
          </div>

          <div>
            <Label htmlFor="additionalContact">Доп. контакт</Label>
            <Input
              id="additionalContact"
              value={formData.additionalContact}
              onChange={(e) => setFormData({ ...formData, additionalContact: e.target.value })}
              placeholder="WhatsApp, Telegram и т.д."
            />
          </div>

          <div>
            <Label htmlFor="comment">Комментарий</Label>
            <Input
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Counterparties() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data: counterparties, isLoading } = useListCounterparties({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });
  const deleteMutation = useDeleteCounterparty();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCP, setSelectedCP] = useState<Counterparty | undefined>();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleAdd = () => {
    setSelectedCP(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (cp: Counterparty) => {
    setSelectedCP(cp);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: "Контрагент удалён" });
      queryClient.invalidateQueries({ queryKey: getListCounterpartiesQueryKey() });
    } catch {
      toast({ title: "Ошибка", description: "Не удалось удалить контрагента", variant: "destructive" });
    }
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Контрагенты</h1>
          <p className="text-muted-foreground text-sm">Покупатели, арендаторы и юридические лица</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Все типы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="individual">Физические лица</SelectItem>
            <SelectItem value="company">Юридические лица</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ФИО / Наименование</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>ИНН</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !counterparties?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Контрагенты не найдены
                </TableCell>
              </TableRow>
            ) : (
              counterparties.map((cp) => (
                <TableRow key={cp.id}>
                  <TableCell className="font-medium">{cp.fullName}</TableCell>
                  <TableCell>
                    <Badge className={typeColors[cp.type] || ""} variant="secondary">
                      {typeLabels[cp.type] || cp.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{cp.iin || "—"}</TableCell>
                  <TableCell>{cp.phone || "—"}</TableCell>
                  <TableCell>{cp.email || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cp)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setDeleteId(cp.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CounterpartyDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        counterparty={selectedCP}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить контрагента?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Контрагент будет удалён из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
