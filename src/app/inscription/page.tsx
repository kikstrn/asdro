import Link from "next/link";

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

  const emailSent = params.emailSent === "1";

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-8">
        <h1 className="text-3xl font-bold">
          {emailSent
            ? "Vérifiez votre e-mail"
            : "Créer mon compte"}
        </h1>

        {!emailSent && (
          <p className="mt-2 text-sm opacity-70">
            Inscription réservée aux adhérents ASDRO.
          </p>
        )}

        {emailSent && (
          <div className="mt-6 rounded-xl border border-green-500 p-5">
            <p className="font-semibold text-green-500">
              Votre compte a bien été créé.
            </p>

            <p className="mt-3 text-sm leading-6 opacity-80">
              Un e-mail de confirmation vient de vous être envoyé
              {params.email ? (
                <>
                  {" "}à{" "}
                  <span className="font-semibold">
                    {params.email}
                  </span>
                </>
              ) : null}
              .
            </p>

            <p className="mt-3 text-sm leading-6 opacity-80">
              Cliquez sur le lien contenu dans cet e-mail afin de
              confirmer votre adresse.
            </p>

            <p className="mt-3 text-sm leading-6 opacity-80">
              Une fois votre adresse confirmée, vous serez
              automatiquement redirigé vers la page de connexion.
            </p>
          </div>
        )}

        {!emailSent && params.error && (
          <div className="mt-6 rounded-lg border border-red-500 p-3 text-sm text-red-500">
            {params.error}
          </div>
        )}

        {!emailSent && (
          <form action={signup} className="mt-8 space-y-5">
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
                className="w-full rounded-lg border bg-transparent px-4 py-3"
                placeholder="Ex : 00125"
              />
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
                className="w-full rounded-lg border bg-transparent px-4 py-3"
                placeholder="nom@exemple.fr"
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
                className="w-full rounded-lg border bg-transparent px-4 py-3"
                placeholder="8 caractères minimum"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black"
            >
              Créer mon compte
            </button>
          </form>
        )}

        {!emailSent && (
          <p className="mt-6 text-center text-sm opacity-70">
            Déjà inscrit ?{" "}
            <Link
              href="/connexion"
              className="font-semibold underline"
            >
              Se connecter
            </Link>
          </p>
        )}

        {emailSent && (
          <div className="mt-6 text-center">
            <Link
              href="/connexion"
              className="text-sm font-semibold underline opacity-70"
            >
              Retour à la connexion
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}