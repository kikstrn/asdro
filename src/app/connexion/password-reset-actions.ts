"use server";

import {
  createClient,
} from "@/lib/supabase/server";

export type PasswordResetResult = {
  ok: boolean;
  message: string;
};

export async function requestPasswordReset(
  email: string
): Promise<PasswordResetResult> {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  if (
    !normalizedEmail ||
    !normalizedEmail.includes("@")
  ) {
    return {
      ok: false,
      message:
        "Saisissez une adresse e-mail valide.",
    };
  }

  const appUrl =
    (
      process.env
        .NEXT_PUBLIC_APP_URL ??
      ""
    ).replace(
      /\/$/,
      ""
    );

  if (!appUrl) {
    console.error(
      "NEXT_PUBLIC_APP_URL est manquante."
    );

    return {
      ok: false,
      message:
        "La réinitialisation est momentanément indisponible.",
    };
  }

  const supabase =
    await createClient();

  const {
    error,
  } =
    await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo:
          appUrl,
      }
    );

  if (error) {
    console.error(
      "Erreur resetPasswordForEmail :",
      error
    );

    return {
      ok: false,
      message:
        "Impossible d'envoyer l'e-mail de réinitialisation pour le moment.",
    };
  }

  // Message volontairement neutre :
  // on ne révèle pas si l'adresse existe ou non.
  return {
    ok: true,
    message:
      "Si cette adresse correspond à un compte ASDRO, un e-mail de réinitialisation vient d'être envoyé.",
  };
}
