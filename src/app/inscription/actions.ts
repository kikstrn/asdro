"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/serveur";
import { createAdminClient } from "@/lib/supabase/admin";

function redirectWithError(message: string): never {
  redirect(
    "/inscription?error=" +
      encodeURIComponent(message)
  );
}

export async function signup(formData: FormData) {
  const membershipNumber = String(
    formData.get("membershipNumber") ?? ""
  ).trim();

  const email = String(
    formData.get("email") ?? ""
  )
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") ?? ""
  );

  // --------------------------------------------------------
  // Vérification des champs
  // --------------------------------------------------------

  if (!membershipNumber || !email || !password) {
    redirectWithError(
      "Tous les champs sont obligatoires."
    );
  }

  if (password.length < 8) {
    redirectWithError(
      "Le mot de passe doit contenir au moins 8 caractères."
    );
  }

  // --------------------------------------------------------
  // Vérification du numéro d'adhérent
  // --------------------------------------------------------

  const admin = createAdminClient();

  const {
    data: member,
    error: memberError,
  } = await admin
    .from("members")
    .select(
      "id, membership_number, first_name, last_name, user_id, active"
    )
    .eq(
      "membership_number",
      membershipNumber
    )
    .maybeSingle();

  if (memberError) {
    console.error(
      "Erreur vérification adhérent :",
      memberError
    );

    redirectWithError(
      "Impossible de vérifier le numéro d'adhérent."
    );
  }

  if (!member || !member.active) {
    redirectWithError(
      "Numéro d'adhérent invalide ou inactif."
    );
  }

  if (member.user_id) {
    redirectWithError(
      "Un compte est déjà associé à ce numéro d'adhérent."
    );
  }

  // --------------------------------------------------------
  // Détermination de l'URL du site
  // --------------------------------------------------------

  const headerStore = await headers();

  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host");

  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host?.includes("localhost")
      ? "http"
      : "https");

  if (!host) {
    redirectWithError(
      "Impossible de déterminer l'adresse de l'application."
    );
  }

  const origin = `${protocol}://${host}`;

  // --------------------------------------------------------
  // Création du compte Supabase Auth
  // --------------------------------------------------------

  const supabase =
    await createClient();

  const {
    data: authData,
    error: signupError,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        `${origin}/connexion?confirmed=1`,

      data: {
        first_name:
          member.first_name,

        last_name:
          member.last_name,

        membership_number:
          member.membership_number,
      },
    },
  });

  // --------------------------------------------------------
  // Gestion des erreurs Supabase Auth
  // --------------------------------------------------------

  if (signupError) {
    console.error(
      "Erreur Supabase Auth :",
      {
        message:
          signupError.message,
        code:
          signupError.code,
        status:
          signupError.status,
      }
    );

    if (
      signupError.message
        .toLowerCase()
        .includes(
          "email rate limit exceeded"
        )
    ) {
      redirectWithError(
        "Trop d'e-mails de confirmation ont été envoyés récemment. Veuillez patienter quelques minutes avant de réessayer."
      );
    }

    if (
      signupError.message
        .toLowerCase()
        .includes(
          "user already registered"
        )
    ) {
      redirectWithError(
        "Un compte existe déjà avec cette adresse e-mail."
      );
    }

    redirectWithError(
      "Une erreur est survenue lors de la création du compte. Veuillez réessayer."
    );
  }

  if (!authData.user) {
    redirectWithError(
      "Impossible de créer le compte."
    );
  }

  // --------------------------------------------------------
  // Association de auth.users avec members
  // --------------------------------------------------------

  const {
    error: updateError,
  } = await admin
    .from("members")
    .update({
      user_id:
        authData.user.id,

      email,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      member.id
    )
    .is(
      "user_id",
      null
    );

  if (updateError) {
    console.error(
      "Erreur association utilisateur / adhérent :",
      updateError
    );

    // Suppression du compte Auth créé
    // afin de ne pas laisser de compte orphelin.
    await admin.auth.admin.deleteUser(
      authData.user.id
    );

    redirectWithError(
      "Impossible d'associer le compte à votre adhésion. Veuillez réessayer."
    );
  }

  // --------------------------------------------------------
  // Confirmation e-mail
  // --------------------------------------------------------

  redirect(
    "/inscription?emailSent=1&email=" +
      encodeURIComponent(email)
  );
}