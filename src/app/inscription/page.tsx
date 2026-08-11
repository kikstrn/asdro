import Link from "next/link";
import Image from "next/image";
import {
  MailCheck,
  UserPlus,
} from "lucide-react";

import { signup } from "./actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    emailSent?: string;
    email?: string;
  }>;
};

export default async function SignupPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const emailSent =
    params.emailSent === "1";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* IDENTITÉ */}

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
          {emailSent ? (
            <>
              {/* EMAIL ENVOYÉ */}

              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
                  <MailCheck className="h-7 w-7" />
                </div>

                <p className="mt-5 text-sm font-medium text-[#b8f536]">
                  Inscription enregistrée
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Vérifiez votre e-mail
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  Un e-mail de confirmation vient de vous être envoyé
                  {params.email ? (
                    <>
                      {" "}à{" "}
                      <span className="font-semibold text-white/80">
                        {params.email}
                      </span>
                    </>
                  ) : null}
                  .
                </p>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  Cliquez sur le lien contenu dans cet e-mail afin de
                  confirmer votre adresse et d&apos;activer votre compte.
                </p>
              </div>

              <div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">
                  Étape suivante
                </p>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Une fois votre adresse confirmée, vous serez redirigé
                  vers la page de connexion.
                </p>
              </div>

              <Link
                href="/connexion"
                className="asdro-button-secondary mt-6 w-full"
              >
                Retour à la connexion
              </Link>
            </>
          ) : (
            <>
              {/* FORMULAIRE */}

              <div>
                <p className="text-sm font-medium text-[#b8f536]">
                  Espace adhérent
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Créer mon compte
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  L&apos;inscription est réservée aux membres de l&apos;ASDRO
                  disposant d&apos;un numéro d&apos;adhérent valide.
                </p>
              </div>

              {params.error && (
                <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <p className="font-semibold text-red-400">
                    Inscription impossible
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-200/60">
                    {params.error}
                  </p>
                </div>
              )}

              <form
                action={signup}
                className="mt-7 space-y-5"
              >
                <div>
                  <label
                    htmlFor="membershipNumber"
                    className="mb-2 block text-sm font-medium"
                  >
                    Numéro d&apos;adhérent
                  </label>

                  <input
                    id="membershipNumber"
                    name="membershipNumber"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Ex : 00125"
                    className="asdro-input"
                  />

                  <p className="mt-2 text-xs leading-5 text-white/35">
                    Utilisez le numéro communiqué par l&apos;association.
                  </p>
                </div>

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
                    minLength={8}
                    required
                    autoComplete="new-password"
                    placeholder="8 caractères minimum"
                    className="asdro-input"
                  />

                  <p className="mt-2 text-xs leading-5 text-white/35">
                    Votre mot de passe doit contenir au moins 8 caractères.
                  </p>
                </div>

                <button
                  type="submit"
                  className="asdro-button-primary w-full"
                >
                  <UserPlus className="h-4 w-4" />
                  Créer mon compte
                </button>
              </form>

              <div className="mt-7 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-white/50">
                  Vous avez déjà un compte ?
                </p>

                <Link
                  href="/connexion"
                  className="mt-3 inline-flex text-sm font-semibold text-[#b8f536] transition hover:opacity-80"
                >
                  Se connecter →
                </Link>
              </div>
            </>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-white/30">
          Accès réservé aux adhérents ASDRO
        </p>
      </div>
    </main>
  );
}