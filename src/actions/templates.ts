"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/system/admin";
import { logActivity } from "@/lib/system/logger";
import {
  successResponse,
  errorResponse,
  handleSupabaseError,
} from "@/lib/system/responses";
import {
  templateSchema,
  updateTemplateSchema,
  renderTemplateSchema,
  type TemplateInput,
  type UpdateTemplateInput,
  type RenderTemplateInput,
  type TemplateType,
  TEMPLATE_TYPE_VARIABLES,
  DEFAULT_TEMPLATE_VARIABLES,
} from "@/schemas/template";

export interface MessageTemplate {
  id: string;
  name: string;
  type: TemplateType;
  subject: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all templates with optional filter by type
 */
export async function getTemplates(type?: TemplateType) {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("message_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    return handleSupabaseError(error);
  }

  return successResponse(data || []);
}

/**
 * Get active templates only
 */
export async function getActiveTemplates(type?: TemplateType) {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("message_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    return handleSupabaseError(error);
  }

  return successResponse(data || []);
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return handleSupabaseError(error);
  }

  return successResponse(data);
}

/**
 * Get template by type (for default templates)
 */
export async function getTemplateByType(type: TemplateType) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("type", type)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return handleSupabaseError(error);
  }

  return successResponse(data);
}

/**
 * Create a new template
 */
export async function createTemplate(formData: TemplateInput) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Validate input
  const result = templateSchema.safeParse(formData);
  if (!result.success) {
    const issues = result.error.errors.map((e) => e.message);
    return errorResponse("Datos de plantilla inválidos", issues);
  }

  const { data, error } = await supabase
    .from("message_templates")
    .insert({
      name: formData.name,
      type: formData.type,
      subject: formData.subject,
      content: formData.content,
      variables: formData.variables,
      is_active: formData.is_active,
    })
    .select()
    .single();

  if (error) {
    return handleSupabaseError(error);
  }

  // Log activity
  await logActivity({
    user_id: admin.id,
    action: "created",
    entity_type: "template",
    entity_id: data.id,
    description: `Plantilla creada: ${formData.name}`,
    metadata: { type: formData.type, name: formData.name },
  });

  revalidatePath("/admin/templates");
  return successResponse(data, "Plantilla creada exitosamente");
}

/**
 * Update a template
 */
export async function updateTemplate(formData: UpdateTemplateInput) {

 const admin = await requireAdmin();
  const supabase = await createClient();

  // Validate input
  const result = updateTemplateSchema.safeParse(formData);
  if (!result.success) {
    const issues = result.error.errors.map((e) => e.message);
    return errorResponse("Datos de actualización inválidos", issues);
  }

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (formData.name !== undefined) updateData.name = formData.name;
  if (formData.subject !== undefined) updateData.subject = formData.subject;
  if (formData.content !== undefined) updateData.content = formData.content;
  if (formData.variables !== undefined) updateData.variables = formData.variables;
  if (formData.is_active !== undefined) updateData.is_active = formData.is_active;

  const { data, error } = await supabase
    .from("message_templates")
    .update(updateData)
    .eq("id", formData.id)
    .select()
    .single();

  if (error) {
    return handleSupabaseError(error);
  }

  // Log activity
  await logActivity({
    user_id: admin.id,
    action: "updated",
    entity_type: "template",
    entity_id: data.id,
    description: "Plantilla actualizada",
    metadata: { name: formData.name },
  });

  revalidatePath("/admin/templates");
  return successResponse(data, "Plantilla actualizada exitosamente");
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("message_templates")
    .delete()
    .eq("id", id);

  if (error) {
    return handleSupabaseError(error);
  }

  // Log activity
  await logActivity({
    user_id: admin.id,
    action: "deleted",
    entity_type: "template",
    entity_id: id,
    description: "Plantilla eliminada",
  });

  revalidatePath("/admin/templates");
  return successResponse(null, "Plantilla eliminada exitosamente");
}

/**
 * Render a template with variables
 */
export async function renderTemplate(formData: RenderTemplateInput) {
  await requireAdmin();
  const supabase = await createClient();

  // Validate input
  const result = renderTemplateSchema.safeParse(formData);
  if (!result.success) {
    const issues = result.error.errors.map((e) => e.message);
    return errorResponse("Datos de renderizado inválidos", issues);
  }

  // Get the template
  const { data: template, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("id", formData.template_id)
    .single();

  if (error) {
    return handleSupabaseError(error);
  }

  // Replace variables in subject and content
  let renderedSubject = template.subject;
  let renderedContent = template.content;

  for (const [key, value] of Object.entries(formData.variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    renderedSubject = renderedSubject.replace(regex, value);
    renderedContent = renderedContent.replace(regex, value);
  }

  return successResponse({
    subject: renderedSubject,
    content: renderedContent,
    originalTemplate: template,
  });
}

/**
 * Get available variables for a template type
 */
export async function getTemplateVariables(type: TemplateType) {
  await requireAdmin();

  const variables = [
    ...DEFAULT_TEMPLATE_VARIABLES,
    ...(TEMPLATE_TYPE_VARIABLES[type] || []),
  ];

  return successResponse(variables);
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(id: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Get the original template
  const { data: template, error: fetchError } = await supabase
    .from("message_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    return handleSupabaseError(fetchError);
  }

  // Create a copy
  const { data, error } = await supabase
    .from("message_templates")
    .insert({
      name: `${template.name} (Copia)`,
      type: template.type,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      is_active: false, // Inactive by default
    })
    .select()
    .single();

  if (error) {
    return handleSupabaseError(error);
  }

  // Log activity
  await logActivity({
    user_id: admin.id,
    action: "created",
    entity_type: "template",
    entity_id: data.id,
    description: `Plantilla duplicada: ${template.name}`,
    metadata: { original_id: id },
  });

  revalidatePath("/admin/templates");
  return successResponse(data, "Plantilla duplicada exitosamente");
}

/**
 * Seed default templates
 */
export async function seedDefaultTemplates() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const defaultTemplates: TemplateInput[] = [
    {
      name: "Pago Recibido",
      type: "payment_received",
      subject: "¡Gracias por tu pago, {{member_name}}!",
      content: `Hola {{member_name}},

Hemos recibido tu pago de {{payment_amount}} correctamente.

Detalles del pago:
- Monto: {{payment_amount}}
- Fecha: {{payment_date}}
- Método: {{payment_method}}
- Membresía: {{plan_name}}

¡Gracias por ser parte de KingClub!

Saludos,
El equipo de KingClub`,
      variables: ["member_name", "payment_amount", "payment_date", "payment_method", "plan_name"],
      is_active: true,
    },
    {
      name: "Pago Fallido",
      type: "payment_failed",
      subject: "Acción requerida: Problema con tu pago",
      content: `Hola {{member_name}},

Tuvimos un problema al procesar tu pago de {{payment_amount}}.

Razón: {{failure_reason}}

Por favor, actualiza tu método de pago para continuar disfrutando de tu membresía:
{{retry_link}}

Si necesitas ayuda, contáctanos.

Saludos,
El equipo de KingClub`,
      variables: ["member_name", "payment_amount", "failure_reason", "retry_link"],
      is_active: true,
    },
    {
      name: "Envío Enviado",
      type: "shipment_shipped",
      subject: "¡Tu kit está en camino!",
      content: `Hola {{member_name}},

Tu kit {{kit_name}} ha sido enviado.

Número de seguimiento: {{tracking_number}}
Transportista: {{carrier}}

Puedes rastrear tu envío aquí:
{{tracking_link}}

¡Esperamos que lo disfrutes!

Saludos,
El equipo de KingClub`,
      variables: ["member_name", "kit_name", "tracking_number", "carrier", "tracking_link"],
      is_active: true,
    },
    {
      name: "Envío Entregado",
      type: "shipment_delivered",
      subject: "¡Tu kit ha sido entregado!",
      content: `Hola {{member_name}},

Tu kit {{kit_name}} ha sido entregado el {{delivered_date}}.

Número de seguimiento: {{tracking_number}}

Esperamos que disfrutes de tus productos. ¡Gracias por ser parte de KingClub!

Saludos,
El equipo de KingClub`,
      variables: ["member_name", "kit_name", "delivered_date", "tracking_number"],
      is_active: true,
    },
  ];

  const results = [];

  for (const template of defaultTemplates) {
    // Check if template already exists
    const { data: existing } = await supabase
      .from("message_templates")
      .select("id")
      .eq("type", template.type)
      .limit(1);

    if (existing && existing.length > 0) {
      continue; // Skip if already exists
    }

    const { data, error } = await supabase
      .from("message_templates")
      .insert(template)
      .select()
      .single();

    if (!error) {
      results.push(data);
    }
  }

  // Log activity
  await logActivity({
    user_id: admin.id,
    action: "created",
    entity_type: "system",
    description: `Plantillas por defecto creadas: ${results.length}`,
    metadata: { count: results.length },
  });

  revalidatePath("/admin/templates");
  return successResponse(
    results,
    `${results.length} plantillas creadas exitosamente`
  );
}
