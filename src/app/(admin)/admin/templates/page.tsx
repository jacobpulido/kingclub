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

    const result = await createTemplate({
      name: formData.name,
      type: (formData.type as TemplateType) || "payment_received",
      subject: formData.subject,
      content: formData.content,
      variables: formData.variables || [],
      is_active: formData.is_active ?? true,
    });

    if (result.success) {
      setIsCreateDialogOpen(false);
      resetForm();
      loadTemplates();
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return;

    const result = await updateTemplate({
      id: selectedTemplate.id,
      name: formData.name,
      subject: formData.subject,
      content: formData.content,
      variables: formData.variables,
      is_active: formData.is_active,
    });

    if (result.success) {
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      loadTemplates();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta plantilla?")) return;

    const result = await deleteTemplate(id);
    if (result.success) {
      loadTemplates();
    }
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateTemplate(id);
    if (result.success) {
      loadTemplates();
    }
  }

  async function handlePreview(template: MessageTemplate) {
    setSelectedTemplate(template);
    const initialData: Record<string, string> = {};
    const allVariables = [
      ...DEFAULT_TEMPLATE_VARIABLES.map((v) => v.key.replace(/[{}]/g, "")),
      ...(TEMPLATE_TYPE_VARIABLES[template.type] || []).map((v) => v.key.replace(/[{}]/g, "")),
    ];
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

  return (<div className="space-y-6"><h2>Plantillas</h2></div>);
}
