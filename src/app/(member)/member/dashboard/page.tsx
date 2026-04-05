import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Bienvenido, {profile?.full_name || "Usuario"}
        </h2>
        <p className="text-gray-600 mb-6">
          Este es tu panel de control. Aquí podrás gestionar tu membresía y ver tu información.
        </p>

        {isAdmin ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Panel de Administrador</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin">
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <h4 className="font-medium">Dashboard Admin</h4>
                    <p className="text-sm text-gray-500">Accede al panel de administración</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/incidents">
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <h4 className="font-medium">Incidencias</h4>
                    <p className="text-sm text-gray-500">Gestiona las incidencias del sistema</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/reports">
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <h4 className="font-medium">Reportes</h4>
                    <p className="text-sm text-gray-500">Ver reportes y estadísticas</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tu Membresía</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">Activa</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Próximo pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">15 de mayo, 2026</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Próximo envío</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">1 de mayo, 2026</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
