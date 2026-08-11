"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function adminUrl(params: Record<string, string>) {
  const search = new URLSearchParams(params);
  return `/admin/adherents?${search.toString()}`;
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
    member,
  };
}

export async function createMember(formData: FormData) {
  const membershipNumber = String(
    formData.get("membershipNumber") ?? ""
  ).trim();

  const firstName = String(
    formData.get("firstName") ?? ""
  ).trim();

  const lastName = String(
    formData.get("lastName") ?? ""
  ).trim();

  if (!membershipNumber || !firstName || !lastName) {
    redirect(
      adminUrl({
        error: "Le numéro d'adhérent, le prénom et le nom sont obligatoires.",
      })
    );
  }

  const { supabase } = await getAdmin();

  const { error } = await supabase
    .from("members")
    .insert({
      membership_number: membershipNumber,
      first_name: firstName,
      last_name: lastName,
      role: "MEMBER",
      active: true,
    });

  if (error) {
    console.error("Erreur création adhérent :", error);

    if (error.code === "23505") {
      redirect(
        adminUrl({
          error: "Ce numéro d'adhérent existe déjà.",
        })
      );
    }

    redirect(
      adminUrl({
        error: "Impossible de créer cet adhérent.",
      })
    );
  }

  revalidatePath("/admin/adherents");

  redirect(
    adminUrl({
      created: "1",
    })
  );
}

export async function toggleMemberActive(
  formData: FormData
) {
  const memberId = String(
    formData.get("memberId") ?? ""
  );

  const active =
    String(formData.get("active") ?? "") === "true";

  if (!memberId) {
    redirect(
      adminUrl({
        error: "Adhérent invalide.",
      })
    );
  }

  const {
    supabase,
    member: currentAdmin,
  } = await getAdmin();

  if (memberId === currentAdmin.id && !active) {
    redirect(
      adminUrl({
        error: "Vous ne pouvez pas désactiver votre propre compte.",
      })
    );
  }

  const { error } = await supabase
    .from("members")
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) {
    console.error("Erreur activation adhérent :", error);

    redirect(
      adminUrl({
        error: "Impossible de modifier cet adhérent.",
      })
    );
  }

  revalidatePath("/admin/adherents");

  redirect(
    adminUrl({
      updated: "1",
    })
  );
}

export async function updateMemberRole(
  formData: FormData
) {
  const memberId = String(
    formData.get("memberId") ?? ""
  );

  const role = String(
    formData.get("role") ?? ""
  );

  if (
    !memberId ||
    !["MEMBER", "ADMIN", "SUPER_ADMIN"].includes(role)
  ) {
    redirect(
      adminUrl({
        error: "Rôle invalide.",
      })
    );
  }

  const {
    supabase,
    member: currentAdmin,
  } = await getAdmin();

  if (
    memberId === currentAdmin.id &&
    role !== "SUPER_ADMIN"
  ) {
    redirect(
      adminUrl({
        error: "Vous ne pouvez pas retirer vos propres droits SUPER_ADMIN.",
      })
    );
  }

  if (
    currentAdmin.role !== "SUPER_ADMIN" &&
    role === "SUPER_ADMIN"
  ) {
    redirect(
      adminUrl({
        error: "Seul un SUPER_ADMIN peut attribuer ce rôle.",
      })
    );
  }

  const { error } = await supabase
    .from("members")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) {
    console.error("Erreur modification rôle :", error);

    redirect(
      adminUrl({
        error: "Impossible de modifier le rôle.",
      })
    );
  }

  revalidatePath("/admin/adherents");

  redirect(
    adminUrl({
      roleUpdated: "1",
    })
  );
}

// ============================================================
// IMPORT CSV DES ADHÉRENTS
// ============================================================

export async function importMembersCsv(
  formData: FormData
) {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    redirect(
      adminUrl({
        error: "Veuillez sélectionner un fichier CSV.",
      })
    );
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    redirect(
      adminUrl({
        error: "Le fichier doit être au format CSV.",
      })
    );
  }

  // Limite volontairement petite :
  // une liste d'adhérents ne devrait pas nécessiter
  // plusieurs mégaoctets.
  if (file.size > 2 * 1024 * 1024) {
    redirect(
      adminUrl({
        error: "Le fichier CSV est trop volumineux.",
      })
    );
  }

  const { supabase } = await getAdmin();

  const content = await file.text();

  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    redirect(
      adminUrl({
        error: "Le fichier CSV est vide ou ne contient aucun adhérent.",
      })
    );
  }

  // ----------------------------------------------------------
  // SÉPARATEUR
  //
  // On accepte :
  // numéro,prénom,nom
  // ou
  // numéro;prénom;nom
  //
  // Excel FR utilise souvent le point-virgule.
  // ----------------------------------------------------------

  const separator =
    lines[0].includes(";")
      ? ";"
      : ",";

  const headers = lines[0]
    .split(separator)
    .map((value) =>
      value
        .trim()
        .toLowerCase()
        .replace(/^"|"$/g, "")
    );

  const membershipIndex =
    headers.indexOf("membership_number");

  const firstNameIndex =
    headers.indexOf("first_name");

  const lastNameIndex =
    headers.indexOf("last_name");

  if (
    membershipIndex === -1 ||
    firstNameIndex === -1 ||
    lastNameIndex === -1
  ) {
    redirect(
      adminUrl({
        error:
          "Le CSV doit contenir les colonnes membership_number, first_name et last_name.",
      })
    );
  }

  const importedMembers: {
    membership_number: string;
    first_name: string;
    last_name: string;
  }[] = [];

  const seenMembershipNumbers =
    new Set<string>();

  // ----------------------------------------------------------
  // LECTURE DES LIGNES
  // ----------------------------------------------------------

  for (
    let index = 1;
    index < lines.length;
    index++
  ) {
    const values = lines[index]
      .split(separator)
      .map((value) =>
        value
          .trim()
          .replace(/^"|"$/g, "")
      );

    const membershipNumber =
      values[membershipIndex]?.trim();

    const firstName =
      values[firstNameIndex]?.trim();

    const lastName =
      values[lastNameIndex]?.trim();

    if (
      !membershipNumber ||
      !firstName ||
      !lastName
    ) {
      redirect(
        adminUrl({
          error:
            `Ligne ${index + 1} invalide : numéro, prénom ou nom manquant.`,
        })
      );
    }

    if (
      seenMembershipNumbers.has(
        membershipNumber
      )
    ) {
      redirect(
        adminUrl({
          error:
            `Le numéro ${membershipNumber} apparaît plusieurs fois dans le fichier.`,
        })
      );
    }

    seenMembershipNumbers.add(
      membershipNumber
    );

    importedMembers.push({
      membership_number:
        membershipNumber,

      first_name:
        firstName,

      last_name:
        lastName,
    });
  }

  if (
    importedMembers.length === 0
  ) {
    redirect(
      adminUrl({
        error:
          "Aucun adhérent valide n'a été trouvé dans le fichier.",
      })
    );
  }

  // ----------------------------------------------------------
  // IMPORT
  //
  // membership_number est UNIQUE dans notre base.
  // Les adhérents déjà présents seront mis à jour.
  // Les nouveaux seront créés.
  //
  // Les champs non présents ici (user_id, email, role...)
  // ne sont pas remplacés.
  // ----------------------------------------------------------

  const { error } =
    await supabase
      .from("members")
      .upsert(
        importedMembers,
        {
          onConflict:
            "membership_number",
        }
      );

  if (error) {
    console.error(
      "Erreur import CSV :",
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
          "Impossible d'importer la liste des adhérents.",
      })
    );
  }

  revalidatePath(
    "/admin/adherents"
  );

  redirect(
    adminUrl({
      imported:
        String(
          importedMembers.length
        ),
    })
  );
}