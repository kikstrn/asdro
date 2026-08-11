import { createClient } from "@/lib/supabase/serveur";

export default async function Home() {
  const supabase = await createClient();

  const { data: courts, error } = await supabase
    .from("courts")
    .select("id, name, active, sort_order")
    .order("sort_order");

  return (
    <main className="min-h-screen p-10">
      <h1 className="mb-8 text-3xl font-bold">
        ASDRO Tennis
      </h1>

      <h2 className="mb-4 text-xl font-semibold">
        Terrains
      </h2>

      {error && (
        <p className="text-red-500">
          Erreur Supabase : {error.message}
        </p>
      )}

      <div className="space-y-3">
        {courts?.map((court) => (
          <div
            key={court.id}
            className="rounded-lg border p-4"
          >
            <p className="font-semibold">{court.name}</p>

            <p className="text-sm">
              {court.active ? "Disponible" : "Désactivé"}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}