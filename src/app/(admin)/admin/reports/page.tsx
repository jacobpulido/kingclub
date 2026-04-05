"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  getDashboardStats,
  getRevenueReport,
  getMembershipGrowthReport,
  getShipmentsReport,
  getIncidentsReport,
  exportData,
  type DashboardStats,
  type DateRange,
} from "@/actions/reports";

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [revenueData, setRevenueData] = useState<
    Array<{ month: string; revenue: number; payments_count: number }>
  >([]);
  const [growthData, setGrowthData] = useState<
    Array<{
      month: string;
      new_members: number;
      cancelled_members: number;
      net_growth: number;
    }>
  >([]);
  const [shipmentsData, setShipmentsData] = useState<{
    total: number;
    by_status: Record<string, number>;
    by_carrier: Record<string, number>;
  } | null>(null);
  const [incidentsData, setIncidentsData] = useState<{
    total: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
    avg_resolution_time: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllReports();
  }, [dateRange]);

  async function loadAllReports() {
    setLoading(true);

    // Load dashboard stats
    const statsResult = await getDashboardStats();
    if (statsResult.success) {
      setStats(statsResult.data || null);
    }

    // Load revenue report
    const revenueResult = await getRevenueReport({
      from: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
      to: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    });
    if (revenueResult.success) {
      setRevenueData(revenueResult.data || []);
    }

    // Load growth report
    const growthResult = await getMembershipGrowthReport({
      from: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
      to: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    });
    if (growthResult.success) {
      setGrowthData(growthResult.data || []);
    }

    // Load shipments report
    const shipmentsResult = await getShipmentsReport({
      from: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
      to: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    });
    if (shipmentsResult.success) {
      setShipmentsData(shipmentsResult.data || null);
    }

    // Load incidents report
    const incidentsResult = await getIncidentsReport({
      from: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
      to: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    });
    if (incidentsResult.success) {
      setIncidentsData(incidentsResult.data || null);
    }

    setLoading(false);
  }

  async function handleExport(entity: "members" | "payments" | "shipments" | "incidents") {
    const result = await exportData(entity, {
      from: dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
      to: dateRange.to ? new Date(dateRange.to).toISOString() : undefined,
    });

    if (result.success && result.data) {
      // Convert to CSV and download
      const csv = convertToCSV(result.data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${entity}_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    }
  }

  function convertToCSV(data: unknown[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0] as Record<string, unknown>);
    const rows = data.map((item) =>
      headers
        .map((header) => {
          const value = (item as Record<string, unknown>)[header];
          return typeof value === "string" ? `"${value}"` : value;
        })
        .join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reportes</h2>
          <p className="text-muted-foreground">
            Visualiza reportes y estadísticas del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) =>
              setDateRange({ ...dateRange, from: e.target.value })
            }
            className="w-[150px]"
          />
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) =>
              setDateRange({ ...dateRange, to: e.target.value })
            }
            className="w-[150px]"
          />
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Miembros Activos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.members.active}
              </div>
              <p className="text-xs text-muted-foreground">
                de {stats.members.total} totales
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos del Periodo
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  revenueData.reduce((sum, r) => sum + r.revenue, 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {revenueData.reduce((sum, r) => sum + r.payments_count, 0)}{" "}
                pagos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Envíos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shipmentsData?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {shipmentsData?.by_status.delivered || 0} entregados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Incidencias Abiertas
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(incidentsData?.by_status.open || 0) +
                  (incidentsData?.by_status.in_progress || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {incidentsData?.by_status.resolved || 0} resueltas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleExport("members")}>
              <Users className="h-4 w-4 mr-2" />
              Miembros
            </Button>
            <Button variant="outline" onClick={() => handleExport("payments")}>
              <DollarSign className="h-4 w-4 mr-2" />
              Pagos
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("shipments")}
            >
              <Package className="h-4 w-4 mr-2" />
              Envíos
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("incidents")}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Incidencias
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reports */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">
            <TrendingUp className="h-4 w-4 mr-2" />
            Ingresos
          </TabsTrigger>
          <TabsTrigger value="growth">
            <Users className="h-4 w-4 mr-2" />
            Crecimiento
          </TabsTrigger>
          <TabsTrigger value="shipments">
            <Package className="h-4 w-4 mr-2" />
            Envíos
          </TabsTrigger>
          <TabsTrigger value="incidents">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Incidencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <p className="text-muted-foreground">No hay datos de ingresos</p>
              ) : (
                <div className="space-y-4">
                  {revenueData.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(item.month + "-01").toLocaleDateString(
                            "es-MX",
                            { month: "long", year: "numeric" }
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.payments_count} pagos
                        </p>
                      </div>
                      <p className="text-lg font-bold">
                        {formatCurrency(item.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth">
          <Card>
            <CardHeader>
              <CardTitle>Crecimiento de Miembros</CardTitle>
            </CardHeader>
            <CardContent>
              {growthData.length === 0 ? (
                <p className="text-muted-foreground">
                  No hay datos de crecimiento
                </p>
              ) : (
                <div className="space-y-4">
                  {growthData.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(item.month + "-01").toLocaleDateString(
                            "es-MX",
                            { month: "long", year: "numeric" }
                          )}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">
                          +{item.new_members} nuevos
                        </span>
                        <span className="text-red-600">
                          -{item.cancelled_members} cancelados
                        </span>
                        <span
                          className={`font-medium ${
                            item.net_growth >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          Neto: {item.net_growth > 0 ? "+" : ""}
                          {item.net_growth}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Envíos</CardTitle>
            </CardHeader>
            <CardContent>
              {!shipmentsData ? (
                <p className="text-muted-foreground">No hay datos de envíos</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(shipmentsData.by_status).map(
                      ([status, count]) => (
                        <div key={status} className="p-3 border rounded text-center">
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {status.replace("_", " ")}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                  {Object.keys(shipmentsData.by_carrier).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Por Transportista</h4>
                      <div className="space-y-2">
                        {Object.entries(shipmentsData.by_carrier).map(
                          ([carrier, count]) => (
                            <div
                              key={carrier}
                              className="flex justify-between p-2 bg-gray-50 rounded"
                            >
                              <span>{carrier}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Incidencias</CardTitle>
            </CardHeader>
            <CardContent>
              {!incidentsData ? (
                <p className="text-muted-foreground">
                  No hay datos de incidencias
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {incidentsData.by_status.open}
                      </p>
                      <p className="text-sm text-muted-foreground">Abiertas</p>
                    </div>
                    <div className="p-3 border rounded text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {incidentsData.by_status.in_progress}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        En Progreso
                      </p>
                    </div>
                    <div className="p-3 border rounded text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {incidentsData.by_status.resolved}
                      </p>
                      <p className="text-sm text-muted-foreground">Resueltas</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Por Tipo</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(incidentsData.by_type).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="p-3 border rounded text-center"
                          >
                            <p className="text-xl font-bold">{count}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {type}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {incidentsData.avg_resolution_time > 0 && (
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm">
                        <span className="font-medium">
                          Tiempo promedio de resolución:
                        </span>{" "}
                        {Math.round(incidentsData.avg_resolution_time)} horas
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
