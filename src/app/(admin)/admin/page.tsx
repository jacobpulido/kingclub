import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CreditCard,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { getDashboardStats } from "@/actions/reports";
import { getRecentActivity } from "@/lib/system/logger";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/member/dashboard");
  }

  // Get stats
  const statsResult = await getDashboardStats();
  const stats = statsResult.success ? statsResult.data : null;

  // Get recent activity
  const recentActivity = await getRecentActivity(5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general del sistema KingClub
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Miembros
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.members.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.members.active || 0} activos ·{" "}
              {stats?.members.new_this_month || 0} nuevos este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.payments.total_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.payments.total_this_month || 0} pagos ·{" "}
              {stats?.payments.pending || 0} pendientes
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
              {stats?.shipments.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.shipments.delivered_this_month || 0} entregados ·{" "}
              {stats?.shipments.in_transit || 0} en tránsito
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {`${ stats?.incidents.total_open || 0} open `}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.incidents.total_open || 0} abiertas ·{" "}
              {stats?.incidents.total_in_progress || 0} en progreso
            </p>
          </CardContent>
        </Card>
      </div>

      { /* Quick Links */ }
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/incidents">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Incidencias Abiertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gestionar incidencias pendientes y en progreso
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reports">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Reportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ver reportes detallados y exportar datos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/activity">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-blue-500" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ver logs de actividad del sistema
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
