export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-serif font-bold text-[#141414] mb-4">
          KingClub
        </h1>
        <p className="text-[#525252]">
          Sistema de administración de membresías
        </p>
        <div className="mt-8 space-x-4">
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#DC2626] text-white font-medium hover:bg-[#B91C1C] transition-colors"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    </main>
  );
}
