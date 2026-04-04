import { useState } from "react";
import { useListCounterparties } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Counterparties() {
  const { data: counterparties, isLoading } = useListCounterparties({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Counterparties</h2>
          <p className="text-muted-foreground mt-2">Manage individuals and legal entities.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Counterparty
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                </TableRow>
              ))
            ) : counterparties?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No counterparties found.
                </TableCell>
              </TableRow>
            ) : (
              counterparties?.map((cp) => (
                <TableRow key={cp.id}>
                  <TableCell className="font-medium">{cp.fullName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{cp.type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>{cp.phone || "-"}</TableCell>
                  <TableCell>{cp.email || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
