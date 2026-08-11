import { redirect } from "next/navigation";

import {
    createMember,
    importMembersCsv,
    toggleMemberActive,
    updateMemberRole,
} from "./actions";

import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/navigation/app-header";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{
        q?: string;
        error?: string;
        created?: string;
        updated?: string;
        roleUpdated?: string;
        imported?: string;
    }>;
};

export default async function MembersAdminPage({
    searchParams,
}: PageProps) {
    const params = await searchParams;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/connexion");
    }

    const { data: currentMember } = await supabase
        .from("members")
        .select(
            `
      id,
      first_name,
      last_name,
      role,
      active
      `
        )
        .eq("user_id", user.id)
        .single();

    if (
        !currentMember ||
        !currentMember.active ||
        !["ADMIN", "SUPER_ADMIN"].includes(currentMember.role)
    ) {
        redirect("/");
    }

    const search = (params.q ?? "").trim();

    let query = supabase
        .from("members")
        .select(
            `
      id,
      membership_number,
      first_name,
      last_name,
      email,
      role,
      active,
      user_id,
      created_at
      `
        )
        .order("last_name")
        .order("first_name");

    if (search) {
        query = query.or(
            `membership_number.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        );
    }

    const {
        data: members,
        error: membersError,
    } = await query;

    return (
        <main className="min-h-screen bg-black text-white">
            <AppHeader
                firstName={currentMember.first_name}
                backHref="/admin"
                backLabel="Administration"
            />

            <div className="mx-auto max-w-7xl px-5 py-8">
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

                {params.created === "1" && (
                    <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
                        Adhérent ajouté.
                    </div>
                )}

                {params.updated === "1" && (
                    <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
                        Statut de l&apos;adhérent mis à jour.
                    </div>
                )}

                {params.roleUpdated === "1" && (
                    <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
                        Rôle de l&apos;adhérent mis à jour.
                    </div>
                )}

                {params.imported && (
                    <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
                        <p className="font-semibold text-green-400">
                            Import terminé
                        </p>

                        <p className="mt-1 text-sm text-green-300/70">
                            {params.imported} adhérent(s) ont été importés ou mis à jour.
                        </p>
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
                    <section>
                        <div className="rounded-2xl border border-white/10 p-6">
                            <h2 className="text-xl font-semibold">
                                Ajouter un adhérent
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-white/50">
                                L&apos;adhérent pourra ensuite utiliser son numéro pour créer son compte.
                            </p>

                            <form
                                action={createMember}
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
                                        required
                                        className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-3"
                                    />
                                </div>

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
                                        required
                                        className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-3"
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
                                        required
                                        className="w-full rounded-lg border border-white/10 bg-transparent px-4 py-3"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full rounded-lg bg-white px-4 py-3 font-semibold text-black"
                                >
                                    Ajouter l&apos;adhérent
                                </button>
                            </form>
                        </div>

                        <div className="mt-6 rounded-2xl border border-white/10 p-6">
                            <h2 className="text-xl font-semibold">
                                Importer des adhérents
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-white/50">
                                Importez une liste d&apos;adhérents depuis un fichier CSV.
                            </p>

                            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                                <a
                                    href="/modele_adherents_asdro.csv"
                                    download
                                    className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold transition hover:bg-white/5"
                                >
                                    Télécharger le modèle CSV
                                </a>
                            </div>

                            <form
                                action={importMembersCsv}
                                className="mt-6 space-y-4"
                            >
                                <div>
                                    <label
                                        htmlFor="membersCsv"
                                        className="mb-2 block text-sm font-medium"
                                    >
                                        Fichier CSV
                                    </label>

                                    <input
                                        id="membersCsv"
                                        name="file"
                                        type="file"
                                        accept=".csv,text/csv"
                                        required
                                        className="block w-full rounded-lg border border-white/10 p-3 text-sm"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full rounded-lg border border-white/20 px-4 py-3 font-semibold transition hover:bg-white/5"
                                >
                                    Importer le fichier
                                </button>
                            </form>
                        </div>
                    </section>

                    <section>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Liste des adhérents
                                </h2>

                                <p className="mt-1 text-sm text-white/50">
                                    {members?.length ?? 0} adhérent(s) affiché(s)
                                </p>
                            </div>

                            <form
                                method="get"
                                className="flex w-full gap-2 sm:w-auto"
                            >
                                <input
                                    type="search"
                                    name="q"
                                    defaultValue={search}
                                    placeholder="Nom, numéro, e-mail..."
                                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-transparent px-4 py-2 sm:w-72"
                                />

                                <button
                                    type="submit"
                                    className="rounded-lg border border-white/10 px-4 py-2"
                                >
                                    Rechercher
                                </button>
                            </form>
                        </div>

                        {membersError && (
                            <div className="mt-5 rounded-xl border border-red-500/30 p-4 text-red-400">
                                Impossible de charger les adhérents.
                            </div>
                        )}

                        {!membersError &&
                            (!members || members.length === 0) && (
                                <div className="mt-5 rounded-2xl border border-white/10 p-8 text-center text-sm text-white/50">
                                    Aucun adhérent trouvé.
                                </div>
                            )}

                        {!membersError &&
                            members &&
                            members.length > 0 && (
                                <div className="mt-5 space-y-3">
                                    {members.map((member) => {
                                        const registered = Boolean(member.user_id);

                                        return (
                                            <article
                                                key={member.id}
                                                className="rounded-2xl border border-white/10 p-5"
                                            >
                                                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-semibold">
                                                                {member.first_name} {member.last_name}
                                                            </h3>

                                                            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">
                                                                {member.membership_number}
                                                            </span>

                                                            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">
                                                                {registered
                                                                    ? "Compte créé"
                                                                    : "Non inscrit"}
                                                            </span>

                                                            {!member.active && (
                                                                <span className="rounded-full border border-red-500/30 px-2.5 py-1 text-xs text-red-400">
                                                                    Inactif
                                                                </span>
                                                            )}
                                                        </div>

                                                        {member.email && (
                                                            <p className="mt-2 text-sm text-white/50">
                                                                {member.email}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-3 sm:flex-row">
                                                        <form action={updateMemberRole}>
                                                            <input
                                                                type="hidden"
                                                                name="memberId"
                                                                value={member.id}
                                                            />

                                                            <select
                                                                name="role"
                                                                defaultValue={member.role}
                                                                disabled={
                                                                    currentMember.role !== "SUPER_ADMIN" &&
                                                                    member.role === "SUPER_ADMIN"
                                                                }
                                                                className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm"
                                                            >
                                                                <option value="MEMBER">
                                                                    Membre
                                                                </option>

                                                                <option value="ADMIN">
                                                                    Administrateur
                                                                </option>

                                                                {currentMember.role === "SUPER_ADMIN" && (
                                                                    <option value="SUPER_ADMIN">
                                                                        Super administrateur
                                                                    </option>
                                                                )}
                                                            </select>

                                                            <button
                                                                type="submit"
                                                                className="mt-2 w-full rounded-lg border border-white/10 px-3 py-2 text-sm"
                                                            >
                                                                Modifier le rôle
                                                            </button>
                                                        </form>

                                                        <form action={toggleMemberActive}>
                                                            <input
                                                                type="hidden"
                                                                name="memberId"
                                                                value={member.id}
                                                            />

                                                            <input
                                                                type="hidden"
                                                                name="active"
                                                                value={
                                                                    member.active
                                                                        ? "false"
                                                                        : "true"
                                                                }
                                                            />

                                                            <button
                                                                type="submit"
                                                                className={`w-full rounded-lg border px-4 py-2 text-sm font-semibold ${member.active
                                                                    ? "border-red-500/30 text-red-400"
                                                                    : "border-green-500/30 text-green-400"
                                                                    }`}
                                                            >
                                                                {member.active
                                                                    ? "Désactiver"
                                                                    : "Réactiver"}
                                                            </button>
                                                        </form>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                    </section>
                </div>
            </div>
        </main>
    );
}