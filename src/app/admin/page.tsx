import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Clock3, DoorClosed, Users } from "lucide-react";
import { AppHeader } from "@/components/navigation/app-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: member } = await supabase
    .from("members")
    .select("id, first_name, last_name, role, active")
    .eq("user_id", user.id)
    .single();

  if (!member || !member.active || !["ADMIN", "SUPER_ADMIN"].includes(member.role)) {
    redirect("/");
  }

  const now = new Date().toISOString();
  const [membersResult, bookingsResult, closuresResult] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "CONFIRMED").gt("ends_at", now),
    supabase.from("closures").select("id", { count: "exact", head: true }).gt("ends_at", now),
  ]);

  const stats = [
    { label: "Adhérents actifs", value: membersResult.count ?? 0, icon: Users },
    { label: "Réservations à venir", value: bookingsResult.count ?? 0, icon: CalendarCheck },
    { label: "Fermetures à venir", value: closuresResult.count ?? 0, icon: DoorClosed },
  ];

  const cards = [
    { href: "/admin/reservations", title: "Réservations", text: "Consultez et gérez les réservations des adhérents.", icon: CalendarCheck },
    { href: "/admin/adherents", title: "Adhérents", text: "Ajoutez, recherchez, importez et gérez les membres.", icon: Users },
    { href: "/admin/fermetures", title: "Fermetures", text: "Gérez les indisponibilités ponctuelles et récurrentes.", icon: DoorClosed },
    { href: "/admin/horaires", title: "Horaires & règles", text: "Configurez les horaires et les règles de réservation.", icon: Clock3 },
  ];

  return (
    <main className="min-h-screen">
      <AppHeader firstName={member.first_name} />
      <div className="asdro-container py-6 md:py-10">
        <section>
          <p className="text-sm font-medium text-[#b8f536]">Administration</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Tableau de bord</h1>
          <p className="mt-2 text-sm text-white/50">Gérez les réservations, les adhérents, les fermetures et les règles du club.</p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="asdro-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/45">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Gestion du club</h2>
          <p className="mt-1 text-sm text-white/45">Accédez aux différents outils d&apos;administration.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {cards.map(({ href, title, text, icon: Icon }) => (
              <Link key={href} href={href} className="asdro-card group p-6 transition hover:border-[#b8f536]/30 hover:bg-[#b8f536]/5">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
                  </div>
                  <span className="mt-1 text-xl text-white/30 transition group-hover:translate-x-1 group-hover:text-[#b8f536]">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
