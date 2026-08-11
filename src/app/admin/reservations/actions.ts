"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// ============================================================
// URL
// ============================================================

function reservationsUrl(
  params: Record<string, string>
) {
  const search = new URLSearchParams(params);

  return `/admin/reservations?${search.toString()}`;
}

// ============================================================
// VÉRIFICATION ADMIN
// ============================================================

async function getAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: member } = await supabase
    .from("members")
    .select(
      `
      id,
      role,
      active
      `
    )
    .eq("user_id", user.id)
    .single();

  if (
    !member ||
    !member.active ||
    !["ADMIN", "SUPER_ADMIN"].includes(member.role)
  ) {
    redirect("/");
  }

  return {
    supabase,
    member,
  };
}

// ============================================================
// ANNULATION ADMINISTRATIVE
// ============================================================

export async function cancelBookingByAdmin(
  formData: FormData
) {
  const bookingId = String(
    formData.get("bookingId") ?? ""
  );

  const reason = String(
    formData.get("reason") ??
      "Annulation par l'administration du club"
  ).trim();

  if (!bookingId) {
    redirect(
      reservationsUrl({
        error:
          "Réservation invalide.",
      })
    );
  }

  const {
    supabase,
  } = await getAdmin();

  // ----------------------------------------------------------
  // RÉCUPÉRATION DE LA RÉSERVATION
  // ----------------------------------------------------------

  const {
    data: booking,
    error: bookingError,
  } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      starts_at,
      ends_at,
      member_id,
      courts (
        name
      ),
      members (
        first_name,
        last_name,
        email
      )
      `
    )
    .eq(
      "id",
      bookingId
    )
    .single();

  if (
    bookingError ||
    !booking
  ) {
    console.error(
      "Réservation introuvable :",
      bookingError
    );

    redirect(
      reservationsUrl({
        error:
          "Réservation introuvable.",
      })
    );
  }

  if (
    booking.status !== "CONFIRMED"
  ) {
    redirect(
      reservationsUrl({
        error:
          "Cette réservation est déjà annulée.",
      })
    );
  }

  // ----------------------------------------------------------
  // ANNULATION
  // ----------------------------------------------------------

  const {
    error: updateError,
  } = await supabase
    .from("bookings")
    .update({
      status:
        "CANCELLED",

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      bookingId
    );

  if (updateError) {
    console.error(
      "Erreur annulation réservation :",
      updateError
    );

    redirect(
      reservationsUrl({
        error:
          "Impossible d'annuler cette réservation.",
      })
    );
  }

  // ----------------------------------------------------------
  // INFORMATIONS POUR L'E-MAIL
  // ----------------------------------------------------------

  const member =
    booking.members?.[0];

  const court =
    booking.courts?.[0];

  // ----------------------------------------------------------
  // ENVOI DE L'E-MAIL
  //
  // Une erreur Brevo ne remet pas en cause l'annulation.
  // ----------------------------------------------------------

  if (
    member?.email &&
    court?.name
  ) {
    const {
      error: emailError,
    } =
      await supabase.functions.invoke(
        "send-booking-cancellation-email",
        {
          body: {
            email:
              member.email,

            firstName:
              member.first_name ||
              "Adhérent",

            courtName:
              court.name,

            startsAt:
              booking.starts_at,

            endsAt:
              booking.ends_at,

            reason:
              reason ||
              "Annulation par l'administration du club",
          },
        }
      );

    if (emailError) {
      console.error(
        "Erreur e-mail annulation administrative :",
        {
          bookingId,
          email:
            member.email,
          error:
            emailError,
        }
      );
    }
  }

  // ----------------------------------------------------------
  // RAFRAÎCHISSEMENT
  // ----------------------------------------------------------

  revalidatePath("/");
  revalidatePath(
    "/admin/reservations"
  );

  redirect(
    reservationsUrl({
      cancelled: "1",
    })
  );
}