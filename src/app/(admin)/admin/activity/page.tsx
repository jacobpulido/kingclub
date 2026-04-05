"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
} from "lucide-react";
import { getActivities, searchActivities, type ActivityFilter } from "@/actions/activity";
import type { ActivityLog, EntityType, LogAction } from "@/lib/system/logger";

const entityLabels: Record<EntityType, string> = {
  profile: "Perfil",
  membership: "Membresía",
  payment: "Pago",
  kit: "Kit",
  shipment: "Envío",
  incident: "Incidencia",
  template: "Plantilla",
  address: "Dirección",
  system: "Sistema",
};

const actionLabels: Record<LogAction, string> = {
  created: "Creado",
  updated: "Actualizado",
  deleted: "Eliminado",
  viewed: "Visto",
  status_changed: "Estado Cambiado",
  login: "Inicio de Sesión",
  logout: "Cierre de Sesión",
  password_reset: "Reset de Contraseña",
  email_sent: "Email Enviado",
  payment_processed: "Pago Procesado",
  shipment_updated: "Envío Actualizado",
  incident_resolved: "Incidencia Resuelta",
  template_rendered: "Plantilla Renderizada",
  report_generated: "Reporte Generado",
  other: "Otro",
};

const actionVariants: Record<LogAction, "default" | "secondary" | "success" | "destructive" | "warning" | "info"> = {
  created: "success",
  updated: "info",
  deleted: "destructive",
  viewed: "secondary",
  status_changed: "warning",
  login: "success",
  logout: "secondary",
  password_reset: "warning",
  email_sent: "info",
  payment_processed: "success",
  shipment_updated: "info",
  incident_resolved: "success",
  template_rendered: "secondary",
  report_generated: "info",
  other: "secondary",
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ActivityFilter>({
    entity_type: undefined,
    action: undefined,
    user_id: undefined,
    date_from: undefined,
    date_to: undefined,
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadActivities();
  }, [filters, page]);

  async function loadActivities() {
    setLoading(true);
    const result = await getActivities({
      ...filters,
      page,
      limit: 20,
    });

    if (result.success && result.data) {
      setActivities(result.data);
      if ('pagination' in result && result.pagination) {
        setTotalPages(result.pagination.totalPages);
      }
    }
    setLoading(false);
  }

  async function handleSearch() {
    if (!searchTerm.trim()) {
      loadActivities();
      return;
    }

    setLoading(true);
    const result = await searchActivities(searchTerm, page, 20);

    if (result.success && result.data) {
      setActivities(result.data);
      if ('pagination' in result && result.pagination) {
        setTotalPages(result.pagination.totalPages);
      }
    }
    setLoading(false);
  }

  function clearFilters() {
    setFilters({
      entity_type: undefined,
      action: undefined,
      user_id: undefined,
      date_from: undefined,
      date_to: undefined,
      page: 1,
      limit: 20,
    });
    setSearchTerm("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Registro de Actividad
        </h2>
        <p className="text-muted-foreground">
          Visualiza el historial de actividades del sistema
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en actividades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-8"
                  />
                </div>
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Buscar
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Limpiar
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Select
                value={filters.entity_type || ""}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    entity_type: (value as EntityType) || undefined,
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Entidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</selectItem>
                  {Object.entries(entityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.action || ""}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    action: (value as LogAction) || undefined,
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {Object.entries(actionLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="Desde"
                value={filters.date_from?.split("T")[0] || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    date_from: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
                className="w-[150px]"
              />
              <Input
                type="date"
                placeholder="Hasta"
                value={filters.date_to?.split("T")[0] || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    date_to: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
                className="w-[150px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Actividades</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay actividades registradas
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={actionVariants[activity.action]}>
                          {actionLabels[activity.action]}
                        </Badge>
                        <Badge variant="outline">
                          {entityLabels[activity.entity_type]}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(activity.created_at).toLocaleString("es-MX")}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {activity.user_email && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.user_full_name || activity.user_email}
                          </span>
                        )}
                        {activity.entity_id && (
                          <span>ID: {activity.entity_id.slice(0, 8)}...</span>
                        )}
                      </div>
                      {activity.metadata &&
                        Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <details>
                              <summary className="cursor-pointer text-muted-foreground">
                                Ver detalles
                              </summary>
                              <pre className="mt-2 overflow-auto">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
