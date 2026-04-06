"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/system/admin";
import { logActivity } from "@/lib/system/logger";
import {
  successResponse,
  errorResponse,
  handleSupabaseError,
} from "@/lib/system/responses";

export interface DateRange {
  from?: string;
  to?: string;
}

export interface DashboardStats {
  members: {
    total: number;
    active: number;
    new_this_month: number;
  };
  payments: {
    total_this_month: number;
    total_amount: number;
    pending: number;
    failed: number;
  };
  shipments: {
    total: number;
    delivered_this_month: number;
    in_transit: number;
    preparing: number;
  };
  incidents: {
    total_open: number;
    total_in_progress: number;
    resolved_this_month: number;
  };
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  payments_count: number;
}

export interface MembershipGrowth {
  month: string;
  new_members: number;
  cancelled_members: number;
  net_growth: number;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  await requireAdmin();
  const supabase = await createClient();

  try {
    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Members stats
    const { data: membersData, error: membersError } = await supabase
      .from("profiles")
      .select("created_at, memberships(status)");

    if (membersError) throw membersError;

    const activeMembers =
      membersData?.filter((m) =>
        m.memberships?.some((mem: { status: string }) => mem.status === "active")
      ).length || 0;

    const newThisMonth =
      membersData?.filter((m) => m.created_at >= monthStart).length || 0;

    // Payments stats
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("status, amount, paid_at, created_at");

    if (paymentsError) throw paymentsError;

    const thisMonthPayments =
      paymentsData?.filter((p) => p.created_at >= monthStart) || [];

    const totalAmount = thisMonthPayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Shipments stats
    const { data: shipmentsData, error: shipmentsError } = await supabase
      .from("shipments")
      .select("status, delivered_at");

    if (shipmentsError) throw shipmentsError;

    const deliveredThisMonth =
      shipmentsData?.filter(
        (s) => s.delivered_at && s.delivered_at >= monthStart
      ).length || 0;

    // Incidents stats
    const { data: incidentsData, error: incidentsError } = await supabase
      .from("incidents")
      .select("status, resolved_at");

    if (incidentsError) throw incidentsError;

    const resolvedThisMonth =
      incidentsData?.filter(
        (i) => i.resolved_at && i.resolved_at >= monthStart
      ).length || 0;

    const stats: DashboardStats = {
      members: {
        total: membersData?.length || 0,
        active: activeMembers,
        new_this_month: newThisMonth,
      },
      payments: {
        total_this_month: thisMonthPayments.length,
        total_amount: totalAmount,
        pending:
          paymentsData?.filter((p) => p.status === "pending").length || 0,
        failed:
          paymentsData?.filter((p) => p.status === "failed").length || 0,
      },
      shipments: {
        total: shipmentsData?.length || 0,
        delivered_this_month: deliveredThisMonth,
        in_transit:
          shipmentsData?.filter((s) => s.status === "in_transit").length || 0,
        preparing:
          shipmentsData?.filter((s) => s.status === "preparing").length || 0,
      },
      incidents: {
        total_open:
          incidentsData?.filter((i) => i.status === "open").length || 0,
        total_in_progress:
          incidentsData?.filter((i) => i.status === "in_progress").length || 0,
        resolved_this_month: resolvedThisMonth,
      },
    };

    return successResponse(stats);
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return errorResponse("Error al obtener estadísticas del dashboard");
  }
}

/**
 * Get revenue report by period
 */
export async function getRevenueReport(dateRange: DateRange) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    let query = supabase
      .from("payments")
      .select("amount, paid_at, created_at")
      .eq("status", "completed")
      .order("paid_at", { ascending: true });

    if (dateRange.from) {
      query = query.gte("paid_at", dateRange.from);
    }

    if (dateRange.to) {
      query = query.lte("paid_at", dateRange.to);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by month
    const revenueByMonth: Record<string, MonthlyRevenue> = {};

    data?.forEach((payment) => {
      const date = new Date(payment.paid_at || payment.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = {
          month: monthKey,
          revenue: 0,
          payments_count: 0,
        };
      }

      revenueByMonth[monthKey].revenue += payment.amount || 0;
      revenueByMonth[monthKey].payments_count += 1;
    });

    const result = Object.values(revenueByMonth).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    // Log activity
    await logActivity({
      user_id: admin.id,
      action: "report_generated",
      entity_type: "payment",
      description: "Reporte de ingresos generado",
      metadata: { date_range: dateRange },
    });

    return successResponse(result);
  } catch (error) {
    console.error("Error getting revenue report:", error);
    return errorResponse("Error al generar reporte de ingresos");
  }
}

/**
 * Get membership growth report
 */
export async function getMembershipGrowthReport(dateRange: DateRange) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    // Get memberships with their history
    let query = supabase
      .from("memberships")
      .select("start_date, cancellation_date, status, created_at")
      .order("created_at", { ascending: true });

    if (dateRange.from) {
      query = query.gte("created_at", dateRange.from);
    }

    if (dateRange.to) {
      query = query.lte("created_at", dateRange.to);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by month
    const growthByMonth: Record<string, MembershipGrowth> = {};

    data?.forEach((membership) => {
      const createdDate = new Date(membership.created_at);
      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}`;

      if (!growthByMonth[monthKey]) {
        growthByMonth[monthKey] = {
          month: monthKey,
          new_members: 0,
          cancelled_members: 0,
          net_growth: 0,
        };
      }

      growthByMonth[monthKey].new_members += 1;
    });

    // Count cancellations
    data?.forEach((membership) => {
      if (membership.cancellation_date) {
        const cancelDate = new Date(membership.cancellation_date);
        const monthKey = `${cancelDate.getFullYear()}-${String(cancelDate.getMonth() + 1).padStart(2, "0")}`;

        if (!growthByMonth[monthKey]) {
          growthByMonth[monthKey] = {
            month: monthKey,
            new_members: 0,
            cancelled_members: 0,
            net_growth: 0,
          };
        }

        growthByMonth[monthKey].cancelled_members += 1;
      }
    });

    // Calculate net growth
    Object.values(growthByMonth).forEach((month) => {
      month.net_growth = month.new_members - month.cancelled_members;
    });

    const result = Object.values(growthByMonth).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    // Log activity
    await logActivity({
      user_id: admin.id,
      action: "report_generated",
      entity_type: "membership",
      description: "Reporte de crecimiento generado",
      metadata: { date_range: dateRange },
    });

    return successResponse(result);
  } catch (error) {
    console.error("Error getting membership growth report:", error);
    return errorResponse("Error al generar reporte de crecimiento");
  }
}

/**
 * Get shipments report
 */
export async function getShipmentsReport(dateRange: DateRange) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    let query = supabase
      .from("shipments")
      .select("status, shipped_at, delivered_at, carrier")
      .order("shipped_at", { ascending: false });

    if (dateRange.from) {
      query = query.gte("shipped_at", dateRange.from);
    }

    if (dateRange.to) {
      query = query.lte("shipped_at", dateRange.to);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      by_status: {
        preparing: data?.filter((s) => s.status === "preparing").length || 0,
        packed: data?.filter((s) => s.status === "packed").length || 0,
        shipped: data?.filter((s) => s.status === "shipped").length || 0,
        in_transit: data?.filter((s) => s.status === "in_transit").length || 0,
        delivered: data?.filter((s) => s.status === "delivered").length || 0,
      },
      by_carrier: {} as Record<string, number>,
    };

    // Group by carrier
    data?.forEach((shipment) => {
      if (shipment.carrier) {
        stats.by_carrier[shipment.carrier] =
          (stats.by_carrier[shipment.carrier] || 0) + 1;
      }
    });

    // Log activity
    await logActivity({
      user_id: admin.id,
      action: "report_generated",
      entity_type: "shipment",
      description: "Reporte de envíos generado",
      metadata: { date_range: dateRange },
    });

    return successResponse(stats);
  } catch (error) {
    console.error("Error getting shipments report:", error);
    return errorResponse("Error al generar reporte de envíos");
  }
}

/**
 * Get incidents report
 */
export async function getIncidentsReport(dateRange: DateRange) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    let query = supabase
      .from("incidents")
      .select("type, status, created_at, resolved_at")
      .order("created_at", { ascending: false });

    if (dateRange.from) {
      query = query.gte("created_at", dateRange.from);
    }

    if (dateRange.to) {
      query = query.lte("created_at", dateRange.to);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      by_type: {
        shipping: data?.filter((i) => i.type === "shipping").length || 0,
        payment: data?.filter((i) => i.type === "payment").length || 0,
        membership: data?.filter((i) => i.type === "membership").length || 0,
        kit: data?.filter((i) => i.type === "kit").length || 0,
        other: data?.filter((i) => i.type === "other").length || 0,
      },
      by_status: {
        open: data?.filter((i) => i.status === "open").length || 0,
        in_progress: data?.filter((i) => i.status === "in_progress").length || 0,
        resolved: data?.filter((i) => i.status === "resolved").length || 0,
      },
      avg_resolution_time: 0,
    };

    // Calculate average resolution time
    const resolvedIncidents =
      data?.filter((i) => i.resolved_at && i.created_at) || [];

    if (resolvedIncidents.length > 0) {
      const totalHours = resolvedIncidents.reduce((sum, incident) => {
        const created = new Date(incident.created_at);
        const resolved = new Date(incident.resolved_at!);
        const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      stats.avg_resolution_time = Math.round(totalHours / resolvedIncidents.length);
    }

    // Log activity
    await logActivity({
      user_id: admin.id,
      action: "report_generated",
      entity_type: "incident",
      description: "Reporte de incidencias generado",
      metadata: { date_range: dateRange },
    });

    return successResponse(stats);
  } catch (error) {
    console.error("Error getting incidents report:", error);
    return errorResponse("Error al generar reporte de incidencias");
  }
}

/**
 * Export data to CSV format
 */
export async function exportData(
  entity: "members" | "payments" | "shipments" | "incidents",
  dateRange: DateRange
) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  try {
    let query;
    let data;

    switch (entity) {
      case "members":
        query = supabase.from("profiles").select("*, memberships(*), addresses(*)");
        break;
      case "payments":
        query = supabase.from("payments").select("*, memberships(profile_id)");
        break;
      case "shipments":
        query = supabase.from("shipments").select("*");
        break;
      case "incidents":
        query = supabase.from("incidents").select("*");
        break;
    }

    if (dateRange.from) {
      query = query.gte("created_at", dateRange.from);
    }

    if (dateRange.to) {
      query = query.lte("created_at", dateRange.to);
    }

    const result = await query;
    data = result.data;

    if (result.error) throw result.error;

    // Log activity
    await logActivity({
      user_id: admin.id,
      action: "report_generated",
      entity_type: entity === "members" ? "profile" : (entity as "payment" | "shipment" | "incident"),
      description: `Exportación de datos: ${entity}`,
      metadata: { entity, date_range: dateRange, count: data?.length },
    });

    return successResponse(data || []);
  } catch (error) {
    console.error("Error exporting data:", error);
    return errorResponse("Error al exportar datos");
  }
}
