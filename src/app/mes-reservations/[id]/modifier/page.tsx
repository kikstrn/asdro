import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";

import {
  EditBookingForm,
} from "@/components/booking/edit-booking-form";

import { AppHeader } from "@/components/navigation/app-header";

import {
  formatBookingDate,
  formatBookingTime,
} from "@/lib/booking/date";

import { createClient } from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditBookingPage({
  params,
  searchParams,
}: PageProps) {
  const { id } =
    await params;

  const query =
    await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const {
    data: member,
  } = await supabase
    .from("members")
    .select(`
      id,
      first_name,
      last_name,
      role,
      active
    `)
    .eq(
      "user_id",
      user.id
    )
    .single();

  if (
    !member ||
    !member.active
  ) {
    redirect("/");
  }

  const {
    data: booking,
    error: bookingError,
  } = await supabase
    .from("bookings")
    .select(`
      id,
      member_id,
      starts_at,
      ends_at,
      status,
      match_type,

      courts (
        name
      ),

      booking_participants (
        member_id,
        members (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq("id", id)
    .single();

  if (
    bookingError ||
    !booking
  ) {
    redirect(
      "/mes-reservations"
    );
  }

  if (
    booking.member_id !==
    member.id
  ) {
    redirect(
      "/mes-reservations"
    );
  }

  if (
    booking.status !==
    "CONFIRMED"
  ) {
    redirect(
      "/mes-reservations"
    );
  }

  if (
    new Date(
      booking.starts_at
    ) <= new Date()
  ) {
    redirect(
      "/mes-reservations"
    );
  }

  const {
    data: playableMembers,
    error: membersError,
  } = await supabase
    .from("members")
    .select(`
      id,
      first_name,
      last_name
    `)
    .eq(
      "active",
      true
    )
    .neq(
      "id",
      member.id
    )
    .order("first_name")
    .order("last_name");

  if (membersError) {
    return (
      <main className="min-h-screen">
        <AppHeader
          firstName={
            member.first_name
          }
          backHref="/mes-reservations"
          backLabel="Mes réservations"
        />

        <div className="asdro-container py-10">
          <div className="asdro-card p-6 text-red-400">
            Impossible de charger les adhérents.
          </div>
        </div>
      </main>
    );
  }

  const participants =
    booking
      .booking_participants ??
    [];

  const initialParticipantIds =
    participants
      .map(
        (participant) =>
          participant.member_id
      )
      .filter(Boolean);

  const court =
    Array.isArray(
      booking.courts
    )
      ? booking.courts[0]
      : booking.courts;

  const start =
    new Date(
      booking.starts_at
    );

  const end =
    new Date(
      booking.ends_at
    );

  const isAdmin =
    member.role ===
      "ADMIN" ||
    member.role ===
      "SUPER_ADMIN";

  return (
    <main className="min-h-screen">
      <AppHeader
        firstName={
          member.first_name
        }
        isAdmin={isAdmin}
        backHref="/mes-reservations"
        backLabel="Mes réservations"
      />

      <div className="asdro-container py-6 md:py-10">
        <section>
          <p className="text-sm font-medium text-[#b8f536]">
            Mes réservations
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Modifier le match
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Modifiez le type de partie ou les joueurs invités.
            Le terrain et l&apos;horaire restent inchangés.
          </p>
        </section>

        {query.error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="font-semibold text-red-400">
              Modification impossible
            </p>

            <p className="mt-1 text-sm text-red-200/60">
              {query.error}
            </p>
          </div>
        )}

        <section className="asdro-card mt-8 p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <MapPin className="h-4 w-4 text-[#b8f536]" />

              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/35">
                Terrain
              </p>

              <p className="mt-1 font-semibold">
                {court?.name ??
                  "Terrain"}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <CalendarDays className="h-4 w-4 text-[#b8f536]" />

              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/35">
                Date
              </p>

              <p className="mt-1 font-semibold capitalize">
                {formatBookingDate(
                  start
                )}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <Clock3 className="h-4 w-4 text-[#b8f536]" />

              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/35">
                Horaire
              </p>

              <p className="mt-1 font-semibold">
                {formatBookingTime(
                  start
                )}
                {" – "}
                {formatBookingTime(
                  end
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="asdro-card mt-6 p-5 md:p-6">
          <EditBookingForm
            bookingId={
              booking.id
            }
            currentMemberName={`${member.first_name} ${member.last_name}`}
            initialMatchType={
              booking.match_type ===
              "DOUBLES"
                ? "DOUBLES"
                : "SINGLES"
            }
            initialParticipantIds={
              initialParticipantIds
            }
            members={
              playableMembers ??
              []
            }
          />
        </section>

        <div className="mt-6">
          <Link
            href="/mes-reservations"
            className="text-sm text-white/50 underline transition hover:text-white"
          >
            Retour à mes réservations
          </Link>
        </div>
      </div>
    </main>
  );
}
