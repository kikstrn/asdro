"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import {
  AlertTriangle,
  X,
} from "lucide-react";

import {
  cancelBookingFromDetails,
} from "@/app/mes-reservations/[id]/actions";

type CancelBookingButtonProps = {
  bookingId: string;
  courtName: string;
  dateLabel: string;
  timeLabel: string;
};

export function CancelBookingButton({
  bookingId,
  courtName,
  dateLabel,
  timeLabel,
}: CancelBookingButtonProps) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const canUseDOM =
    typeof document !== "undefined";

  const modal =
    canUseDOM &&
    open
      ? createPortal(
          <div
            className="
              fixed inset-0 z-[9999]
              flex items-end justify-center
              bg-black/70
              backdrop-blur-md

              sm:items-center
              sm:p-6
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setOpen(false);
              }
            }}
          >
            <div
              className="
                w-full
                rounded-t-[28px]
                border border-white/10
                bg-[#07110c]
                p-5
                shadow-[0_24px_80px_rgba(0,0,0,0.60)]

                sm:w-[440px]
                sm:max-w-[calc(100vw-3rem)]
                sm:rounded-3xl
                sm:p-6
              "
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  aria-label="Fermer"
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-xl
                    border border-white/10
                    bg-white/5
                    text-white/50
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h2
                id="cancel-booking-title"
                className="mt-5 text-xl font-bold"
              >
                Annuler cette réservation ?
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Cette action retirera le match de votre espace
                et de celui des autres joueurs.
              </p>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold">
                  {courtName}
                </p>

                <p className="mt-2 text-sm capitalize text-white/55">
                  {dateLabel}
                </p>

                <p className="mt-1 text-sm text-white/55">
                  {timeLabel}
                </p>
              </div>

              <form
                action={
                  cancelBookingFromDetails
                }
                className="
                  mt-6
                  flex flex-col-reverse
                  gap-3

                  sm:grid
                  sm:grid-cols-2
                "
              >
                <input
                  type="hidden"
                  name="bookingId"
                  value={bookingId}
                />

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="asdro-button-secondary w-full"
                >
                  Garder la réservation
                </button>

                <button
                  type="submit"
                  className="
                    flex w-full
                    items-center justify-center
                    rounded-xl
                    bg-red-500
                    px-4 py-3
                    text-sm font-semibold
                    text-white
                    transition
                    hover:bg-red-400
                  "
                >
                  Confirmer l&apos;annulation
                </button>
              </form>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="
          flex flex-1
          items-center justify-center
          rounded-xl
          border border-red-500/25
          px-4 py-3
          text-sm font-semibold
          text-red-400
          transition
          hover:bg-red-500/10
        "
      >
        Annuler la réservation
      </button>

      {modal}
    </>
  );
}