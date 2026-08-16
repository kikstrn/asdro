import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CalendarDays,
  CalendarPlus,
  Clock3,
  MapPin,
  Pencil,
  UserRoundCheck,
  Users,
} from "lucide-react";

import {
  CancelBookingButton,
} from "@/components/booking/cancel-booking-button";

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

export default async function BookingDetailsPage({
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
      court_id,
      starts_at,
      ends_at,
      status,
      match_type,

      courts (
        name
      ),

      members (
        id,
        first_name,
        last_name
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

  const owner =
    Array.isArray(
      booking.members
    )
      ? booking.members[0]
      : booking.members;

  const court =
    Array.isArray(
      booking.courts
    )
      ? booking.courts[0]
      : booking.courts;

  const participants =
    booking
      .booking_participants ??
    [];

  const currentMemberIsParticipant =
    participants.some(
      (participant) =>
        participant.member_id ===
        member.id
    );

  const isOwner =
    booking.member_id ===
    member.id;

  if (
    !isOwner &&
    !currentMemberIsParticipant
  ) {
    redirect(
      "/mes-reservations"
    );
  }

  const start =
    new Date(
      booking.starts_at
    );

  const end =
    new Date(
      booking.ends_at
    );

  const isPast =
    end <= new Date();

  const isActive =
    booking.status ===
      "CONFIRMED" &&
    !isPast;

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
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#b8f536]">
              Mes réservations
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Détail du match
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Consultez les informations et gérez cette réservation.
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${
              booking.status ===
              "CANCELLED"
                ? "border-red-500/25 text-red-400"
                : isPast
                  ? "border-white/10 text-white/40"
                  : "border-[#b8f536]/25 text-[#b8f536]"
            }`}
          >
            {booking.status ===
            "CANCELLED"
              ? "Annulée"
              : isPast
                ? "Passée"
                : "Confirmée"}
          </span>
        </section>

        {query.error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="font-semibold text-red-400">
              Opération impossible
            </p>

            <p className="mt-1 text-sm text-red-200/60">
              {query.error}
            </p>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="asdro-card p-5">
            <MapPin className="h-5 w-5 text-[#b8f536]" />

            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-white/35">
              Terrain
            </p>

            <p className="mt-1 text-lg font-semibold">
              {court?.name ??
                "Terrain"}
            </p>
          </div>

          <div className="asdro-card p-5">
            <CalendarDays className="h-5 w-5 text-[#b8f536]" />

            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-white/35">
              Date
            </p>

            <p className="mt-1 text-lg font-semibold capitalize">
              {formatBookingDate(
                start
              )}
            </p>
          </div>

          <div className="asdro-card p-5">
            <Clock3 className="h-5 w-5 text-[#b8f536]" />

            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-white/35">
              Horaire
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatBookingTime(
                start
              )}
              {" – "}
              {formatBookingTime(
                end
              )}
            </p>
          </div>
        </section>

        <section className="asdro-card mt-6 p-5 md:p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <UserRoundCheck className="h-5 w-5 text-[#b8f536]" />

                <h2 className="text-xl font-semibold">
                  Organisateur
                </h2>
              </div>

              <p className="mt-4 text-lg font-semibold">
                {owner
                  ? `${owner.first_name} ${owner.last_name}`
                  : "Adhérent"}
              </p>

              {isOwner ? (
                <p className="mt-1 text-sm text-[#b8f536]">
                  Vous êtes l&apos;organisateur
                </p>
              ) : (
                <p className="mt-1 text-sm text-white/45">
                  Vous participez à cette réservation
                </p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-white/35">
                Type de partie
              </p>

              <p className="mt-1 font-semibold">
                {booking.match_type ===
                "DOUBLES"
                  ? "Double"
                  : "Simple"}
              </p>
            </div>
          </div>
        </section>

        <section className="asdro-card mt-6 p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#b8f536]" />

            <h2 className="text-xl font-semibold">
              Joueurs
            </h2>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {owner && (
              <div className="rounded-xl border border-[#b8f536]/20 bg-[#b8f536]/5 p-4">
                <p className="text-xs text-white/35">
                  Organisateur
                </p>

                <p className="mt-1 font-semibold">
                  {owner.first_name}{" "}
                  {owner.last_name}
                </p>

                {owner.id ===
                  member.id && (
                  <p className="mt-1 text-xs text-[#b8f536]">
                    Vous
                  </p>
                )}
              </div>
            )}

            {participants.map(
              (
                participant,
                index
              ) => {
                const player =
                  Array.isArray(
                    participant.members
                  )
                    ? participant
                        .members[0]
                    : participant
                        .members;

                if (!player) {
                  return null;
                }

                return (
                  <div
                    key={`${participant.member_id}-${index}`}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-xs text-white/35">
                      Joueur{" "}
                      {index + 2}
                    </p>

                    <p className="mt-1 font-semibold">
                      {
                        player.first_name
                      }{" "}
                      {
                        player.last_name
                      }
                    </p>

                    {player.id ===
                      member.id && (
                      <p className="mt-1 text-xs text-[#b8f536]">
                        Vous
                      </p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>

        <section className="asdro-card mt-6 p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-[#b8f536]" />

                <h2 className="text-xl font-semibold">
                  Ajouter au calendrier
                </h2>
              </div>

              <p className="mt-2 text-sm text-white/45">
                Téléchargez l&apos;événement pour l&apos;ajouter à votre calendrier
                sur iPhone, Android, Google Calendar ou Outlook.
              </p>
            </div>

            <a
              href={`/api/bookings/${booking.id}/calendar`}
              className="asdro-button-secondary w-full shrink-0 sm:w-auto"
            >
              <CalendarPlus className="h-4 w-4" />
              Ajouter au calendrier
            </a>
          </div>
        </section>

        <section className="mt-6 pb-12">
          {isOwner &&
          isActive ? (
            <div className="asdro-card p-5 md:p-6">
              <h2 className="text-xl font-semibold">
                Gérer la réservation
              </h2>

              <p className="mt-2 text-sm text-white/45">
                Modifiez les joueurs ou annulez le match.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/mes-reservations/${booking.id}/modifier`}
                  className="asdro-button-secondary flex-1"
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Link>

                <CancelBookingButton
                  bookingId={
                    booking.id
                  }
                  courtName={
                    court?.name ??
                    "Terrain"
                  }
                  dateLabel={
                    formatBookingDate(
                      start
                    )
                  }
                  timeLabel={`${formatBookingTime(
                    start
                  )} – ${formatBookingTime(
                    end
                  )}`}
                />
              </div>
            </div>
          ) : (
            <div className="asdro-card p-5 text-sm text-white/45">
              {isOwner
                ? "Cette réservation n'est plus modifiable."
                : "Seul l'organisateur peut modifier ou annuler cette réservation."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
