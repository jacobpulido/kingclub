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
  incidentSchema,
  updateIncidentSchema,
  incidentFilterSchema,
  type IncidentInput,
  type UpdateIncidentInput,
  type IncidentFilterInput,
  type IncidentType,
  type IncidentStatus,
} from "@/schemas/incident";

export interface Incident {
  id: string;
  membership_id: string;
  shipment_id: string | null;
  type: IncidentType;
  status: IncidentStatus;
  description: string;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  // Joined fields
  member_name?: string;
  member_email?: string;
  plan_name?: string;
}

/**
 * Get all incidents with optional filters
 */
export async function getIncidents(
  filters: IncidentFilterInput = {}
) {
  await requireAdmin();
  const supabase = await createClient();

  // Validate filters
  const filterResult = incidentFilterSchema.safeParse(filters);
  if (!filterResult.success) {
    return errorResponse("Filtros inválidos");
  }

  let query = supabase
    .from("incidents")
    .select(
      `
      *,
      memberships!inner(
        profile_id,
        profiles!inner(full_name, email),
        plans!inner(name)
      )
    `
    );

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.membership_id) {
    query = query.eq("membership_id", filters.membership_id);
  }

  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  if (filters.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,resolution_notes.ilike.%${filters.search}%`
    );
  }

  // Order by created_at desc
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    return handleSupabaseError(error);
  }

  // Transform data to include joined fields
  const incidents: Incident[] = (data || []).map((incident) => ({
    ...incident,
    member_name: incident.memberships?.profiles?.full_name,
    member_email: incident.memberships?.profiles?.email,
    plan_name: incident.memberships?.plans?.name,
  }));

  return successResponse(incidents);
}

/**
 * Get a single incident by ID
 */
export async function getIncident(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select(
      `
      *,
      memberships!inner(
        profile_id,
        profiles!inner(full_name, email),
        plans!inner(name)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return handleSupabaseError(error);
  }

  const incident: Incident = {
    ...data,
    member_name: data.memberships?.profiles?.full_name,
    member_email: data.memberships?.profiles?.email,
    plan_name: data.memberships?.plans?.name,
  };

  return successResponse(incident);
}

/**
 * Create a new incident
 */
export async function createIncident(formData: IncidentInput) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Validate input
  const result = incidentSchema.safeParse(formData);
  if (!result.success) {
    const issues = result.error.errors.map((e) => e.message);
    return errorResponse("Datos de incidencia inválidos", issues);
  }

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      membership_id: formData.membership_id,
      shipment_id: formData.shipment_id,
      type: formData.type,
      status: formData.status,
      description: formData.description,
      resolution_notes: formData.resolution_notes,
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
    entity_type: "incident",
    entity_id: data.id,
    description: `Incidencia creada: ${formData.type}`,
    metadata: { type: formData.type, membership_id: formData.membership_id },
  });

  revalidatePath("/admin/incidents");
  return successResponse(data, "Incidencia creada exitosamente");
}

/**
 * Update an incident
 */
export async function updateIncident(formData: UpdateIncidentInput) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Validate input
  const result = updateIncidentSchema.safeParse(formData);
  if (!result.success) {
    const issues = result.error.errors.map((e) => e.message);
    return errorResponse("Datos de actualización inválidos", issues);
  }

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (formData.status) updateData.status = formData.status;
  if (formData.description) updateData.description = formData.description;
  if (formData.resolution_notes !== undefined)
    updateData.resolution_notes = formData.resolution_notes;

  // If status is being changed to resolved, set resolved_at and resolved_by
  if (formData.status === "resolved") {
    updateData.resolved_at = new Date().toISOString();
    updateData.resolved_by = admin.id;
  }

  const { data, error } = await supabase
    .from("incidents")
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
    action: formData.status === "resolved" ? "incident_resolved" : "updated",
    entity_type: "incident",
    entity_id: data.id,
    description:
      formData.status === "resolved"
        ? "Incidencia resuelta"
        : "Incidencia actualizada",
    metadata: { status: formData.status },
  });

  revalidatePath("/admin/incidents");
  return successResponse(data, "Incidencia actualizada exitosamente");
}

/**
 * Delete an incident
 */
export async function deleteIncident(id: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("incidents").delete().eq("id", id);

  if (error) {
    return handleSupabaseError(error);
  }

  // Log activity
  await logActivity({
    user_id: admin.id,
    action: "deleted",
    entity_type: "incident",
    entity_id: id,
    description: "Incidencia eliminada",
  });

  revalidatePath("/admin/incidents");
  return successResponse(null, "Incidencia eliminada exitosamente");
}

/**
 * Get incident statistics
 */
export async function getIncidentStats() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("status, type");

  if (error) {
    return handleSupabaseError(error);
  }

  const stats = {
    total: data?.length || 0,
    open: data?.filter((i) => i.status === "open").length || 0,
    in_progress: data?.filter((i) => i.status === "in_progress").length || 0,
    resolved: data?.filter((i) => i.status === "resolved").length || 0,
    by_type: {
      shipping: data?.filter((i) => i.type === "shipping").length || 0,
      payment: data?.filter((i) => i.type === "payment").length || 0,
      membership: data?.filter((i) => i.type === "membership").length || 0,
      kit: data?.filter((i) => i.type === "kit").length || 0,
      other: data?.filter((i) => i.type === "other").length || 0,
    },
  };

  return successResponse(stats);
}

/**
 * Get incidents for a specific membership
 */
export async function getMembershipIncidents(membershipId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("membership_id", membershipId)
    .order("created_at", { ascending: false });

  if (error) {
    return handleSupabaseError(error);
  }

  return successResponse(data || []);
}
