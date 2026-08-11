"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  isValidDateString,
  localDateTimeToUtc,
} from "@/lib/booking/date";

// ============================================================
// HELPERS
// ============================================================

function bookingUrl(
  date: string,
  params: Record<string, string>
) {
  const search = new URLSearchParams({
    ...(date ? { date } : {}),
    ...params,
  });

  return `/?${search.toString()}`;
}

// ============================================================
// CRÉER UNE RÉSERVATION
// ============================================================

export async function createBooking(
  formData: FormData
) {
  const courtId = String(
    formData.get("courtId") ?? ""
  );

  const date = String(
    formData.get("date") ?? ""
  );

  const start = String(
    formData.get("start") ?? ""
  );

  const end = String(
    formData.get("end") ?? ""
  );

  // --------------------------------------------------------
  // Validation
  // --------------------------------------------------------

  if (
    !courtId ||
    !date ||
    !start ||
    !end ||
    !isValidDateString(date)
  ) {
    redirect(
      bookingUrl(
        isValidDateString(date)
          ? date
          : "",
        {
          bookingError:
            "Créneau invalide.",
        }
      )
    );
  }

  // --------------------------------------------------------
  // Conversion Europe/Paris → UTC
  // --------------------------------------------------------

  const startsAt =
    localDateTimeToUtc(
      date,
      `${start}:00`
    );

  const endsAt =
    localDateTimeToUtc(
      date,
      `${end}:00`
    );

  // --------------------------------------------------------
  // Auth
  // --------------------------------------------------------

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // --------------------------------------------------------
  // Fonction PostgreSQL
  // --------------------------------------------------------

  const { error } =
    await supabase.rpc(
      "create_booking",
      {
        p_court_id:
          courtId,

        p_starts_at:
          startsAt.toISOString(),

        p_ends_at:
          endsAt.toISOString(),
      }
    );

  if (error) {
    console.error(
      "Erreur réservation :",
      {
        message:
          error.message,

        code:
          error.code,

        details:
          error.details,

        hint:
          error.hint,
      }
    );

    redirect(
      bookingUrl(
        date,
        {
          bookingError:
            error.message ||
            "Impossible de créer la réservation.",
        }
      )
    );
  }

  redirect(
    bookingUrl(
      date,
      {
        bookingSuccess:
          "1",
      }
    )
  );
}

// ============================================================
// ANNULER UNE RÉSERVATION
// ============================================================

export async function cancelBooking(
  formData: FormData
) {
  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const returnDate = String(
    formData.get("returnDate") ?? ""
  );

  if (!bookingId) {
    redirect(
      bookingUrl(
        returnDate,
        {
          bookingError:
            "Réservation invalide.",
        }
      )
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { error } =
    await supabase.rpc(
      "cancel_booking",
      {
        p_booking_id:
          bookingId,
      }
    );

  if (error) {
    console.error(
      "Erreur annulation :",
      {
        message:
          error.message,

        code:
          error.code,

        details:
          error.details,
      }
    );

    redirect(
      bookingUrl(
        returnDate,
        {
          bookingError:
            error.message ||
            "Impossible d'annuler cette réservation.",
        }
      )
    );
  }

  redirect(
    bookingUrl(
      returnDate,
      {
        cancellationSuccess:
          "1",
      }
    )
  );
}