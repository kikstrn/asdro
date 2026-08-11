import Link from "next/link";
import Image from "next/image";
import {
  LogIn,
  MailCheck,
} from "lucide-react";

import { login } from "./actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    confirmed?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* LOGO / IDENTITÉ */}

        <div className="mb-8 text-center">
          <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-2xl">
            <Image
              src="/icons/icon-192.png"
              alt="ASDRO Tennis"
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            ASDRO Tennis
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Réservation des terrains du club
          </p>
        </div>

        {/* CARTE */}

        <section className="asdro-card p-6 sm:p-8">
          <div>
            <p className="text-sm font-medium text-[#b8f536]">
              Espace adhérent
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Connexion
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Connectez-vous pour réserver un terrain
              et gérer vos créneaux.
            </p>
          </div>

          {/* CONFIRMATION EMAIL */}

          {params.confirmed === "1" && (
            <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <div className="flex items-start gap-3">
                <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />

                <div>
                  <p className="font-semibold text-green-400">
                    Adresse e-mail confirmée
                  </p>

                  <p className="mt-1 text-sm leading-6 text-green-200/60">
                    Votre compte est maintenant activé.
                    Vous pouvez vous connecter.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ERREUR */}

          {params.error && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="font-semibold text-red-400">
                Connexion impossible
              </p>

              <p className="mt-1 text-sm leading-6 text-red-200/60">
                {params.error}
              </p>
            </div>
          )}

          {/* FORMULAIRE */}

          <form
            action={login}
            className="mt-7 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Adresse e-mail
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nom@exemple.fr"
                className="asdro-input"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Mot de passe
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                className="asdro-input"
              />
            </div>

            <button
              type="submit"
              className="asdro-button-primary w-full"
            >
              <LogIn className="h-4 w-4" />
              Se connecter
            </button>
          </form>

          {/* INSCRIPTION */}

          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-white/50">
              Pas encore de compte ?
            </p>

            <Link
              href="/inscription"
              className="mt-3 inline-flex text-sm font-semibold text-[#b8f536] transition hover:opacity-80"
            >
              Créer mon compte adhérent →
            </Link>
          </div>
        </section>

        {/* FOOTER */}

        <p className="mt-6 text-center text-xs text-white/30">
          Accès réservé aux adhérents ASDRO
        </p>
      </div>
    </main>
  );
}