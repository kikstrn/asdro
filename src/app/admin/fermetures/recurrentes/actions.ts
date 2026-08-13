"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function pageUrl(params: Record<string, string>) {
  const search = new URLSearchParams(params);

  return `/admin/fermetures/recurrentes?${search.toString()}`;
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

  return {
    supabase,
    user,
  };
}

// ============================================================
// CRÉER
// ============================================================

export async function createRecurringClosure(
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

  const dayOfWeek = Number(
    formData.get("dayOfWeek")
  );

  const startsOn = String(
    formData.get("startsOn") ?? ""
  );

  const endsOn = String(
    formData.get("endsOn") ?? ""
  );

  const startsAt = String(
    formData.get("startsAt") ?? ""
  );

  const endsAt = String(
    formData.get("endsAt") ?? ""
  );

  if (
    !title ||
    !courtId ||
    !startsOn ||
    !endsOn ||
    !startsAt ||
    !endsAt ||
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6
  ) {
    redirect(
      pageUrl({
        error:
          "Veuillez renseigner tous les champs obligatoires.",
      })
    );
  }

  if (endsOn < startsOn) {
    redirect(
      pageUrl({
        error:
          "La date de fin doit être postérieure à la date de début.",
      })
    );
  }

  if (endsAt <= startsAt) {
    redirect(
      pageUrl({
        error:
          "L'heure de fin doit être postérieure à l'heure de début.",
      })
    );
  }

  const {
    supabase,
    user,
  } = await getAdmin();

  const { error } = await supabase
    .from("recurring_closures")
    .insert({
      title,

      reason:
        reason || null,

      court_id:
        courtId === "ALL"
          ? null
          : courtId,

      day_of_week:
        dayOfWeek,

      starts_on:
        startsOn,

      ends_on:
        endsOn,

      starts_at:
        startsAt,

      ends_at:
        endsAt,

      active: true,

      created_by:
        user.id,
    });

  if (error) {
    console.error(
      "Erreur création créneau récurrent :",
      error
    );

    redirect(
      pageUrl({
        error:
          "Impossible de créer ce créneau récurrent.",
      })
    );
  }

  revalidatePath("/");
  revalidatePath(
    "/admin/fermetures"
  );
  revalidatePath(
    "/admin/fermetures/recurrentes"
  );

  redirect(
    pageUrl({
      success: "1",
    })
  );
}

// ============================================================
// ACTIVER / DÉSACTIVER
// ============================================================

export async function toggleRecurringClosure(
  formData: FormData
) {
  const id = String(
    formData.get("id") ?? ""
  );

  const active =
    String(
      formData.get("active") ?? ""
    ) === "true";

  if (!id) {
    redirect(
      pageUrl({
        error:
          "Créneau récurrent invalide.",
      })
    );
  }

  const { supabase } =
    await getAdmin();

  const { error } = await supabase
    .from("recurring_closures")
    .update({
      active: !active,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(
      "Erreur modification créneau récurrent :",
      error
    );

    redirect(
      pageUrl({
        error:
          "Impossible de modifier ce créneau.",
      })
    );
  }

  revalidatePath("/");
  revalidatePath(
    "/admin/fermetures/recurrentes"
  );

  redirect(
    pageUrl({
      updated: "1",
    })
  );
}

// ============================================================
// SUPPRIMER
// ============================================================

export async function deleteRecurringClosure(
  formData: FormData
) {
  const id = String(
    formData.get("id") ?? ""
  );

  if (!id) {
    redirect(
      pageUrl({
        error:
          "Créneau récurrent invalide.",
      })
    );
  }

  const { supabase } =
    await getAdmin();

  const { error } = await supabase
    .from("recurring_closures")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Erreur suppression créneau récurrent :",
      error
    );

    redirect(
      pageUrl({
        error:
          "Impossible de supprimer ce créneau.",
      })
    );
  }

  revalidatePath("/");
  revalidatePath(
    "/admin/fermetures/recurrentes"
  );

  redirect(
    pageUrl({
      deleted: "1",
    })
  );
}