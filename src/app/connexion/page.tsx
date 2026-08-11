import Link from "next/link";

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
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-8">
        <h1 className="text-3xl font-bold">
          Connexion
        </h1>

        <p className="mt-2 text-sm opacity-70">
          Accédez à votre espace ASDRO Tennis.
        </p>

        {params.confirmed === "1" && (
          <div className="mt-6 rounded-xl border border-green-500 p-4 text-sm text-green-500">
            <p className="font-semibold">
              Adresse e-mail confirmée !
            </p>

            <p className="mt-2">
              Votre compte est maintenant activé.
              Vous pouvez vous connecter.
            </p>
          </div>
        )}

        {params.error && (
          <div className="mt-6 rounded-lg border border-red-500 p-3 text-sm text-red-500">
            {params.error}
          </div>
        )}

        <form action={login} className="mt-8 space-y-5">
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
              className="w-full rounded-lg border bg-transparent px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-6 text-center text-sm opacity-70">
          Pas encore de compte ?{" "}
          <Link
            href="/inscription"
            className="font-semibold underline"
          >
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}