"use server";

import { createClient } from "@/lib/supabase/server";

export type EntityType =
  | "profile"
  | "membership"
  | "payment"
  | "kit"
  | "shipment"
  | "incident"
  | "template"
  | "address"
  | "system";

export type LogAction =
  | "created"
  | "updated"
  | "deleted"
  | "viewed"
  | "status_changed"
  | "login"
  | "logout"
  | "password_reset"
  | "email_sent"
  | "payment_processed"
  | "shipment_updated"
  | "incident_resolved"
  | "template_rendered"
  | "report_generated"
  | "other";

export interface LogEntry {
  user_id?: string;
  action: LogAction;
  entity_type: EntityType;
  entity_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: LogAction;
  entity_type: EntityType;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email?: string | null;
  user_full_name?: string | null;
}

export interface LogFilter {
  entity_type?: EntityType;
  entity_id?: string;
  action?: LogAction;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Log an activity to the database
 */
export async function logActivity(entry: LogEntry): Promise<void> {
  const supabase = await createClient();

  try {
    await supabase.from("activity_logs").insert({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      description: entry.description,
      metadata: entry.metadata || {},
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
    });
  } catch (error) {
    // Silently fail - logging should not break the main flow
    console.error("Failed to log activity:", error);
  }
}

/**
 * Get activity logs with filters
 */
export async function getActivityLogs(
  filter: LogFilter = {}
): Promise<{ data: ActivityLog[]; count: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("activity_logs")
    .select(
      "*, profiles:user_id(email, full_name)",
      { count: "exact" }
    );

  // Apply filters
  if (filter.entity_type) {
    query = query.eq("entity_type", filter.entity_type);
  }

  if (filter.entity_id) {
    query = query.eq("entity_id", filter.entity_id);
  }

  if (filter.action) {
    query = query.eq("action", filter.action);
  }

  if (filter.user_id) {
    query = query.eq("user_id", filter.user_id);
  }

  if (filter.date_from) {
    query = query.gte("created_at", filter.date_from);
  }

  if (filter.date_to) {
    query = query.lte("created_at", filter.date_to);
  }

  // Order by created_at desc
  query = query.order("created_at", { ascending: false });

  // Apply pagination
  const limit = filter.limit || 50;
  const offset = filter.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching activity logs: ${error.message}`);
  }

  // Transform data to include user info
  const transformedData: ActivityLog[] = (data || []).map((log) => ({
    ...log,
    user_email: log.profiles?.email || null,
    user_full_name: log.profiles?.full_name || null,
  }));

  return {
    data: transformedData,
    count: count || 0,
  };
}

/**
 * Get logs for a specific entity
 */
export async function getEntityLogs(
  entityType: EntityType,
  entityId: string,
  limit: number = 20
): Promise<ActivityLog[]> {
  const { data } = await getActivityLogs({
    entity_type: entityType,
    entity_id: entityId,
    limit,
  });

  return data;
}

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(
  limit: number = 10
): Promise<ActivityLog[]> {
  const { data } = await getActivityLogs({ limit });
  return data;
}

/**
 * Get activity statistics
 */
export async function getActivityStats(
  dateFrom?: string,
  dateTo?: string
): Promise<{
  total_logs: number;
  actions_breakdown: Record<LogAction, number>;
  entities_breakdown: Record<EntityType, number>;
}> {
  const supabase = await createClient();

  let query = supabase.from("activity_logs").select("action, entity_type");

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching activity stats: ${error.message}`);
  }

  const actionsBreakdown: Record<string, number> = {};
  const entitiesBreakdown: Record<string, number> = {};

  data?.forEach((log) => {
    actionsBreakdown[log.action] = (actionsBreakdown[log.action] || 0) + 1;
    entitiesBreakdown[log.entity_type] =
      (entitiesBreakdown[log.entity_type] || 0) + 1;
  });

  return {
    total_logs: data?.length || 0,
    actions_breakdown: actionsBreakdown as Record<LogAction, number>,
    entities_breakdown: entitiesBreakdown as Record<EntityType, number>,
  };
}
