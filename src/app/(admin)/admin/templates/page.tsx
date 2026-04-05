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
  MessageSquare,
  Plus,
  Search,
  Copy,
  Eye,
  Edit,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  seedDefaultTemplates,
  renderTemplate,
  type MessageTemplate,
} from "@/actions/templates";
import {
  templateTypeEnum,
  type TemplateInput,
  type TemplateType,
  TEMPLATE_TYPE_VARIABLES,
  DEFAULT_TEMPLATE_VARIABLES,
} from "@/schemas/template";

const typeLabels: Record<TemplateType, string> = {
  payment_received: "Pago Recibido",
  payment_failed: "Pago Fallido",
  shipment_shipped: "Envío Enviado",
  shipment_delivered: "Envío Entregado",
  welcome: "Bienvenida",
  cancellation: "Cancelación",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TemplateType | "">("");
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [renderedPreview, setRenderedPreview] = useState<{
    subject: string;
    content: string;
  } | null>(null);
  const [formData, setFormData] = useState<Partial<TemplateInput>>({
    name: "",
    type: "payment_received",
    subject: "",
    content: "",
    variables: [],
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, [filter]);

  async function loadTemplates() {
    setLoading(true);
    const result = await getTemplates(filter || undefined);
    if (result.success) {
      setTemplates(result.data || []);
    }
    setLoading(false);
  }

  async function handleSeedDefaults() {
    if (!confirm("¿Crear plantillas por defecto?")) return;
    const result = await seedDefaultTemplates();
    if (result.success) {
      loadTemplates();
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.content) return;
    const result = await createTemplate({ name: formData.name, type: (formData.type as TemplateType) || "payment_received", subject: formData.subject, content: formData.content, variables: formData.variables || [], is_active: formData.is_active ?? true });
    if (result.success) { setIsCreateDialogOpen(false); resetForm(); loadTemplates(); }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return;
    const result = await updateTemplate({ id: selectedTemplate.id, name: formData.name, subject: formData.subject, content: formData.content, variables: formData.variables, is_active: formData.is_active });
    if (result.success) { setIsEditDialogOpen(false); setSelectedTemplate(null); loadTemplates(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta plantilla?")) return;
    const result = await deleteTemplate(id);
    if (result.success) { loadTemplates(); }
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateTemplate(id);
    if (result.success) { loadTemplates(); }
  }

  async function handlePreview(template: MessageTemplate) {
    setSelectedTemplate(template);
    const initialData: Record<string, string> = {};
    const allVariables = [...DEFAULT_TEMPLATE_VARIABLES.map((v) => v.key.replace(/[{}]/g, "")), ...(TEMPLATE_TYPE_VARIABLES[template.type] || []).map((v) => v.key.replace(/[{}]/g, ""))];
    allVariables.forEach((v) => { initialData[v] = previewData[v] || ""; });
    setPreviewData(initialData);
    setIsPreviewDialogOpen(true);
  }

  async function renderPreview() {
    if (!selectedTemplate) return;
    const result = await renderTemplate({ template_id: selectedTemplate.id, variables: previewData });
    if (result.success && result.data) { setRenderedPreview(result.data); }
  }

  function openEditDialog(template: MessageTemplate) {
    setSelectedTemplate(template);
    setFormData({ name: template.name, type: template.type, subject: template.subject, content: template.content, variables: template.variables, is_active: template.is_active });
    setIsEditDialogOpen(true);
  }

  function resetForm() {
    setFormData({ name: "", type: "payment_received", subject: "", content: "", variables: [], is_active: true });
  }

  const filteredTemplates = templates.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plantillas de Mensajes</h2>
          <p className="text-muted-foreground">Gestiona las plantillas de comunicación con los miembros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDefaults}><Wand2 className="h-4 w-4 mr-2" />Plantillas por Defecto</Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nueva Plantilla</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Crear Nueva Plantilla</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="name">Nombre *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Pago Recibido" required /></div>
                <div className="space-y-2"><Label htmlFor="type">Tipo</Label><Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as TemplateType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{templateTypeEnum.options.map((type) => <SelectItem key={type} value={type}>{typeLabels[type]}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="subject">Asunto *</Label><Input id="subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Asunto del mensaje" required /></div>
                <div className="space-y-2"><Label htmlFor="content">Contenido *</Label><Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Contenido..." required rows={10} /></div>
                <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Crear Plantilla</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? <div>Cargando...</div> : filteredTemplates.length === 0 ? <div>No hay plantillas</div> : (filteredTemplates.map((t) => (
          <Card key={t.id}>
            <CardHeader><CardTitle>{t.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm">{t.subject}</p>
              <Button variant="ghost" size="sm" onClick={() => handlePreview(t)}><Eye className="h-4 w-4 mr-1" />Vista Previa</Button>
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(t)}><Edit className="h-4 w-4 mr-1" />Editar</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        )))}
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Plantilla</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={10} />
            <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
