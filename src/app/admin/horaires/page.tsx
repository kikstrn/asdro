import { redirect } from "next/navigation";

import {
    updateBookingSettings,
    updateOpeningHours,
} from "./actions";

import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/navigation/app-header";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{
        error?: string;
        hoursSuccess?: string;
        settingsSuccess?: string;
    }>;
};

const DAYS = [
    {
        value: 1,
        label: "Lundi",
    },
    {
        value: 2,
        label: "Mardi",
    },
    {
        value: 3,
        label: "Mercredi",
    },
    {
        value: 4,
        label: "Jeudi",
    },
    {
        value: 5,
        label: "Vendredi",
    },
    {
        value: 6,
        label: "Samedi",
    },
    {
        value: 0,
        label: "Dimanche",
    },
];

function cleanTime(
    value: string | null | undefined
) {
    return value?.slice(0, 5) ?? "";
}

export default async function OpeningHoursPage({
    searchParams,
}: PageProps) {
    const params = await searchParams;

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

    const { data: member } =
        await supabase
            .from("members")
            .select(
                "first_name, last_name, role, active"
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
    // HORAIRES
    // ==========================================================

    const {
        data: openingHours,
        error: openingHoursError,
    } = await supabase
        .from("opening_hours")
        .select(
            `
      day_of_week,
      opens_at,
      closes_at,
      active
      `
        );

    // ==========================================================
    // PARAMÈTRES
    // ==========================================================

    const {
        data: settings,
        error: settingsError,
    } = await supabase
        .from("club_settings")
        .select(
            `
      slot_duration_minutes,
      booking_days_ahead,
      max_active_bookings,
      cancellation_deadline_minutes
      `
        )
        .eq("id", 1)
        .single();

    if (
        openingHoursError ||
        settingsError ||
        !settings
    ) {
        return (
            <main className="min-h-screen bg-black p-10 text-white">
                <h1 className="text-2xl font-bold">
                    Administration ASDRO
                </h1>

                <p className="mt-4 text-red-400">
                    Impossible de charger les paramètres du club.
                </p>
            </main>
        );
    }

    function getHours(
        day: number
    ) {
        return openingHours?.find(
            (item) =>
                item.day_of_week === day
        );
    }

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

                {params.hoursSuccess ===
                    "1" && (
                        <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
                            <p className="font-semibold text-green-400">
                                Horaires enregistrés
                            </p>

                            <p className="mt-1 text-sm text-green-300/70">
                                Le planning utilise maintenant les nouveaux horaires.
                            </p>
                        </div>
                    )}

                {params.settingsSuccess ===
                    "1" && (
                        <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
                            <p className="font-semibold text-green-400">
                                Règles enregistrées
                            </p>

                            <p className="mt-1 text-sm text-green-300/70">
                                Les nouvelles règles de réservation sont maintenant actives.
                            </p>
                        </div>
                    )}

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* ================================================= */}
                    {/* HORAIRES */}
                    {/* ================================================= */}

                    <section className="rounded-2xl border border-white/10 p-6">
                        <div>
                            <h2 className="text-xl font-semibold">
                                Horaires d&apos;ouverture
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-white/50">
                                Définissez les horaires disponibles pour chaque jour de la semaine.
                            </p>
                        </div>

                        <form
                            action={
                                updateOpeningHours
                            }
                            className="mt-7"
                        >
                            <div className="space-y-4">
                                {DAYS.map(
                                    (day) => {
                                        const hours =
                                            getHours(
                                                day.value
                                            );

                                        return (
                                            <div
                                                key={
                                                    day.value
                                                }
                                                className="rounded-xl border border-white/10 p-4"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="font-semibold">
                                                        {
                                                            day.label
                                                        }
                                                    </p>

                                                    <label className="flex items-center gap-2 text-sm text-white/60">
                                                        <input
                                                            type="checkbox"
                                                            name={`active-${day.value}`}
                                                            defaultChecked={
                                                                hours?.active ??
                                                                false
                                                            }
                                                        />

                                                        Ouvert
                                                    </label>
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label
                                                            htmlFor={`opensAt-${day.value}`}
                                                            className="mb-2 block text-xs text-white/50"
                                                        >
                                                            Ouverture
                                                        </label>

                                                        <input
                                                            id={`opensAt-${day.value}`}
                                                            name={`opensAt-${day.value}`}
                                                            type="time"
                                                            defaultValue={
                                                                cleanTime(
                                                                    hours?.opens_at
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor={`closesAt-${day.value}`}
                                                            className="mb-2 block text-xs text-white/50"
                                                        >
                                                            Fermeture
                                                        </label>

                                                        <input
                                                            id={`closesAt-${day.value}`}
                                                            name={`closesAt-${day.value}`}
                                                            type="time"
                                                            defaultValue={
                                                                cleanTime(
                                                                    hours?.closes_at
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>

                            <button
                                type="submit"
                                className="mt-6 w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-white/90"
                            >
                                Enregistrer les horaires
                            </button>
                        </form>
                    </section>

                    {/* ================================================= */}
                    {/* RÈGLES */}
                    {/* ================================================= */}

                    <section className="rounded-2xl border border-white/10 p-6">
                        <div>
                            <h2 className="text-xl font-semibold">
                                Règles de réservation
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-white/50">
                                Ces paramètres sont appliqués automatiquement aux adhérents.
                            </p>
                        </div>

                        <form
                            action={
                                updateBookingSettings
                            }
                            className="mt-7 space-y-6"
                        >
                            {/* DURÉE */}

                            <div>
                                <label
                                    htmlFor="slotDuration"
                                    className="block font-medium"
                                >
                                    Durée d&apos;un créneau
                                </label>

                                <p className="mt-1 text-sm text-white/40">
                                    Durée exprimée en minutes.
                                </p>

                                <select
                                    id="slotDuration"
                                    name="slotDuration"
                                    defaultValue={
                                        settings.slot_duration_minutes
                                    }
                                    className="mt-3 w-full rounded-lg border border-white/10 bg-black px-4 py-3"
                                >
                                    <option value="30">
                                        30 minutes
                                    </option>

                                    <option value="45">
                                        45 minutes
                                    </option>

                                    <option value="60">
                                        1 heure
                                    </option>

                                    <option value="90">
                                        1 h 30
                                    </option>

                                    <option value="120">
                                        2 heures
                                    </option>
                                </select>
                            </div>

                            {/* JOURS */}

                            <div>
                                <label
                                    htmlFor="bookingDaysAhead"
                                    className="block font-medium"
                                >
                                    Réservation à l&apos;avance
                                </label>

                                <p className="mt-1 text-sm text-white/40">
                                    Nombre de jours à l&apos;avance pendant lesquels un membre peut réserver.
                                </p>

                                <input
                                    id="bookingDaysAhead"
                                    name="bookingDaysAhead"
                                    type="number"
                                    min={0}
                                    max={365}
                                    required
                                    defaultValue={
                                        settings.booking_days_ahead
                                    }
                                    className="mt-3 w-full rounded-lg border border-white/10 bg-transparent px-4 py-3"
                                />
                            </div>

                            {/* MAX RÉSERVATIONS */}

                            <div>
                                <label
                                    htmlFor="maxActiveBookings"
                                    className="block font-medium"
                                >
                                    Réservations simultanées maximum
                                </label>

                                <p className="mt-1 text-sm text-white/40">
                                    Nombre maximum de réservations futures par adhérent.
                                </p>

                                <input
                                    id="maxActiveBookings"
                                    name="maxActiveBookings"
                                    type="number"
                                    min={1}
                                    max={50}
                                    required
                                    defaultValue={
                                        settings.max_active_bookings
                                    }
                                    className="mt-3 w-full rounded-lg border border-white/10 bg-transparent px-4 py-3"
                                />
                            </div>

                            {/* ANNULATION */}

                            <div>
                                <label
                                    htmlFor="cancellationDeadline"
                                    className="block font-medium"
                                >
                                    Délai d&apos;annulation
                                </label>

                                <p className="mt-1 text-sm text-white/40">
                                    Nombre de minutes avant le début du créneau au-delà duquel l&apos;annulation n&apos;est plus autorisée.
                                </p>

                                <input
                                    id="cancellationDeadline"
                                    name="cancellationDeadline"
                                    type="number"
                                    min={0}
                                    required
                                    defaultValue={
                                        settings.cancellation_deadline_minutes
                                    }
                                    className="mt-3 w-full rounded-lg border border-white/10 bg-transparent px-4 py-3"
                                />

                                <p className="mt-2 text-xs text-white/40">
                                    Exemple : 120 = 2 heures avant le créneau.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black transition hover:bg-white/90"
                            >
                                Enregistrer les règles
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </main>
    );
}