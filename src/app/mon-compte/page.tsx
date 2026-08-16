import { redirect } from "next/navigation";

import {
  KeyRound,
  Mail,
  UserRound,
} from "lucide-react";

import {
  updatePassword,
  updateProfile,
} from "./actions";

import {
  AppHeader,
} from "@/components/navigation/app-header";

import {
  createClient,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    updated?: string;
    emailConfirmation?: string;
    passwordUpdated?: string;
    error?: string;
    passwordError?: string;
  }>;
};

export default async function AccountPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

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
    data: member,
    error,
  } = await supabase
    .from("members")
    .select(`
      id,
      membership_number,
      first_name,
      last_name,
      email,
      role,
      active
    `)
    .eq(
      "user_id",
      user.id
    )
    .single();

  if (
    error ||
    !member ||
    !member.active
  ) {
    redirect("/");
  }

  const isAdmin =
    member.role ===
      "ADMIN" ||
    member.role ===
      "SUPER_ADMIN";

  const currentEmail =
    user.email ??
    member.email ??
    "";

  return (
    <main className="min-h-screen">
      <AppHeader
        firstName={
          member.first_name
        }
        isAdmin={isAdmin}
        backHref="/"
        backLabel="Planning"
      />

      <div className="asdro-container py-6 md:py-10">
        <section>
          <p className="text-sm font-medium text-[#b8f536]">
            Mon espace
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Mon compte
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Modifiez vos informations personnelles et votre mot de passe.
          </p>
        </section>

        {params.updated ===
          "1" && (
          <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            Vos informations ont été mises à jour.
          </div>
        )}

        {params.emailConfirmation ===
          "1" && (
          <div className="mt-4 rounded-2xl border border-[#b8f536]/25 bg-[#b8f536]/5 p-4">
            <p className="font-semibold text-[#b8f536]">
              Confirmation de l&apos;adresse e-mail nécessaire
            </p>

            <p className="mt-1 text-sm leading-6 text-white/55">
              Supabase peut vous demander de confirmer la nouvelle adresse
              e-mail. Consultez votre boîte mail pour terminer le changement.
            </p>
          </div>
        )}

        {params.passwordUpdated ===
          "1" && (
          <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            Votre mot de passe a été modifié.
          </div>
        )}

        {params.error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {params.error}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="asdro-card p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  Informations personnelles
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  Adhérent n° {member.membership_number}
                </p>
              </div>
            </div>

            <form
              action={updateProfile}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-medium"
                >
                  Prénom
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  defaultValue={
                    member.first_name
                  }
                  autoComplete="given-name"
                  className="asdro-input"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-sm font-medium"
                >
                  Nom
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  defaultValue={
                    member.last_name
                  }
                  autoComplete="family-name"
                  className="asdro-input"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 flex items-center gap-2 text-sm font-medium"
                >
                  <Mail className="h-4 w-4 text-white/40" />
                  Adresse e-mail
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={
                    currentEmail
                  }
                  autoComplete="email"
                  className="asdro-input"
                />
              </div>

              <button
                type="submit"
                className="asdro-button-primary w-full sm:w-auto"
              >
                Enregistrer mes informations
              </button>
            </form>
          </section>

          <section className="asdro-card p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                <KeyRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  Mot de passe
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  Choisissez un nouveau mot de passe sécurisé.
                </p>
              </div>
            </div>

            {params.passwordError && (
              <div className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">
                {params.passwordError}
              </div>
            )}

            <form
              action={updatePassword}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Nouveau mot de passe
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="asdro-input"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirmer le mot de passe
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="asdro-input"
                />
              </div>

              <button
                type="submit"
                className="asdro-button-secondary w-full sm:w-auto"
              >
                <KeyRound className="h-4 w-4" />
                Modifier mon mot de passe
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
