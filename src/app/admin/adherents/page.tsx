import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Upload, UserPlus } from "lucide-react";
import { createMember, importMembersCsv, toggleMemberActive, updateMemberRole } from "./actions";
import { AppHeader } from "@/components/navigation/app-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ q?: string; error?: string; created?: string; updated?: string; roleUpdated?: string; imported?: string }> };

export default async function MembersAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: currentMember } = await supabase.from("members").select("id, first_name, last_name, role, active").eq("user_id", user.id).single();
  if (!currentMember || !currentMember.active || !["ADMIN", "SUPER_ADMIN"].includes(currentMember.role)) redirect("/");

  const search = (params.q ?? "").trim();
  let query = supabase.from("members").select("id, membership_number, first_name, last_name, email, role, active, user_id, created_at").order("last_name").order("first_name");
  if (search) query = query.or(`membership_number.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data: members, error: membersError } = await query;

  return (
    <main className="min-h-screen">
      <AppHeader firstName={currentMember.first_name} backHref="/admin" backLabel="Administration" />
      <div className="asdro-container py-6 md:py-10">
        <p className="text-sm font-medium text-[#b8f536]">Administration</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Adhérents</h1><p className="mt-2 text-sm text-white/50">Ajoutez, recherchez, importez et gérez les membres du club.</p>
        {params.error && <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{params.error}</div>}
        {params.created === "1" && <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">Adhérent ajouté.</div>}
        {params.updated === "1" && <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">Statut de l&apos;adhérent mis à jour.</div>}
        {params.roleUpdated === "1" && <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">Rôle de l&apos;adhérent mis à jour.</div>}
        {params.imported && <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">{params.imported} adhérent(s) importé(s) ou mis à jour.</div>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <section className="asdro-card p-5 md:p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]"><UserPlus className="h-5 w-5" /></div><h2 className="mt-4 text-xl font-semibold">Ajouter un adhérent</h2><p className="mt-2 text-sm text-white/50">L&apos;adhérent pourra ensuite créer son compte avec son numéro.</p><form action={createMember} className="mt-6 space-y-5"><div><label htmlFor="membershipNumber" className="mb-2 block text-sm font-medium">Numéro d&apos;adhérent</label><input id="membershipNumber" name="membershipNumber" required className="asdro-input" /></div><div><label htmlFor="firstName" className="mb-2 block text-sm font-medium">Prénom</label><input id="firstName" name="firstName" required className="asdro-input" /></div><div><label htmlFor="lastName" className="mb-2 block text-sm font-medium">Nom</label><input id="lastName" name="lastName" required className="asdro-input" /></div><button type="submit" className="asdro-button-primary w-full">Ajouter l&apos;adhérent</button></form></section>
            <section className="asdro-card p-5 md:p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]"><Upload className="h-5 w-5" /></div><h2 className="mt-4 text-xl font-semibold">Import CSV</h2><p className="mt-2 text-sm text-white/50">Téléchargez le modèle, complétez-le puis importez-le.</p><Link href="/modele_adherents_asdro.csv" className="asdro-button-secondary mt-5 w-full" download>Télécharger le modèle CSV</Link><form action={importMembersCsv} className="mt-5 space-y-4"><input name="file" type="file" accept=".csv,text/csv" required className="asdro-input" /><button type="submit" className="asdro-button-primary w-full">Importer le fichier</button></form></section>
          </aside>

          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold">Liste des adhérents</h2><p className="mt-1 text-sm text-white/50">{members?.length ?? 0} adhérent(s) affiché(s)</p></div><form method="get" className="flex w-full gap-2 sm:w-auto"><div className="relative min-w-0 flex-1 sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" /><input type="search" name="q" defaultValue={search} placeholder="Nom, numéro, e-mail..." className="asdro-input pl-10" /></div><button type="submit" className="asdro-button-secondary">Rechercher</button></form></div>
            {membersError && <div className="asdro-card mt-5 p-4 text-red-400">Impossible de charger les adhérents.</div>}
            {!membersError && (!members || members.length === 0) && <div className="asdro-card mt-5 p-8 text-center text-sm text-white/50">Aucun adhérent trouvé.</div>}
            {!membersError && members && members.length > 0 && <div className="mt-5 space-y-3">{members.map((member) => <article key={member.id} className="asdro-card p-5"><div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{member.first_name} {member.last_name}</h3><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">{member.membership_number}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">{member.user_id ? "Compte créé" : "Non inscrit"}</span>{!member.active && <span className="rounded-full border border-red-500/30 px-2.5 py-1 text-xs text-red-400">Inactif</span>}</div>{member.email && <p className="mt-2 text-sm text-white/50">{member.email}</p>}</div><div className="flex flex-col gap-3 sm:flex-row"><form action={updateMemberRole}><input type="hidden" name="memberId" value={member.id} /><select name="role" defaultValue={member.role} disabled={currentMember.role !== "SUPER_ADMIN" && member.role === "SUPER_ADMIN"} className="asdro-input"><option value="MEMBER">Membre</option><option value="ADMIN">Administrateur</option>{currentMember.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super administrateur</option>}</select><button type="submit" className="asdro-button-secondary mt-2 w-full">Modifier le rôle</button></form><form action={toggleMemberActive}><input type="hidden" name="memberId" value={member.id} /><input type="hidden" name="active" value={member.active ? "false" : "true"} /><button type="submit" className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${member.active ? "border-red-500/25 text-red-400 hover:bg-red-500/10" : "border-green-500/25 text-green-400 hover:bg-green-500/10"}`}>{member.active ? "Désactiver" : "Réactiver"}</button></form></div></div></article>)}</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
