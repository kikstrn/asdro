"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function accountUrl(
  params: Record<string, string>
) {
  const search =
    new URLSearchParams(params);

  return `/mon-compte?${search.toString()}`;
}

export async function updateProfile(
  formData: FormData
) {
  const firstName =
    String(
      formData.get("firstName") ?? ""
    ).trim();

  const lastName =
    String(
      formData.get("lastName") ?? ""
    ).trim();

  const email =
    String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

  if (
    firstName.length < 2 ||
    lastName.length < 2
  ) {
    redirect(
      accountUrl({
        error:
          "Le prénom et le nom doivent contenir au moins 2 caractères.",
      })
    );
  }

  if (
    !email ||
    !email.includes("@")
  ) {
    redirect(
      accountUrl({
        error:
          "L'adresse e-mail est invalide.",
      })
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const {
    error: profileError,
  } = await supabase.rpc(
    "update_my_profile",
    {
      p_first_name:
        firstName,
      p_last_name:
        lastName,
    }
  );

  if (profileError) {
    console.error(
      "Erreur mise à jour profil :",
      profileError
    );

    redirect(
      accountUrl({
        error:
          profileError.message ||
          "Impossible de modifier votre profil.",
      })
    );
  }

  const currentEmail =
    user.email
      ?.trim()
      .toLowerCase() ?? "";

  let emailChangeRequested =
    false;

  if (
    email !==
    currentEmail
  ) {
    const {
      error: emailError,
    } =
      await supabase.auth.updateUser(
        {
          email,
        }
      );

    if (emailError) {
      console.error(
        "Erreur modification e-mail :",
        emailError
      );

      redirect(
        accountUrl({
          error:
            emailError.message ||
            "Impossible de modifier votre adresse e-mail.",
        })
      );
    }

    emailChangeRequested =
      true;
  }

  revalidatePath("/");
  revalidatePath(
    "/mon-compte"
  );
  revalidatePath(
    "/mes-reservations"
  );

  redirect(
    accountUrl({
      updated: "1",
      ...(emailChangeRequested
        ? {
            emailConfirmation:
              "1",
          }
        : {}),
    })
  );
}

export async function updatePassword(
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
      accountUrl({
        passwordError:
          "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      })
    );
  }

  if (
    password !==
    confirmPassword
  ) {
    redirect(
      accountUrl({
        passwordError:
          "Les deux mots de passe ne correspondent pas.",
      })
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
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
      "Erreur modification mot de passe :",
      error
    );

    redirect(
      accountUrl({
        passwordError:
          error.message ||
          "Impossible de modifier votre mot de passe.",
      })
    );
  }

  redirect(
    accountUrl({
      passwordUpdated:
        "1",
    })
  );
}
