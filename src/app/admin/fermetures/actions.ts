"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  isValidDateString,
  localDateTimeToUtc,
} from "@/lib/booking/date";

function adminUrl(params: Record<string, string>) {
  const search = new URLSearchParams(params);

  return `/admin/fermetures?${search.toString()}`;
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
    .select("id, role, active")
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
    user,
  };
}

// ============================================================
// TYPES
// ============================================================

type CancelledBooking = {
  booking_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  court_name: string;
  starts_at: string;
  ends_at: string;
};

type CreateClosureResult = {
  closure_id: string;
  title: string;
  reason: string | null;
  cancelled_bookings: CancelledBooking[];
};

// ============================================================
// CRÉER UNE FERMETURE
// ============================================================

export async function createClosure(
  formData: FormData
) {
  const title = String(
    formData.get("title") ?? ""
  ).trim();

  const reason = String(
    formData.get("reason") ?? ""
  ).trim();

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

  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (
    !title ||
    !date ||
    !start ||
    !end ||
    !isValidDateString(date)
  ) {
    redirect(
      adminUrl({
        error:
          "Veuillez renseigner tous les champs obligatoires.",
      })
    );
  }

  const startsAt = localDateTimeToUtc(
    date,
    `${start}:00`
  );

  const endsAt = localDateTimeToUtc(
    date,
    `${end}:00`
  );

  if (endsAt <= startsAt) {
    redirect(
      adminUrl({
        error:
          "L'heure de fin doit être postérieure à l'heure de début.",
      })
    );
  }

  // ==========================================================
  // ADMIN
  // ==========================================================

  const { supabase } = await getAdmin();

  const isAllCourts = courtId === "ALL";

  // ==========================================================
  // CRÉATION DE LA FERMETURE VIA POSTGRESQL
  //
  // Cette fonction :
  // - crée la fermeture
  // - recherche les réservations impactées
  // - annule les réservations impactées
  // - nous retourne les adhérents à prévenir
  // ==========================================================

  const {
    data,
    error,
  } = await supabase.rpc(
    "create_closure",
    {
      p_court_id:
        isAllCourts
          ? null
          : courtId,

      p_all_courts:
        isAllCourts,

      p_title:
        title,

      p_reason:
        reason || "",

      p_starts_at:
        startsAt.toISOString(),

      p_ends_at:
        endsAt.toISOString(),
    }
  );

  // ==========================================================
  // ERREUR CRÉATION
  // ==========================================================

  if (error) {
    console.error(
      "Erreur création fermeture :",
      {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
    );

    redirect(
      adminUrl({
        error:
          error.message ||
          "Impossible de créer cette fermeture.",
      })
    );
  }

  // ==========================================================
  // RÉSULTAT DE LA FONCTION SQL
  // ==========================================================

  const result =
    data as CreateClosureResult | null;

  const cancelledBookings =
    result?.cancelled_bookings ?? [];

  console.log(
    `${cancelledBookings.length} réservation(s) annulée(s) par la fermeture.`
  );

  // ==========================================================
  // ENVOI DES E-MAILS
  // ==========================================================

  for (const booking of cancelledBookings) {
    // Pas d'adresse e-mail → impossible d'envoyer
    if (!booking.email) {
      console.warn(
        "E-mail absent pour la réservation :",
        booking.booking_id
      );

      continue;
    }

    const {
      error: emailError,
    } = await supabase.functions.invoke(
      "send-booking-cancellation-email",
      {
        body: {
          email:
            booking.email,

          firstName:
            booking.first_name || "Adhérent",

          courtName:
            booking.court_name,

          startsAt:
            booking.starts_at,

          endsAt:
            booking.ends_at,

          reason:
            reason || title,
        },
      }
    );

    // --------------------------------------------------------
    // IMPORTANT :
    // Une erreur d'e-mail ne doit pas annuler la fermeture.
    // --------------------------------------------------------

    if (emailError) {
      console.error(
        "Erreur envoi e-mail d'annulation :",
        {
          bookingId:
            booking.booking_id,

          email:
            booking.email,

          error:
            emailError,
        }
      );
    }
  }

  // ==========================================================
  // RAFRAÎCHISSEMENT
  // ==========================================================

  revalidatePath("/");

  revalidatePath(
    "/admin/fermetures"
  );

  // ==========================================================
  // SUCCÈS
  // ==========================================================

  redirect(
    adminUrl({
      success: "1",

      cancelled:
        String(
          cancelledBookings.length
        ),
    })
  );
}

// ============================================================
// SUPPRIMER UNE FERMETURE
// ============================================================

export async function deleteClosure(
  formData: FormData
) {
  const closureId = String(
    formData.get("closureId") ?? ""
  );

  if (!closureId) {
    redirect(
      adminUrl({
        error:
          "Fermeture invalide.",
      })
    );
  }

  // ==========================================================
  // ADMIN
  // ==========================================================

  const {
    supabase,
  } = await getAdmin();

  // ==========================================================
  // SUPPRESSION
  // ==========================================================

  const {
    error,
  } = await supabase
    .from("closures")
    .delete()
    .eq(
      "id",
      closureId
    );

  if (error) {
    console.error(
      "Erreur suppression fermeture :",
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
      adminUrl({
        error:
          "Impossible de supprimer cette fermeture.",
      })
    );
  }

  // ==========================================================
  // RAFRAÎCHISSEMENT
  // ==========================================================

  revalidatePath("/");

  revalidatePath(
    "/admin/fermetures"
  );

  // ==========================================================
  // SUCCÈS
  // ==========================================================

  redirect(
    adminUrl({
      deleted: "1",
    })
  );
}