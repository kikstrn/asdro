import {
  redirect,
} from "next/navigation";

import {
  KeyRound,
} from "lucide-react";

import {
  resetRecoveredPassword,
} from "./actions";

import {
  createClient,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ResetPasswordPage({
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
    redirect(
      "/connexion?authError=Le lien de réinitialisation est invalide ou a expiré."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="asdro-card w-full max-w-md p-5 sm:p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
          <KeyRound className="h-5 w-5" />
        </div>

        <h1 className="mt-5 text-2xl font-bold">
          Nouveau mot de passe
        </h1>

        <p className="mt-2 text-sm leading-6 text-white/50">
          Choisissez le nouveau mot de passe de votre compte ASDRO Tennis.
        </p>

        {params.error && (
          <div className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">
            {params.error}
          </div>
        )}

        <form
          action={
            resetRecoveredPassword
          }
          className="mt-6 space-y-5"
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
              required
              minLength={8}
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
              required
              minLength={8}
              autoComplete="new-password"
              className="asdro-input"
            />
          </div>

          <button
            type="submit"
            className="asdro-button-primary w-full"
          >
            Modifier mon mot de passe
          </button>
        </form>
      </section>
    </main>
  );
}
