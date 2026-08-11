import { redirect } from "next/navigation";

import {
  createClosure,
  deleteClosure,
} from "./actions";

import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/navigation/app-header";

import {
  formatBookingDate,
  formatBookingTime,
  getTodayDateString,
} from "@/lib/booking/date";

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    success?: string;
    deleted?: string;
    error?: string;
  }>;
};

export default async function ClosuresPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const supabase =
    await createClient();

  // ==========================================================
  // AUTHENTIFICATION
  // ==========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // ==========================================================
  // ADMIN
  // ==========================================================

  const {
    data: member,
  } = await supabase
    .from("members")
    .select(
      `
      first_name,
      last_name,
      role,
      active
      `
    )
    .eq(
      "user_id",
      user.id
    )
    .single();

  if (
    !member ||
    !member.active ||
    ![
      "ADMIN",
      "SUPER_ADMIN",
    ].includes(member.role)
  ) {
    redirect("/");
  }

  // ==========================================================
  // TERRAINS
  // ==========================================================

  const {
    data: courts,
  } = await supabase
    .from("courts")
    .select(
      `
      id,
      name,
      sort_order
      `
    )
    .eq(
      "active",
      true
    )
    .order("sort_order");

  // ==========================================================
  // FERMETURES
  // ==========================================================

  const {
    data: closures,
    error: closuresError,
  } = await supabase
    .from("closures")
    .select(
      `
      id,
      court_id,
      title,
      reason,
      starts_at,
      ends_at,
      created_at,
      courts (
        name
      )
      `
    )
    .gte(
      "ends_at",
      new Date().toISOString()
    )
    .order(
      "starts_at",
      {
        ascending: true,
      }
    );

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}

      <AppHeader
        firstName={member.first_name}
        backHref="/admin"
        backLabel="Administration"
      />

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* MESSAGES */}

        {params.success ===
          "1" && (
            <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
              <p className="font-semibold text-green-400">
                Fermeture enregistrée
              </p>

              <p className="mt-1 text-sm text-green-300/70">
                Les créneaux concernés
                sont maintenant
                indisponibles.
              </p>
            </div>
          )}

        {params.deleted ===
          "1" && (
            <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
              <p className="font-semibold text-green-400">
                Fermeture supprimée
              </p>

              <p className="mt-1 text-sm text-green-300/70">
                Les créneaux concernés
                sont de nouveau
                disponibles.
              </p>
            </div>
          )}

        {params.error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
            <p className="font-semibold text-red-400">
              Opération impossible
            </p>

            <p className="mt-1 text-sm text-red-300/70">
              {params.error}
            </p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
          {/* =============================================== */}
          {/* FORMULAIRE */}
          {/* =============================================== */}

          <section>
            <div className="rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold">
                Bloquer un créneau
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Créez une indisponibilité
                pour un terrain ou
                l&apos;ensemble des
                terrains.
              </p>

              <form
                action={
                  createClosure
                }
                className="mt-7 space-y-5"
              >
                {/* MOTIF */}

                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-medium"
                  >
                    Événement
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    placeholder="Ex : Loto de l'association"
                    className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-3 outline-none transition focus:border-white/30"
                  />
                </div>

                {/* TERRAIN */}

                <div>
                  <label
                    htmlFor="courtId"
                    className="mb-2 block text-sm font-medium"
                  >
                    Terrain concerné
                  </label>

                  <select
                    id="courtId"
                    name="courtId"
                    required
                    defaultValue="ALL"
                    className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none"
                  >
                    <option value="ALL">
                      Tous les terrains
                    </option>

                    {courts?.map(
                      (court) => (
                        <option
                          key={
                            court.id
                          }
                          value={
                            court.id
                          }
                        >
                          {
                            court.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* DATE */}

                <div>
                  <label
                    htmlFor="date"
                    className="mb-2 block text-sm font-medium"
                  >
                    Date
                  </label>

                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    min={
                      getTodayDateString()
                    }
                    defaultValue={
                      getTodayDateString()
                    }
                    className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-3"
                  />
                </div>

                {/* HORAIRES */}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="start"
                      className="mb-2 block text-sm font-medium"
                    >
                      Début
                    </label>

                    <input
                      id="start"
                      name="start"
                      type="time"
                      required
                      className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-3"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="end"
                      className="mb-2 block text-sm font-medium"
                    >
                      Fin
                    </label>

                    <input
                      id="end"
                      name="end"
                      type="time"
                      required
                      className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-3"
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label
                    htmlFor="reason"
                    className="mb-2 block text-sm font-medium"
                  >
                    Informations
                    complémentaires
                  </label>

                  <textarea
                    id="reason"
                    name="reason"
                    rows={4}
                    placeholder="Facultatif"
                    className="w-full resize-none rounded-lg border border-white/10 bg-transparent px-4 py-3 outline-none transition focus:border-white/30"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-white/90"
                >
                  Bloquer les créneaux
                </button>
              </form>
            </div>
          </section>

          {/* =============================================== */}
          {/* FERMETURES À VENIR */}
          {/* =============================================== */}

          <section>
            <div>
              <h2 className="text-xl font-semibold">
                Fermetures à venir
              </h2>

              <p className="mt-1 text-sm text-white/50">
                Événements et
                indisponibilités déjà
                programmés.
              </p>
            </div>

            {closuresError && (
              <div className="mt-5 rounded-xl border border-red-500/30 p-4 text-red-400">
                Impossible de charger
                les fermetures.
              </div>
            )}

            {!closuresError &&
              (!closures ||
                closures.length ===
                0) && (
                <div className="mt-5 rounded-2xl border border-white/10 p-8 text-center">
                  <p className="text-sm text-white/50">
                    Aucune fermeture
                    programmée.
                  </p>
                </div>
              )}

            {!closuresError &&
              closures &&
              closures.length >
              0 && (
                <div className="mt-5 space-y-4">
                  {closures.map(
                    (
                      closure
                    ) => {
                      const start =
                        new Date(
                          closure.starts_at
                        );

                      const end =
                        new Date(
                          closure.ends_at
                        );

                      const courtName =
                        closure
                          .court_id ===
                          null
                          ? "Tous les terrains"
                          : closure
                            .courts?.[0]
                            ?.name ??
                          "Terrain";

                      return (
                        <article
                          key={
                            closure.id
                          }
                          className="rounded-2xl border border-white/10 p-5"
                        >
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold">
                                  {
                                    closure.title
                                  }
                                </h3>

                                <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">
                                  {
                                    courtName
                                  }
                                </span>
                              </div>

                              <p className="mt-3 capitalize text-sm text-white/70">
                                {formatBookingDate(
                                  start
                                )}
                              </p>

                              <p className="mt-1 text-sm text-white/50">
                                {formatBookingTime(
                                  start
                                )}
                                {" – "}
                                {formatBookingTime(
                                  end
                                )}
                              </p>

                              {closure.reason && (
                                <p className="mt-3 text-sm leading-6 text-white/40">
                                  {
                                    closure.reason
                                  }
                                </p>
                              )}
                            </div>

                            <form
                              action={
                                deleteClosure
                              }
                            >
                              <input
                                type="hidden"
                                name="closureId"
                                value={
                                  closure.id
                                }
                              />

                              <button
                                type="submit"
                                className="w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 sm:w-auto"
                              >
                                Supprimer
                              </button>
                            </form>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
          </section>
        </div>
      </div>
    </main>
  );
}