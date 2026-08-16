"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  BookingRemovedRecipient,
  sendBookingUpdatedEmails,
} from "@/lib/booking/booking-notifications";

import { createClient } from "@/lib/supabase/server";
import { syncBookingToCopintes } from "@/lib/copintes/sync-booking";

function one<T>(
  value:
    | T
    | T[]
    | null
    | undefined
) {
  return Array.isArray(value)
    ? value[0] ?? null
    : value ?? null;
}

export async function updateBookingParticipants(
  formData: FormData
) {
  const bookingId =
    String(
      formData.get(
        "bookingId"
      ) ?? ""
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

  if (!bookingId) {
    redirect(
      "/mes-reservations?error=Réservation invalide."
    );
  }

  if (
    matchType !==
      "SINGLES" &&
    matchType !==
      "DOUBLES"
  ) {
    redirect(
      `/mes-reservations/${bookingId}/modifier?error=${encodeURIComponent(
        "Veuillez choisir simple ou double."
      )}`
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
        "Liste invalide"
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
      `/mes-reservations/${bookingId}/modifier?error=${encodeURIComponent(
        "La liste des joueurs est invalide."
      )}`
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
      `/mes-reservations/${bookingId}/modifier?error=${encodeURIComponent(
        matchType ===
        "SINGLES"
          ? "Un simple accepte au maximum un autre joueur."
          : "Un double accepte au maximum trois autres joueurs."
      )}`
    );
  }

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
    data: oldRows,
  } = await supabase
    .from(
      "booking_participants"
    )
    .select(`
      member_id,
      members (
        first_name,
        last_name,
        email
      )
    `)
    .eq(
      "booking_id",
      bookingId
    );

  const nextIds =
    new Set(
      participantIds
    );

  const removedRecipients:
    BookingRemovedRecipient[] =
    [];

  for (
    const row
    of oldRows ?? []
  ) {
    if (
      nextIds.has(
        row.member_id
      )
    ) {
      continue;
    }

    const player =
      one(
        row.members
      );

    if (
      !player?.email
    ) {
      continue;
    }

    removedRecipients.push({
      email:
        player.email,
      name:
        `${player.first_name} ${player.last_name}`,
    });
  }

  const { error } =
    await supabase.rpc(
      "update_booking_participants",
      {
        p_booking_id:
          bookingId,
        p_match_type:
          matchType,
        p_participant_ids:
          participantIds,
      }
    );

  if (error) {
    console.error(
      "Erreur modification réservation :",
      error
    );

    redirect(
      `/mes-reservations/${bookingId}/modifier?error=${encodeURIComponent(
        error.message ||
          "Impossible de modifier cette réservation."
      )}`
    );
  }

  try {
    await sendBookingUpdatedEmails(
      bookingId,
      removedRecipients
    );
  } catch (emailError) {
    console.error(
      "Réservation modifiée mais e-mail non envoyé :",
      emailError
    );
  }

  try {
    await syncBookingToCopintes(
      bookingId
    );
  } catch (syncError) {
    console.error(
      "Réservation modifiée mais synchronisation Les Co'Pintes échouée :",
      syncError
    );
  }

  revalidatePath("/");
  revalidatePath(
    "/mes-reservations"
  );
  revalidatePath(
    `/mes-reservations/${bookingId}`
  );
  revalidatePath(
    `/mes-reservations/${bookingId}/modifier`
  );

  redirect(
    "/mes-reservations?updated=1"
  );
}
