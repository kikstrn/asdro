import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CalendarCheck,
  Clock3,
  DoorClosed,
  Users,
} from "lucide-react";

import { AppHeader } from "@/components/navigation/app-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const {
    data: member,
  } = await supabase
    .from("members")
    .select(
      `
      id,
      first_name,
      last_name,
      role,
      active
      `
    )
    .eq("user_id", user.id)
    .single();

  if (
    !member ||
    !member.active ||
    !["ADMIN", "SUPER_ADMIN"].includes(member.role)
  ) {
    redirect("/");
  }

  // ==========================================================
  // STATISTIQUES
  // ==========================================================

  const now = new Date();

  const [
    membersResult,
    bookingsResult,
    closuresResult,
  ] = await Promise.all([
    supabase
      .from("members")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("active", true),

    supabase
      .from("bookings")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "CONFIRMED")
      .gt(
        "ends_at",
        now.toISOString()
      ),

    supabase
      .from("closures")
      .select("id", {
        count: "exact",
        head: true,
      })
      .gt(
        "ends_at",
        now.toISOString()
      ),
  ]);

  const activeMembers =
    membersResult.count ?? 0;

  const upcomingBookings =
    bookingsResult.count ?? 0;

  const upcomingClosures =
    closuresResult.count ?? 0;

  return (
    <main className="min-h-screen">
      <AppHeader
        firstName={member.first_name}
      />

      <div className="asdro-container py-6 md:py-10">
        {/* ================================================== */}
        {/* HERO */}
        {/* ================================================== */}

        <section>
          <p className="text-sm font-medium text-[#b8f536]">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Tableau de bord
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Gérez les réservations, les adhérents,
            les fermetures et les règles du club.
          </p>
        </section>

        {/* ================================================== */}
        {/* STATISTIQUES */}
        {/* ================================================== */}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="asdro-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/45">
                  Adhérents actifs
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {activeMembers}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="asdro-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/45">
                  Réservations à venir
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {upcomingBookings}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="asdro-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/45">
                  Fermetures à venir
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {upcomingClosures}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                <DoorClosed className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* MODULES */}
        {/* ================================================== */}

        <section className="mt-10">
          <div>
            <h2 className="text-xl font-bold">
              Gestion du club
            </h2>

            <p className="mt-1 text-sm text-white/45">
              Accédez aux différents outils d&apos;administration.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {/* RÉSERVATIONS */}

            <Link
              href="/admin/reservations"
              className="asdro-card group p-6 transition hover:border-[#b8f536]/30 hover:bg-[#b8f536]/5"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                    <CalendarCheck className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold">
                    Réservations
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Consultez les réservations, recherchez un adhérent
                    et annulez un créneau si nécessaire.
                  </p>
                </div>

                <span className="mt-1 text-xl text-white/30 transition group-hover:translate-x-1 group-hover:text-[#b8f536]">
                  →
                </span>
              </div>
            </Link>

            {/* ADHÉRENTS */}

            <Link
              href="/admin/adherents"
              className="asdro-card group p-6 transition hover:border-[#b8f536]/30 hover:bg-[#b8f536]/5"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                    <Users className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold">
                    Adhérents
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Ajoutez, recherchez, importez et gérez
                    les membres de l&apos;association.
                  </p>
                </div>

                <span className="mt-1 text-xl text-white/30 transition group-hover:translate-x-1 group-hover:text-[#b8f536]">
                  →
                </span>
              </div>
            </Link>

            {/* FERMETURES */}

            <Link
              href="/admin/fermetures"
              className="asdro-card group p-6 transition hover:border-[#b8f536]/30 hover:bg-[#b8f536]/5"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                    <DoorClosed className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold">
                    Fermetures
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Bloquez un terrain ou tous les terrains
                    pour un événement ou une indisponibilité.
                  </p>
                </div>

                <span className="mt-1 text-xl text-white/30 transition group-hover:translate-x-1 group-hover:text-[#b8f536]">
                  →
                </span>
              </div>
            </Link>

            {/* HORAIRES */}

            <Link
              href="/admin/horaires"
              className="asdro-card group p-6 transition hover:border-[#b8f536]/30 hover:bg-[#b8f536]/5"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold">
                    Horaires & règles
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/50">
                    Configurez les heures d&apos;ouverture,
                    la durée des créneaux et les règles de réservation.
                  </p>
                </div>

                <span className="mt-1 text-xl text-white/30 transition group-hover:translate-x-1 group-hover:text-[#b8f536]">
                  →
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* ================================================== */}
        {/* RETOUR PLANNING */}
        {/* ================================================== */}

        <section className="mt-10 pb-10">
          <Link
            href="/"
            className="asdro-button-secondary w-full md:w-auto"
          >
            Retour au planning
          </Link>
        </section>
      </div>
    </main>
  );
}