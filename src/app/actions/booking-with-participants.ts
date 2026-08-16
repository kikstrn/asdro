"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  sendBookingCreatedEmails,
} from "@/lib/booking/booking-notifications";

import {
  isValidDateString,
  localDateTimeToUtc,
} from "@/lib/booking/date";

import { createClient } from "@/lib/supabase/server";

function planningUrl(
  date: string,
  params: Record<string, string>
) {
  const search =
    new URLSearchParams({
      date,
      ...params,
    });

  return `/?${search.toString()}`;
}

export async function createBookingWithParticipants(
  formData: FormData
) {
  const courtId =
    String(
      formData.get("courtId") ??
        ""
    );

  const date =
    String(
      formData.get("date") ??
        ""
    );

  const start =
    String(
      formData.get("start") ??
        ""
    );

  const end =
    String(
      formData.get("end") ??
        ""
    );

  const matchType =
    String(
      formData.get(
        "matchType"
      ) ?? ""
    );

  const participantIdsRaw =
    String(
      formData.get(
        "participantIds"
      ) ?? "[]"
    );

  if (
    !courtId ||
    !date ||
    !start ||
    !end ||
    !isValidDateString(date)
  ) {
    redirect(
      planningUrl(
        date || "",
        {
          bookingError:
            "Les informations du créneau sont invalides.",
        }
      )
    );
  }

  if (
    matchType !==
      "SINGLES" &&
    matchType !==
      "DOUBLES"
  ) {
    redirect(
      planningUrl(date, {
        bookingError:
          "Veuillez choisir simple ou double.",
      })
    );
  }

  let participantIds:
    string[] = [];

  try {
    const parsed =
      JSON.parse(
        participantIdsRaw
      );

    if (
      !Array.isArray(
        parsed
      )
    ) {
      throw new Error(
        "Invalid participants"
      );
    }

    participantIds =
      parsed
        .map((value) =>
          String(value)
        )
        .filter(Boolean);
  } catch {
    redirect(
      planningUrl(date, {
        bookingError:
          "La liste des joueurs est invalide.",
      })
    );
  }

  const maxParticipants =
    matchType ===
    "SINGLES"
      ? 1
      : 3;

  if (
    participantIds.length >
    maxParticipants
  ) {
    redirect(
      planningUrl(date, {
        bookingError:
          matchType ===
          "SINGLES"
            ? "Un simple accepte au maximum un autre joueur."
            : "Un double accepte au maximum trois autres joueurs.",
      })
    );
  }

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

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/connexion"
    );
  }

  const {
    data: bookingId,
    error,
  } =
    await supabase.rpc(
      "create_booking_with_participants",
      {
        p_court_id:
          courtId,
        p_starts_at:
          startsAt.toISOString(),
        p_ends_at:
          endsAt.toISOString(),
        p_match_type:
          matchType,
        p_participant_ids:
          participantIds,
      }
    );

  if (error) {
    console.error(
      "Erreur création réservation avec joueurs :",
      error
    );

    redirect(
      planningUrl(date, {
        bookingError:
          error.message ||
          "Impossible de créer la réservation.",
      })
    );
  }

  if (bookingId) {
    try {
      await sendBookingCreatedEmails(
        String(
          bookingId
        )
      );
    } catch (emailError) {
      console.error(
        "Réservation créée mais e-mail non envoyé :",
        emailError
      );
    }
  }

  revalidatePath("/");
  revalidatePath(
    "/mes-reservations"
  );

  redirect(
    planningUrl(date, {
      bookingSuccess:
        "1",
    })
  );
}
