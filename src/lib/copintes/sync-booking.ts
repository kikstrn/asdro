"use server";

import { createClient } from "@/lib/supabase/server";

type BookingSyncSnapshot = {
  id: string;
  member_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  match_type: string | null;
  courts:
  | { name: string }[]
  | { name: string }
  | null;
  booking_participants:
  | {
    member_id: string;
  }[]
  | null;
};

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

export async function syncBookingToCopintes(
  bookingId: string,
) {
  const syncUrl =
    process.env.COPINTES_SYNC_URL;

  const syncSecret =
    process.env.COPINTES_SYNC_SECRET;

  /*
   * La réservation ASDRO reste valide même si la synchronisation
   * Les Co'Pintes n'est pas configurée.
   */
  if (!syncUrl || !syncSecret) {
    console.warn(
      "[Co'Pintes sync] COPINTES_SYNC_URL ou COPINTES_SYNC_SECRET absent.",
    );

    return {
      ok: false,
      skipped: true,
    };
  }

  const supabase =
    await createClient();

  const {
    data,
    error,
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
        member_id
      )
    `)
    .eq("id", bookingId)
    .single();

  if (error || !data) {
    throw new Error(
      `Impossible de charger la réservation ${bookingId} pour la synchronisation.`,
    );
  }

  const booking =
    data as BookingSyncSnapshot;

  const court =
    one(booking.courts);

  const participantIds =
    Array.from(
      new Set(
        (
          booking
            .booking_participants ??
          []
        )
          .map(
            (participant) =>
              participant.member_id,
          )
          .filter(Boolean),
      ),
    );

  const payload = {
    provider: "asdro",
    externalBookingId:
      booking.id,
    organizerExternalMemberId:
      booking.member_id,
    participantExternalMemberIds:
      participantIds,
    startsAt:
      booking.starts_at,
    endsAt:
      booking.ends_at,
    status:
      booking.status,
    matchType:
      booking.match_type,
    courtName:
      court?.name ??
      "Terrain ASDRO",
  };

  const response =
    await fetch(
      syncUrl,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",

          "x-asdro-sync-secret":
            syncSecret,
        },
        body:
          JSON.stringify(
            payload,
          ),
        cache: "no-store",
      },
    );

  const body: unknown =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    const errorMessage =
      body &&
        typeof body === "object" &&
        "error" in body &&
        typeof body.error === "string"
        ? body.error
        : `Synchronisation Les Co'Pintes impossible (${response.status}).`;

    throw new Error(errorMessage);
  }

  return body;
}
