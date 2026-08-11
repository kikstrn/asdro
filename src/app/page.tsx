import Link from "next/link";
import { redirect } from "next/navigation";

import {
  cancelBooking,
  createBooking,
} from "@/app/actions/bookings";

import {
  DatePicker,
} from "@/components/booking/date-picker";

import { AppHeader } from "@/components/navigation/app-header";

import {
  formatBookingDate,
  formatBookingTime,
  getDayOfWeek,
  getFormattedDate,
  getNextDate,
  getPreviousDate,
  getTodayDateString,
  isValidDateString,
  localDateTimeToUtc,
} from "@/lib/booking/date";

import { generateSlots } from "@/lib/booking/slots";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    date?: string;
    court?: string;
    bookingSuccess?: string;
    bookingError?: string;
    cancellationSuccess?: string;
  }>;
};

export default async function Home({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  // ==========================================================
  // DATE SÉLECTIONNÉE
  // ==========================================================

  const requestedDate =
    typeof params.date === "string" &&
      isValidDateString(params.date)
      ? params.date
      : getTodayDateString();

  const today =
    getTodayDateString();

  const previousDate =
    getPreviousDate(requestedDate);

  const nextDate =
    getNextDate(requestedDate);

  const dayOfWeek =
    getDayOfWeek(requestedDate);

  // ==========================================================
  // SUPABASE
  // ==========================================================

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // ==========================================================
  // ADHÉRENT
  // ==========================================================

  const {
    data: member,
    error: memberError,
  } = await supabase
    .from("members")
    .select(
      `
      id,
      membership_number,
      first_name,
      last_name,
      role,
      active
      `
    )
    .eq(
      "user_id",
      user.id
    )
    .single();

  if (
    memberError ||
    !member ||
    !member.active
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="asdro-card w-full max-w-md p-8">
          <h1 className="text-2xl font-bold">
            Compte indisponible
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/60">
            Votre compte n&apos;est pas associé
            à un adhérent actif.
          </p>

          <Link
            href="/deconnexion"
            className="asdro-button-secondary mt-6 w-full"
          >
            Se déconnecter
          </Link>
        </div>
      </main>
    );
  }

  const isAdmin =
    member.role === "ADMIN" ||
    member.role === "SUPER_ADMIN";

  // ==========================================================
  // TERRAINS
  // ==========================================================

  const {
    data: courts,
    error: courtsError,
  } = await supabase
    .from("courts")
    .select(
      `
      id,
      name,
      active,
      sort_order
      `
    )
    .eq(
      "active",
      true
    )
    .order("sort_order");

  // ==========================================================
  // TERRAIN SÉLECTIONNÉ SUR MOBILE
  // ==========================================================

  const requestedCourtId =
    typeof params.court === "string"
      ? params.court
      : "";

  const selectedMobileCourt =
    courts?.find(
      (court) =>
        court.id === requestedCourtId
    ) ?? courts?.[0] ?? null;

  function planningUrl(
    date: string,
    courtId?: string
  ) {
    const search = new URLSearchParams({
      date,
    });

    if (courtId) {
      search.set("court", courtId);
    }

    return `/?${search.toString()}`;
  }

  // ==========================================================
  // HORAIRES
  // ==========================================================

  const {
    data: openingHours,
    error: openingHoursError,
  } = await supabase
    .from("opening_hours")
    .select(
      `
      opens_at,
      closes_at,
      active
      `
    )
    .eq(
      "day_of_week",
      dayOfWeek
    )
    .maybeSingle();

  // ==========================================================
  // PARAMÈTRES
  // ==========================================================

  const {
    data: settings,
    error: settingsError,
  } = await supabase
    .from("club_settings")
    .select(
      `
      slot_duration_minutes
      `
    )
    .eq("id", 1)
    .single();

  if (
    courtsError ||
    openingHoursError ||
    settingsError
  ) {
    return (
      <main className="min-h-screen">
        <AppHeader
          firstName={member.first_name}
          isAdmin={isAdmin}
        />

        <div className="asdro-container py-10">
          <div className="asdro-card p-6">
            <p className="font-semibold text-red-400">
              Impossible de charger le planning.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const isClosed =
    !openingHours ||
    !openingHours.active;

  const slots =
    !isClosed && settings
      ? generateSlots({
        opensAt:
          openingHours.opens_at,

        closesAt:
          openingHours.closes_at,

        durationMinutes:
          settings.slot_duration_minutes,
      })
      : [];

  // ==========================================================
  // JOURNÉE
  // ==========================================================

  const dayStart =
    localDateTimeToUtc(
      requestedDate,
      "00:00:00"
    );

  const dayEnd =
    localDateTimeToUtc(
      getNextDate(requestedDate),
      "00:00:00"
    );

  // ==========================================================
  // RÉSERVATIONS DU JOUR
  // ==========================================================

  const {
    data: bookings,
    error: bookingsError,
  } = await supabase
    .from("bookings")
    .select(
      `
      id,
      court_id,
      member_id,
      starts_at,
      ends_at,
      status,
      members (
        first_name,
        last_name
      )
      `
    )
    .eq(
      "status",
      "CONFIRMED"
    )
    .lt(
      "starts_at",
      dayEnd.toISOString()
    )
    .gt(
      "ends_at",
      dayStart.toISOString()
    );

  // ==========================================================
  // FERMETURES
  // ==========================================================

  const {
    data: closures,
    error: closuresError,
  } = await supabase
    .from("closures")
    .select(
      `
      id,
      court_id,
      title,
      reason,
      starts_at,
      ends_at
      `
    )
    .lt(
      "starts_at",
      dayEnd.toISOString()
    )
    .gt(
      "ends_at",
      dayStart.toISOString()
    );

  // ==========================================================
  // MES RÉSERVATIONS
  // ==========================================================

  const {
    data: myBookings,
    error: myBookingsError,
  } = await supabase
    .from("bookings")
    .select(
      `
      id,
      starts_at,
      ends_at,
      status,
      court_id,
      courts (
        name
      )
      `
    )
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
    )
    .order(
      "starts_at",
      {
        ascending: true,
      }
    );

  if (
    bookingsError ||
    closuresError ||
    myBookingsError
  ) {
    return (
      <main className="min-h-screen">
        <AppHeader
          firstName={member.first_name}
          isAdmin={isAdmin}
        />

        <div className="asdro-container py-10">
          <div className="asdro-card p-6">
            <p className="font-semibold text-red-400">
              Impossible de charger les réservations.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  function getSlotDates(
    start: string,
    end: string
  ) {
    return {
      start:
        localDateTimeToUtc(
          requestedDate,
          `${start}:00`
        ),

      end:
        localDateTimeToUtc(
          requestedDate,
          `${end}:00`
        ),
    };
  }

  function findBooking(
    courtId: string,
    start: string,
    end: string
  ) {
    const slot =
      getSlotDates(
        start,
        end
      );

    return bookings?.find(
      (booking) => {
        const bookingStart =
          new Date(
            booking.starts_at
          );

        const bookingEnd =
          new Date(
            booking.ends_at
          );

        return (
          booking.court_id ===
          courtId &&
          bookingStart <
          slot.end &&
          bookingEnd >
          slot.start
        );
      }
    );
  }

  function findClosure(
    courtId: string,
    start: string,
    end: string
  ) {
    const slot =
      getSlotDates(
        start,
        end
      );

    return closures?.find(
      (closure) => {
        const closureStart =
          new Date(
            closure.starts_at
          );

        const closureEnd =
          new Date(
            closure.ends_at
          );

        const appliesToCourt =
          closure.court_id ===
          null ||
          closure.court_id ===
          courtId;

        return (
          appliesToCourt &&
          closureStart <
          slot.end &&
          closureEnd >
          slot.start
        );
      }
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="min-h-screen">
      <AppHeader
        firstName={member.first_name}
        isAdmin={isAdmin}
      />

      <div className="asdro-container py-6 md:py-10">
        {/* ================================================== */}
        {/* HERO */}
        {/* ================================================== */}

        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#b8f536]">
              Espace adhérent
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Réserver un terrain
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Adhérent n° {member.membership_number}
            </p>
          </div>

          {requestedDate !== today && (
            <Link
              href={planningUrl(today, selectedMobileCourt?.id)}
              className="asdro-button-secondary w-full text-sm md:w-auto"
            >
              Aujourd&apos;hui
            </Link>
          )}
        </section>

        {/* ================================================== */}
        {/* NAVIGATION DATE */}
        {/* ================================================== */}

        <section className="asdro-card mt-6 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/?date=${previousDate}`}
              aria-label="Jour précédent"
              className="asdro-button-secondary h-11 w-11 shrink-0 p-0"
            >
              ←
            </Link>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                Planning
              </p>

              <h2 className="mt-1 truncate text-base font-semibold capitalize sm:text-lg md:text-xl">
                {getFormattedDate(
                  requestedDate
                )}
              </h2>

              <div className="mt-3 flex justify-center">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:border-[#b8f536]/30 hover:bg-[#b8f536]/5">
                  <DatePicker
                    value={requestedDate}
                    min={today}
                  />
                </div>
              </div>
            </div>

            <Link
              href={`/?date=${nextDate}`}
              aria-label="Jour suivant"
              className="asdro-button-secondary h-11 w-11 shrink-0 p-0"
            >
              →
            </Link>
          </div>
        </section>

        {/* ================================================== */}
        {/* MESSAGES */}
        {/* ================================================== */}

        {params.bookingSuccess === "1" && (
          <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="font-semibold text-green-400">
              Réservation confirmée
            </p>

            <p className="mt-1 text-sm text-green-200/60">
              Votre terrain a bien été réservé.
            </p>
          </div>
        )}

        {params.cancellationSuccess === "1" && (
          <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="font-semibold text-green-400">
              Réservation annulée
            </p>

            <p className="mt-1 text-sm text-green-200/60">
              Le créneau est de nouveau disponible.
            </p>
          </div>
        )}

        {params.bookingError && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="font-semibold text-red-400">
              Opération impossible
            </p>

            <p className="mt-1 text-sm text-red-200/60">
              {params.bookingError}
            </p>
          </div>
        )}

        {/* ================================================== */}
        {/* PLANNING */}
        {/* ================================================== */}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Disponibilités
              </h2>

              <p className="mt-1 text-sm text-white/45">
                Sélectionnez un créneau disponible.
              </p>
            </div>
          </div>

          {isClosed ? (
            <div className="asdro-card p-8 text-center md:p-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                ×
              </div>

              <p className="mt-4 text-lg font-semibold">
                Club fermé
              </p>

              <p className="mt-2 text-sm text-white/50">
                Aucun créneau n&apos;est disponible ce jour.
              </p>
            </div>
          ) : (
            <>
              {/* ============================================ */}
              {/* MOBILE */}
              {/* ============================================ */}

              <div className="md:hidden">
                {/* SÉLECTEUR DE TERRAIN */}

                <div className="sticky top-16 z-30 -mx-4 border-y border-white/10 bg-[#07110c]/95 px-4 py-3 backdrop-blur-xl">
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(courts?.length ?? 1, 1)}, minmax(0, 1fr))`,
                    }}
                  >
                    {courts?.map((court) => {
                      const selected =
                        court.id === selectedMobileCourt?.id;

                      return (
                        <Link
                          key={court.id}
                          href={planningUrl(requestedDate, court.id)}
                          className={`flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-center text-sm font-semibold transition ${selected
                              ? "bg-[#b8f536] text-[#07110c]"
                              : "border border-white/10 bg-white/5 text-white/60"
                            }`}
                        >
                          {court.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* CRÉNEAUX DU TERRAIN SÉLECTIONNÉ */}

                {selectedMobileCourt && (
                  <div className="mt-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b8f536]">
                        Terrain sélectionné
                      </p>

                      <h3 className="mt-1 text-xl font-bold">
                        {selectedMobileCourt.name}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {slots.map((slot) => {
                        const booking =
                          findBooking(
                            selectedMobileCourt.id,
                            slot.start,
                            slot.end
                          );

                        const closure =
                          findClosure(
                            selectedMobileCourt.id,
                            slot.start,
                            slot.end
                          );

                        const isMine =
                          booking?.member_id === member.id;

                        return (
                          <article
                            key={`${selectedMobileCourt.id}-${slot.start}`}
                            className="asdro-card p-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-lg font-bold">
                                  {slot.start}
                                </p>

                                <p className="mt-1 text-xs text-white/35">
                                  {slot.start} – {slot.end}
                                </p>
                              </div>

                              {closure ? (
                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/45">
                                  Indisponible
                                </span>
                              ) : booking ? (
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${isMine
                                      ? "border-[#b8f536]/30 text-[#b8f536]"
                                      : "border-white/10 text-white/45"
                                    }`}
                                >
                                  {isMine
                                    ? "Ma réservation"
                                    : "Réservé"}
                                </span>
                              ) : (
                                <span className="rounded-full border border-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                                  Disponible
                                </span>
                              )}
                            </div>

                            {closure && (
                              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                                <p className="font-medium">
                                  {closure.title}
                                </p>

                                {closure.reason && (
                                  <p className="mt-1 text-sm text-white/45">
                                    {closure.reason}
                                  </p>
                                )}
                              </div>
                            )}

                            {!closure && booking && (
                              <div className="mt-4">
                                {isMine ? (
                                  <form action={cancelBooking}>
                                    <input
                                      type="hidden"
                                      name="bookingId"
                                      value={booking.id}
                                    />

                                    <input
                                      type="hidden"
                                      name="returnDate"
                                      value={requestedDate}
                                    />

                                    <button
                                      type="submit"
                                      className="w-full rounded-xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                                    >
                                      Annuler ma réservation
                                    </button>
                                  </form>
                                ) : (
                                  <p className="text-sm text-white/40">
                                    Ce créneau est déjà réservé.
                                  </p>
                                )}
                              </div>
                            )}

                            {!closure && !booking && (
                              <form
                                action={createBooking}
                                className="mt-4"
                              >
                                <input
                                  type="hidden"
                                  name="courtId"
                                  value={selectedMobileCourt.id}
                                />

                                <input
                                  type="hidden"
                                  name="date"
                                  value={requestedDate}
                                />

                                <input
                                  type="hidden"
                                  name="start"
                                  value={slot.start}
                                />

                                <input
                                  type="hidden"
                                  name="end"
                                  value={slot.end}
                                />

                                <button
                                  type="submit"
                                  className="asdro-button-primary w-full"
                                >
                                  Réserver ce créneau
                                </button>
                              </form>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================ */}
              {/* DESKTOP */}
              {/* ============================================ */}

              <div className="asdro-card hidden overflow-hidden md:block">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns:
                      `100px repeat(${courts?.length ?? 0}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="border-b border-white/10 bg-white/[0.02]" />

                  {courts?.map(
                    (court) => (
                      <div
                        key={court.id}
                        className="border-b border-l border-white/10 bg-white/[0.02] p-5 text-center"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                          Terrain
                        </p>

                        <p className="mt-1 font-bold">
                          {court.name}
                        </p>
                      </div>
                    )
                  )}

                  {slots.map(
                    (slot) => (
                      <div
                        key={slot.start}
                        className="contents"
                      >
                        <div className="flex items-center justify-center border-b border-white/10 px-3 text-sm font-semibold text-white/50">
                          {slot.start}
                        </div>

                        {courts?.map(
                          (court) => {
                            const booking =
                              findBooking(
                                court.id,
                                slot.start,
                                slot.end
                              );

                            const closure =
                              findClosure(
                                court.id,
                                slot.start,
                                slot.end
                              );

                            const isMine =
                              booking?.member_id ===
                              member.id;

                            return (
                              <div
                                key={`${court.id}-${slot.start}`}
                                className="border-b border-l border-white/10 p-3"
                              >
                                {closure ? (
                                  <div className="flex min-h-24 flex-col justify-center rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-white/35">
                                      Indisponible
                                    </p>

                                    <p className="mt-1 font-medium">
                                      {closure.title}
                                    </p>
                                  </div>
                                ) : booking ? (
                                  <div
                                    className={`flex min-h-24 flex-col justify-center rounded-xl border p-4 ${isMine
                                        ? "border-[#b8f536]/30 bg-[#b8f536]/5"
                                        : "border-white/10 bg-white/5"
                                      }`}
                                  >
                                    <p
                                      className={`text-sm font-semibold ${isMine
                                          ? "text-[#b8f536]"
                                          : "text-white/50"
                                        }`}
                                    >
                                      {isMine
                                        ? "Ma réservation"
                                        : "Réservé"}
                                    </p>

                                    <p className="mt-1 text-xs text-white/35">
                                      {slot.start} – {slot.end}
                                    </p>

                                    {isMine && (
                                      <form
                                        action={cancelBooking}
                                        className="mt-3"
                                      >
                                        <input
                                          type="hidden"
                                          name="bookingId"
                                          value={
                                            booking.id
                                          }
                                        />

                                        <input
                                          type="hidden"
                                          name="returnDate"
                                          value={
                                            requestedDate
                                          }
                                        />

                                        <button
                                          type="submit"
                                          className="text-left text-xs font-semibold text-red-400 hover:underline"
                                        >
                                          Annuler
                                        </button>
                                      </form>
                                    )}
                                  </div>
                                ) : (
                                  <form
                                    action={createBooking}
                                  >
                                    <input
                                      type="hidden"
                                      name="courtId"
                                      value={
                                        court.id
                                      }
                                    />

                                    <input
                                      type="hidden"
                                      name="date"
                                      value={
                                        requestedDate
                                      }
                                    />

                                    <input
                                      type="hidden"
                                      name="start"
                                      value={
                                        slot.start
                                      }
                                    />

                                    <input
                                      type="hidden"
                                      name="end"
                                      value={
                                        slot.end
                                      }
                                    />

                                    <button
                                      type="submit"
                                      className="group flex min-h-24 w-full flex-col justify-center rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-[#b8f536]/40 hover:bg-[#b8f536]/5"
                                    >
                                      <span className="font-semibold transition group-hover:text-[#b8f536]">
                                        Disponible
                                      </span>

                                      <span className="mt-1 text-xs text-white/35">
                                        {slot.start} – {slot.end}
                                      </span>

                                      <span className="mt-3 text-xs font-semibold text-[#b8f536]">
                                        Réserver →
                                      </span>
                                    </button>
                                  </form>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {/* ================================================== */}
        {/* MES RÉSERVATIONS */}
        {/* ================================================== */}

        <section className="mt-12 pb-12">
          <div>
            <p className="text-sm font-medium text-[#b8f536]">
              Mon espace
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Mes prochaines réservations
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Retrouvez et gérez vos créneaux à venir.
            </p>
          </div>

          {!myBookings ||
            myBookings.length === 0 ? (
            <div className="asdro-card mt-5 p-8 text-center">
              <p className="font-medium">
                Aucune réservation à venir
              </p>

              <p className="mt-2 text-sm text-white/45">
                Vos prochaines réservations apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {myBookings.map(
                (booking) => {
                  const start =
                    new Date(
                      booking.starts_at
                    );

                  const end =
                    new Date(
                      booking.ends_at
                    );

                  const courtName =
                    booking.courts?.[0]?.name ??
                    "Terrain";

                  return (
                    <article
                      key={booking.id}
                      className="asdro-card p-5 md:p-6"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b8f536]">
                            {courtName}
                          </p>

                          <h3 className="mt-2 text-lg font-bold capitalize">
                            {formatBookingDate(
                              start
                            )}
                          </h3>

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

                        <form
                          action={cancelBooking}
                        >
                          <input
                            type="hidden"
                            name="bookingId"
                            value={
                              booking.id
                            }
                          />

                          <input
                            type="hidden"
                            name="returnDate"
                            value={
                              requestedDate
                            }
                          />

                          <button
                            type="submit"
                            className="w-full rounded-xl border border-red-500/25 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 sm:w-auto"
                          >
                            Annuler
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}