import Link from "next/link";
import { redirect } from "next/navigation";

import {
    CalendarDays,
    Pencil,
    Users,
} from "lucide-react";

import { AppHeader } from "@/components/navigation/app-header";

import {
    formatBookingDate,
    formatBookingTime,
} from "@/lib/booking/date";

import { createClient } from "@/lib/supabase/server";

export const dynamic =
    "force-dynamic";

export default async function MyBookingsPage() {
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

    // ==========================================================
    // RÉSERVATIONS CRÉÉES PAR MOI
    // ==========================================================

    const {
        data: ownedBookings,
        error: ownedError,
    } = await supabase
        .from("bookings")
        .select(`
      id,
      court_id,
      member_id,
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
        .eq(
            "member_id",
            member.id
        )
        .eq(
            "status",
            "CONFIRMED"
        )
        .gt(
            "ends_at",
            new Date().toISOString()
        );

    // ==========================================================
    // RÉSERVATIONS OÙ JE SUIS PARTICIPANT
    // ==========================================================

    const {
        data: participantRows,
        error: participantError,
    } = await supabase
        .from(
            "booking_participants"
        )
        .select(`
      booking_id,

      bookings (
        id,
        court_id,
        member_id,
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
      )
    `)
        .eq(
            "member_id",
            member.id
        );

    if (
        ownedError ||
        participantError
    ) {
        return (
            <main className="min-h-screen">
                <AppHeader
                    firstName={
                        member.first_name
                    }
                />

                <div className="asdro-container py-10">
                    <div className="asdro-card p-6 text-red-400">
                        Impossible de charger vos réservations.
                    </div>
                </div>
            </main>
        );
    }

    const invitedBookings = [];

    for (
        const row of participantRows ?? []
    ) {
        const booking =
            Array.isArray(row.bookings)
                ? row.bookings[0]
                : row.bookings;

        if (!booking) {
            continue;
        }

        if (
            booking.status !== "CONFIRMED"
        ) {
            continue;
        }

        if (
            new Date(booking.ends_at) <=
            new Date()
        ) {
            continue;
        }

        invitedBookings.push(booking);
    }

    const allBookings = [
        ...(ownedBookings ?? []),
        ...invitedBookings,
    ];

    // Évite les doublons au cas où
    const uniqueBookings =
        Array.from(
            new Map(
                allBookings.map(
                    (booking) => [
                        booking.id,
                        booking,
                    ]
                )
            ).values()
        ).sort(
            (a, b) =>
                new Date(
                    a.starts_at
                ).getTime() -
                new Date(
                    b.starts_at
                ).getTime()
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
            />

            <div className="asdro-container py-6 md:py-10">
                <section>
                    <p className="text-sm font-medium text-[#b8f536]">
                        Mon espace
                    </p>

                    <h1 className="mt-2 text-3xl font-bold">
                        Mes réservations
                    </h1>

                    <p className="mt-2 text-sm text-white/50">
                        Retrouvez les matchs que
                        vous avez créés et ceux
                        auxquels vous participez.
                    </p>
                </section>

                {uniqueBookings.length ===
                    0 ? (
                    <div className="asdro-card mt-8 p-10 text-center">
                        <CalendarDays className="mx-auto h-8 w-8 text-white/25" />

                        <p className="mt-4 font-semibold">
                            Aucune réservation à venir
                        </p>

                        <p className="mt-2 text-sm text-white/45">
                            Vos prochains matchs
                            apparaîtront ici.
                        </p>

                        <Link
                            href="/"
                            className="asdro-button-primary mt-6"
                        >
                            Réserver un terrain
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-5 lg:grid-cols-2">
                        {uniqueBookings.map(
                            (booking) => {
                                const start =
                                    new Date(
                                        booking.starts_at
                                    );

                                const end =
                                    new Date(
                                        booking.ends_at
                                    );

                                const owner =
                                    Array.isArray(
                                        booking.members
                                    )
                                        ? booking
                                            .members[0]
                                        : booking
                                            .members;

                                const court =
                                    Array.isArray(
                                        booking.courts
                                    )
                                        ? booking
                                            .courts[0]
                                        : booking
                                            .courts;

                                const participants =
                                    booking
                                        .booking_participants ??
                                    [];

                                const isOwner =
                                    booking.member_id ===
                                    member.id;

                                return (
                                    <article
                                        key={
                                            booking.id
                                        }
                                        className="asdro-card p-5 md:p-6"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b8f536]">
                                                    {court?.name ??
                                                        "Terrain"}
                                                </p>

                                                <h2 className="mt-2 text-lg font-bold capitalize">
                                                    {formatBookingDate(
                                                        start
                                                    )}
                                                </h2>

                                                <p className="mt-1 text-sm text-white/50">
                                                    {formatBookingTime(
                                                        start
                                                    )}
                                                    {" – "}
                                                    {formatBookingTime(
                                                        end
                                                    )}
                                                </p>
                                            </div>

                                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/60">
                                                {booking.match_type ===
                                                    "DOUBLES"
                                                    ? "Double"
                                                    : "Simple"}
                                            </span>
                                        </div>

                                        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                                                Organisateur
                                            </p>

                                            <p className="mt-1 font-semibold">
                                                {owner
                                                    ? `${owner.first_name} ${owner.last_name}`
                                                    : "Adhérent"}
                                            </p>

                                            {!isOwner && (
                                                <p className="mt-1 text-xs text-[#b8f536]">
                                                    Vous participez à cette réservation
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-5">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-[#b8f536]" />

                                                <p className="text-sm font-semibold">
                                                    Joueurs
                                                </p>
                                            </div>

                                            <div className="mt-3 space-y-2">
                                                {owner && (
                                                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                                                        {owner.first_name}{" "}
                                                        {owner.last_name}
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
                                                                key={`${booking.id}-${participant.member_id}-${index}`}
                                                                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                                                            >
                                                                {
                                                                    player.first_name
                                                                }{" "}
                                                                {
                                                                    player.last_name
                                                                }

                                                                {player.id ===
                                                                    member.id && (
                                                                        <span className="ml-2 text-xs text-[#b8f536]">
                                                                            Vous
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                            {isOwner ? (
                                                <>
                                                    <Link
                                                        href={`/mes-reservations/${booking.id}/modifier`}
                                                        className="asdro-button-secondary flex-1"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Modifier
                                                    </Link>

                                                    <Link
                                                        href={`/mes-reservations/${booking.id}`}
                                                        className="asdro-button-primary flex-1"
                                                    >
                                                        Gérer
                                                    </Link>
                                                </>
                                            ) : (
                                                <Link
                                                    href={`/mes-reservations/${booking.id}`}
                                                    className="asdro-button-secondary w-full"
                                                >
                                                    Voir le match
                                                </Link>
                                            )}
                                        </div>
                                    </article>
                                );
                            }
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}