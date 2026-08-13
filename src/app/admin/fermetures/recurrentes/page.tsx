import { redirect } from "next/navigation";
import { CalendarDays, Clock3, Power, Trash2 } from "lucide-react";
import { createRecurringClosure, deleteRecurringClosure, toggleRecurringClosure } from "./actions";
import { AppHeader } from "@/components/navigation/app-header";
import { createClient } from "@/lib/supabase/server";

const DAYS = [
  { value: 1, label: "Lundi" }, { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" }, { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" }, { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

type PageProps = { searchParams: Promise<{ success?: string; updated?: string; deleted?: string; error?: string }> };

export default async function RecurringClosuresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: member } = await supabase.from("members").select("id, first_name, role, active").eq("user_id", user.id).single();
  if (!member || !member.active || !["ADMIN", "SUPER_ADMIN"].includes(member.role)) redirect("/");

  const [courtsResult, recurringResult] = await Promise.all([
    supabase.from("courts").select("id, name").eq("active", true).order("name"),
    supabase.from("recurring_closures").select(`id, court_id, title, reason, day_of_week, starts_on, ends_on, starts_at, ends_at, active, courts(name)`).order("day_of_week").order("starts_at"),
  ]);

  const courts = courtsResult.data ?? [];
  const recurringClosures = recurringResult.data ?? [];
  const dayName = (day: number) => DAYS.find((item) => item.value === day)?.label ?? "Jour inconnu";
  const formatTime = (time: string) => time.slice(0, 5);
  const formatDate = (date: string) => new Intl.DateTimeFormat("fr-FR").format(new Date(`${date}T12:00:00`));

  return (
    <main className="min-h-screen">
      <AppHeader firstName={member.first_name} backHref="/admin/fermetures" backLabel="Fermetures" />
      <div className="asdro-container py-6 md:py-10">
        <p className="text-sm font-medium text-[#b8f536]">Administration</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Créneaux récurrents</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Bloquez automatiquement les terrains pour les cours, entraînements ou autres activités hebdomadaires.</p>

        {params.error && <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{params.error}</div>}
        {params.success && <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">Créneau récurrent créé.</div>}
        {params.updated && <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">Créneau récurrent mis à jour.</div>}
        {params.deleted && <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">Créneau récurrent supprimé.</div>}

        <section className="asdro-card mt-8 p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]"><CalendarDays className="h-5 w-5" /></div>
            <div><h2 className="font-semibold">Nouvelle plage récurrente</h2><p className="mt-1 text-sm text-white/40">Exemple : cours tous les mercredis de 17h à 19h.</p></div>
          </div>

          <form action={createRecurringClosure} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><label htmlFor="title" className="mb-2 block text-sm font-medium">Nom</label><input id="title" name="title" required placeholder="Cours enfants" className="asdro-input" /></div>
            <div><label htmlFor="courtId" className="mb-2 block text-sm font-medium">Terrain</label><select id="courtId" name="courtId" required defaultValue="" className="asdro-input"><option value="" disabled>Sélectionner</option><option value="ALL">Tous les terrains</option>{courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</select></div>
            <div><label htmlFor="dayOfWeek" className="mb-2 block text-sm font-medium">Jour</label><select id="dayOfWeek" name="dayOfWeek" required defaultValue="" className="asdro-input"><option value="" disabled>Sélectionner</option>{DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></div>
            <div><label htmlFor="startsAt" className="mb-2 block text-sm font-medium">Heure de début</label><input id="startsAt" name="startsAt" type="time" required className="asdro-input" /></div>
            <div><label htmlFor="endsAt" className="mb-2 block text-sm font-medium">Heure de fin</label><input id="endsAt" name="endsAt" type="time" required className="asdro-input" /></div>
            <div><label htmlFor="startsOn" className="mb-2 block text-sm font-medium">À partir du</label><input id="startsOn" name="startsOn" type="date" required className="asdro-input" /></div>
            <div><label htmlFor="endsOn" className="mb-2 block text-sm font-medium">Jusqu&apos;au</label><input id="endsOn" name="endsOn" type="date" required className="asdro-input" /></div>
            <div className="md:col-span-2"><label htmlFor="reason" className="mb-2 block text-sm font-medium">Description <span className="text-white/30">(facultatif)</span></label><textarea id="reason" name="reason" rows={3} placeholder="École de tennis..." className="asdro-input resize-none" /></div>
            <div className="md:col-span-2"><button type="submit" className="asdro-button-primary w-full sm:w-auto"><CalendarDays className="h-4 w-4" />Créer la plage récurrente</button></div>
          </form>
        </section>

        <section className="mt-8 pb-10">
          <h2 className="text-xl font-semibold">Plages programmées</h2>
          <p className="mt-1 text-sm text-white/45">Activez, désactivez ou supprimez les créneaux existants.</p>
          {recurringClosures.length === 0 ? (
            <div className="asdro-card mt-4 p-8 text-center text-sm text-white/40">Aucun créneau récurrent n&apos;est configuré.</div>
          ) : (
            <div className="mt-4 grid gap-4">
              {recurringClosures.map((closure) => {
                const court = Array.isArray(closure.courts) ? closure.courts[0] : closure.courts;
                return (
                  <article key={closure.id} className={`asdro-card p-5 ${!closure.active ? "opacity-50" : ""}`}>
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{closure.title}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${closure.active ? "bg-[#b8f536]/10 text-[#b8f536]" : "bg-white/5 text-white/40"}`}>{closure.active ? "Actif" : "Désactivé"}</span></div>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/50"><span>{court?.name ?? "Tous les terrains"}</span><span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{dayName(closure.day_of_week)}</span><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{formatTime(closure.starts_at)} → {formatTime(closure.ends_at)}</span></div>
                        <p className="mt-3 text-sm text-white/40">Du {formatDate(closure.starts_on)} au {formatDate(closure.ends_on)}</p>
                        {closure.reason && <p className="mt-2 text-sm text-white/50">{closure.reason}</p>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <form action={toggleRecurringClosure}><input type="hidden" name="id" value={closure.id} /><input type="hidden" name="active" value={String(closure.active)} /><button type="submit" className="asdro-button-secondary h-11 px-4"><Power className="h-4 w-4" /><span className="hidden sm:inline">{closure.active ? "Désactiver" : "Activer"}</span></button></form>
                        <form action={deleteRecurringClosure}><input type="hidden" name="id" value={closure.id} /><button type="submit" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/10"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Supprimer</span></button></form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
