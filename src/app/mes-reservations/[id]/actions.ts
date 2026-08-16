"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  sendBookingCancelledEmails,
} from "@/lib/booking/booking-notifications";

import { createClient } from "@/lib/supabase/server";

export async function cancelBookingFromDetails(
  formData: FormData
) {
  const bookingId =
    String(
      formData.get(
        "bookingId"
      ) ?? ""
    );

  if (!bookingId) {
    redirect(
      "/mes-reservations?error=Réservation invalide."
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
    data: member,
  } = await supabase
    .from("members")
    .select(
      "id, active"
    )
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
      status
    `)
    .eq(
      "id",
      bookingId
    )
    .single();

  if (
    bookingError ||
    !booking
  ) {
    redirect(
      "/mes-reservations?error=Réservation introuvable."
    );
  }

  if (
    booking.member_id !==
    member.id
  ) {
    redirect(
      `/mes-reservations/${bookingId}?error=${encodeURIComponent(
        "Seul l'organisateur peut annuler cette réservation."
      )}`
    );
  }

  if (
    booking.status !==
    "CONFIRMED"
  ) {
    redirect(
      `/mes-reservations/${bookingId}?error=${encodeURIComponent(
        "Cette réservation n'est plus active."
      )}`
    );
  }

  if (
    new Date(
      booking.starts_at
    ) <= new Date()
  ) {
    redirect(
      `/mes-reservations/${bookingId}?error=${encodeURIComponent(
        "Impossible d'annuler une réservation déjà commencée."
      )}`
    );
  }

  const { error } =
    await supabase
      .from("bookings")
      .update({
        status:
          "CANCELLED",
      })
      .eq(
        "id",
        bookingId
      );

  if (error) {
    console.error(
      "Erreur annulation réservation :",
      error
    );

    redirect(
      `/mes-reservations/${bookingId}?error=${encodeURIComponent(
        "Impossible d'annuler cette réservation."
      )}`
    );
  }

  try {
    await sendBookingCancelledEmails(
      bookingId
    );
  } catch (emailError) {
    console.error(
      "Réservation annulée mais e-mail non envoyé :",
      emailError
    );
  }

  revalidatePath("/");
  revalidatePath(
    "/mes-reservations"
  );
  revalidatePath(
    `/mes-reservations/${bookingId}`
  );

  redirect(
    "/mes-reservations?cancelled=1"
  );
}
