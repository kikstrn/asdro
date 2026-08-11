"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/serveur";

export async function login(formData: FormData) {
  const email = String(
    formData.get("email") ?? ""
  )
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") ?? ""
  );

  if (!email || !password) {
    redirect(
      "/connexion?error=" +
        encodeURIComponent(
          "Adresse e-mail et mot de passe obligatoires."
        )
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    redirect(
      "/connexion?error=" +
        encodeURIComponent(
          "Adresse e-mail ou mot de passe incorrect."
        )
    );
  }

  redirect("/");
}