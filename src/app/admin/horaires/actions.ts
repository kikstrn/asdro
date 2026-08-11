"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function adminUrl(params: Record<string, string>) {
  const search = new URLSearchParams(params);
  return `/admin/horaires?${search.toString()}`;
}

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

  return supabase;
}

// ============================================================
// HORAIRES
// ============================================================

export async function updateOpeningHours(
  formData: FormData
) {
  const supabase = await getAdmin();

  for (let day = 0; day <= 6; day++) {
    const active =
      formData.get(`active-${day}`) === "on";

    const opensAt = String(
      formData.get(`opensAt-${day}`) ?? ""
    );

    const closesAt = String(
      formData.get(`closesAt-${day}`) ?? ""
    );

    if (
      active &&
      (!opensAt || !closesAt)
    ) {
      redirect(
        adminUrl({
          error:
            "Les horaires d'ouverture et de fermeture sont obligatoires pour les jours ouverts.",
        })
      );
    }

    if (
      active &&
      closesAt <= opensAt
    ) {
      redirect(
        adminUrl({
          error:
            "L'heure de fermeture doit être postérieure à l'heure d'ouverture.",
        })
      );
    }

    const { error } = await supabase
      .from("opening_hours")
      .upsert(
        {
          day_of_week: day,
          opens_at:
            opensAt || "09:00",
          closes_at:
            closesAt || "18:00",
          active,
        },
        {
          onConflict:
            "day_of_week",
        }
      );

    if (error) {
      console.error(
        "Erreur horaires :",
        error
      );

      redirect(
        adminUrl({
          error:
            "Impossible d'enregistrer les horaires.",
        })
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/horaires");

  redirect(
    adminUrl({
      hoursSuccess: "1",
    })
  );
}

// ============================================================
// RÈGLES DE RÉSERVATION
// ============================================================

export async function updateBookingSettings(
  formData: FormData
) {
  const supabase = await getAdmin();

  const slotDuration = Number(
    formData.get("slotDuration")
  );

  const bookingDaysAhead = Number(
    formData.get("bookingDaysAhead")
  );

  const maxActiveBookings = Number(
    formData.get("maxActiveBookings")
  );

  const cancellationDeadline = Number(
    formData.get("cancellationDeadline")
  );

  if (
    !Number.isInteger(slotDuration) ||
    slotDuration < 15 ||
    slotDuration > 180
  ) {
    redirect(
      adminUrl({
        error:
          "La durée des créneaux doit être comprise entre 15 et 180 minutes.",
      })
    );
  }

  if (
    !Number.isInteger(bookingDaysAhead) ||
    bookingDaysAhead < 0 ||
    bookingDaysAhead > 365
  ) {
    redirect(
      adminUrl({
        error:
          "Le nombre de jours de réservation à l'avance est invalide.",
      })
    );
  }

  if (
    !Number.isInteger(maxActiveBookings) ||
    maxActiveBookings < 1 ||
    maxActiveBookings > 50
  ) {
    redirect(
      adminUrl({
        error:
          "Le nombre maximum de réservations est invalide.",
      })
    );
  }

  if (
    !Number.isInteger(cancellationDeadline) ||
    cancellationDeadline < 0
  ) {
    redirect(
      adminUrl({
        error:
          "Le délai d'annulation est invalide.",
      })
    );
  }

  const { error } = await supabase
    .from("club_settings")
    .update({
      slot_duration_minutes:
        slotDuration,

      booking_days_ahead:
        bookingDaysAhead,

      max_active_bookings:
        maxActiveBookings,

      cancellation_deadline_minutes:
        cancellationDeadline,

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error(
      "Erreur paramètres :",
      error
    );

    redirect(
      adminUrl({
        error:
          "Impossible d'enregistrer les règles de réservation.",
      })
    );
  }

  revalidatePath("/");
  revalidatePath("/admin/horaires");

  redirect(
    adminUrl({
      settingsSuccess: "1",
    })
  );
}