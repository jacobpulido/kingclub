"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/system/admin";
import {
  getActivityLogs,
  getEntityLogs,
  getRecentActivity,
  getActivityStats,
  type LogFilter,
  type EntityType,
  type LogAction,
  type ActivityLog,
} from "@/lib/system/logger";
import {
  successResponse,
  errorResponse,
  paginatedSuccessResponse,
} from "@/lib/system/responses";

export interface ActivityFilter {
  entity_type?: EntityType;
  entity_id?: string;
  action?: LogAction;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export async function getActivities(filter: ActivityFilter = {}) {
  await requireAdmin();
  try {
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const offset = (page - 1) * limit;
    const logFilter: LogFilter = { entity_type: filter.entity_type, entity_id: filter.entity_id, action: filter.action, user_id: filter.user_id, date_from: filter.date_from, date_to: filter.date_to, limit, offset };
    const { data, count } = await getActivityLogs(logFilter);
    return paginatedSuccessResponse(data, page, limit, count);
  } catch (error) {
    return errorResponse("Error al obtener actividades");
  }
}

export async function getEntityActivity(entityType: EntityType, entityId: string, limit: number = 20) {
  await requireAdmin();
  try {
    const logs = await getEntityLogs(entityType, entityId, limit);
    return successResponse(logs);
  } catch (error) {
    return errorResponse("Error al obtener actividad de la entidad");
  }
}

export async function getDashboardActivity(limit: number = 10) {
  await requireAdmin();
  try {
    const logs = await getRecentActivity(limit);
    return successResponse(logs);
  } catch (error) {
    return errorResponse("Error al obtener actividad reciente");
  }
}

export async function getUserActivity(userId: string, limit: number = 50) {
  await requireAdmin();
  try {
    const filter: LogFilter = { user_id: userId, limit };
    const { data, count } = await getActivityLogs(filter);
    return paginatedSuccessResponse(data, 1, limit, count);
  } catch (error) {
    return errorResponse("Error al obtener actividad del usuario");
  }
}
