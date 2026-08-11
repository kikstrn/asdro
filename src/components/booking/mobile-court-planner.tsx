"use client";

import { useState } from "react";

type Court = {
  id: string;
  name: string;
};

type Slot = {
  start: string;
  end: string;
};

type Booking = {
  id: string;
  court_id: string;
  member_id: string;
  starts_at: string;
  ends_at: string;
};

type Closure = {
  id: string;
  court_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
};

type MobileCourtPlannerProps = {
  courts: Court[];
  slots: Slot[];
  bookings: Booking[];
  closures: Closure[];
  memberId: string;
  requestedDate: string;

  createBookingAction: (
    formData: FormData
  ) => void;

  cancelBookingAction: (
    formData: FormData
  ) => void;

  getSlotUtc: (
    start: string,
    end: string
  ) => {
    start: string;
    end: string;
  };
};

export function MobileCourtPlanner({
  courts,
  slots,
  bookings,
  closures,
  memberId,
  requestedDate,
  createBookingAction,
  cancelBookingAction,
  getSlotUtc,
}: MobileCourtPlannerProps) {
  const [selectedCourtId, setSelectedCourtId] =
    useState(
      courts[0]?.id ?? ""
    );

  const selectedCourt =
    courts.find(
      (court) =>
        court.id ===
        selectedCourtId
    );

  function findBooking(
    courtId: string,
    start: string,
    end: string
  ) {
    const slot =
      getSlotUtc(
        start,
        end
      );

    const slotStart =
      new Date(
        slot.start
      );

    const slotEnd =
      new Date(
        slot.end
      );

    return bookings.find(
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
            slotEnd &&
          bookingEnd >
            slotStart
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
      getSlotUtc(
        start,
        end
      );

    const slotStart =
      new Date(
        slot.start
      );

    const slotEnd =
      new Date(
        slot.end
      );

    return closures.find(
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
            slotEnd &&
          closureEnd >
            slotStart
        );
      }
    );
  }

  if (!selectedCourt) {
    return null;
  }

  return (
    <div className="md:hidden">
      {/* ==================================================== */}
      {/* SÉLECTEUR TERRAIN */}
      {/* ==================================================== */}

      <div className="sticky top-16 z-30 -mx-4 border-y border-white/10 bg-[#07110c]/95 px-4 py-3 backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-2">
          {courts.map(
            (court) => {
              const selected =
                court.id ===
                selectedCourtId;

              return (
                <button
                  key={court.id}
                  type="button"
                  onClick={() =>
                    setSelectedCourtId(
                      court.id
                    )
                  }
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    selected
                      ? "bg-[#b8f536] text-[#07110c]"
                      : "border border-white/10 bg-white/5 text-white/60"
                  }`}
                >
                  {court.name}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* CRÉNEAUX */}
      {/* ==================================================== */}

      <section className="mt-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b8f536]">
            Terrain sélectionné
          </p>

          <h3 className="mt-1 text-xl font-bold">
            {selectedCourt.name}
          </h3>
        </div>

        <div className="space-y-3">
          {slots.map(
            (slot) => {
              const booking =
                findBooking(
                  selectedCourt.id,
                  slot.start,
                  slot.end
                );

              const closure =
                findClosure(
                  selectedCourt.id,
                  slot.start,
                  slot.end
                );

              const isMine =
                booking?.member_id ===
                memberId;

              return (
                <article
                  key={
                    slot.start
                  }
                  className="asdro-card p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold">
                        {slot.start}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {slot.start}
                        {" – "}
                        {slot.end}
                      </p>
                    </div>

                    {closure ? (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/45">
                        Indisponible
                      </span>
                    ) : booking ? (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          isMine
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

                  {/* FERMETURE */}

                  {closure && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold">
                        {closure.title}
                      </p>
                    </div>
                  )}

                  {/* RÉSERVATION */}

                  {!closure &&
                    booking && (
                      <div className="mt-4">
                        {isMine ? (
                          <form
                            action={
                              cancelBookingAction
                            }
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

                  {/* DISPONIBLE */}

                  {!closure &&
                    !booking && (
                      <form
                        action={
                          createBookingAction
                        }
                        className="mt-4"
                      >
                        <input
                          type="hidden"
                          name="courtId"
                          value={
                            selectedCourt.id
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
                          className="asdro-button-primary w-full"
                        >
                          Réserver ce créneau
                        </button>
                      </form>
                    )}
                </article>
              );
            }
          )}
        </div>
      </section>
    </div>
  );
}