"use server";

import { redirect } from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

export async function resetRecoveredPassword(
  formData: FormData
) {
  const password =
    String(
      formData.get("password") ?? ""
    );

  const confirmPassword =
    String(
      formData.get(
        "confirmPassword"
      ) ?? ""
    );

  if (
    password.length < 8
  ) {
    redirect(
      `/reinitialiser-mot-de-passe?error=${encodeURIComponent(
        "Le mot de passe doit contenir au moins 8 caractères."
      )}`
    );
  }

  if (
    password !==
    confirmPassword
  ) {
    redirect(
      `/reinitialiser-mot-de-passe?error=${encodeURIComponent(
        "Les deux mots de passe ne correspondent pas."
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
      `/connexion?authError=${encodeURIComponent(
        "Votre session de réinitialisation a expiré. Demandez un nouveau lien."
      )}`
    );
  }

  const {
    error,
  } =
    await supabase.auth.updateUser(
      {
        password,
      }
    );

  if (error) {
    console.error(
      "Erreur réinitialisation mot de passe :",
      error
    );

    redirect(
      `/reinitialiser-mot-de-passe?error=${encodeURIComponent(
        error.message ||
          "Impossible de modifier votre mot de passe."
      )}`
    );
  }

  redirect(
    "/connexion?passwordReset=1"
  );
}
