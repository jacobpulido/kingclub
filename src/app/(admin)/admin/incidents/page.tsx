"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentStats,
  type Incident,
} from "@/actions/incidents";
import {
  incidentTypeEnum,
  incidentStatusEnum,
  type IncidentInput,
  type IncidentType,
  type IncidentStatus,
} from "@/schemas/incident";

const typeLabels: Record<IncidentType, string> = {
  shipping: "Envío",
  payment: "Pago",
  membership: "Membresía",
  kit: "Kit",
  other: "Otro",
};

const statusLabels: Record<IncidentStatus, string> = {
  open: "Abierta",
  in_progress: "En Progreso",
  resolved: "Resuelta",
};

const statusVariants: Record<IncidentStatus, "default" | "secondary" | "success" | "destructive" | "warning" | "info"> = {
  open: "destructive",
  in_progress: "warning",
  resolved: "success",
};

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "" as IncidentStatus | "",
    type: "" as IncidentType | "",
    search: "",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [formData, setFormData] = useState<Partial<IncidentInput>>({
    membership_id: "",
    type: "other",
    status: "open",
    description: "",
    shipment_id: null,
    resolution_notes: "",
  });

  useEffect(() => {
    loadIncidents();
    loadStats();
  }, [filters]);

  async function loadIncidents() {
    setLoading(true);
    const result = await getIncidents({
      status: filters.status || undefined,
      type: filters.type || undefined,
      search: filters.search || undefined,
    });
    if (result.success) {
      setIncidents(result.data || []);
    }
    setLoading(false);
  }

  async function loadStats() {
    const result = await getIncidentStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.membership_id || !formData.description) return;

    const result = await createIncident({
      membership_id: formData.membership_id,
      type: (formData.type as IncidentType) || "other",
      status: "open",
      description: formData.description,
      shipment_id: formData.shipment_id || null,
      resolution_notes: null,
    });

    if (result.success) {
      setIsCreateDialogOpen(false);
      setFormData({
        membership_id: "",
        type: "other",
        status: "open",
        description: "",
        shipment_id: null,
        resolution_notes: "",
      });
      loadIncidents();
      loadStats();
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIncident) return;

    const result = await updateIncident({
      id: selectedIncident.id,
      status: formData.status as IncidentStatus,
      description: formData.description,
      resolution_notes: formData.resolution_notes,
    });

    if (result.success) {
      setIsEditDialogOpen(false);
      setSelectedIncident(null);
      loadIncidents();
      loadStats();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta incidencia?")) return;

    const result = await deleteIncident(id);
    if (result.success) {
      loadIncidents();
      loadStats();
    }
  }

  function openEditDialog(incident: Incident) {
    setSelectedIncident(incident);
    setFormData({
      membership_id: incident.membership_id,
      type: incident.type,
      status: incident.status,
      description: incident.description,
      shipment_id: incident.shipment_id,
      resolution_notes: incident.resolution_notes,
    });
    setIsEditDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Incidencias</h2>
          <p className="text-muted-foreground">
            Gestiona las incidencias del sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nueva Incidencia</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="membership_id">ID de Membresía *</Label>
                <Input
                  id="membership_id"
                  value={formData.membership_id}
                  onChange={(e) =>
                    setFormData({ ...formData, membership_id: e.target.value })
                  }
                  placeholder="uuid de la membresía"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as IncidentType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypeEnum.options.map((type) => (
                      <SelectItem key={type} value={type}>
                        {typeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe la incidencia..."
                  required
                  rows={4}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Crear Incidencia</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">
                Abiertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.open}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">
                En Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.in_progress}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                Resueltas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.resolved}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar incidencias..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value as IncidentStatus })
              }
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {incidentStatusEnum.options.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.type}
              onValueChange={(value) =>
                setFilters({ ...filters, type: value as IncidentType })
              }
            >
              <SelectTrigger className="w-[180px]">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {incidentTypeEnum.options.map((type) => (
                  <SelectItem key={type} value={type}>
                    {typeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Incidencias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay incidencias registradas
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={statusVariants[incident.status]}>
                        {statusLabels[incident.status]}
                      </Badge>
                      <Badge variant="outline">{typeLabels[incident.type]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(incident.created_at).toLocaleString("es-MX")}
                      </span>
                    </div>
                    <p className="text-sm">{incident.description}</p>
                    {incident.member_name && (
                      <p className="text-xs text-muted-foreground">
                        Miembro: {incident.member_name} ({incident.member_email})
                      </p>
                    )}
                    {incident.resolution_notes && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                        <span className="font-medium">Resolución:</span>{" "}
                        {incident.resolution_notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(incident)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(incident.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Incidencia</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as IncidentStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {incidentStatusEnum.options.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-resolution">Notas de Resolución</Label>
              <Textarea
                id="edit-resolution"
                value={formData.resolution_notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, resolution_notes: e.target.value })
                }
                placeholder="Notas sobre cómo se resolvió la incidencia..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
