import { redirect } from "next/navigation";
import { Clock3, Settings2 } from "lucide-react";
import { updateBookingSettings, updateOpeningHours } from "./actions";
import { AppHeader } from "@/components/navigation/app-header";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const DAYS = [{ value: 1, label: "Lundi" }, { value: 2, label: "Mardi" }, { value: 3, label: "Mercredi" }, { value: 4, label: "Jeudi" }, { value: 5, label: "Vendredi" }, { value: 6, label: "Samedi" }, { value: 0, label: "Dimanche" }];
const cleanTime = (value: string | null | undefined) => value?.slice(0, 5) ?? "";
type PageProps = { searchParams: Promise<{ error?: string; hoursSuccess?: string; settingsSuccess?: string }> };

export default async function OpeningHoursPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: member } = await supabase.from("members").select("first_name, last_name, role, active").eq("user_id", user.id).single();
  if (!member || !member.active || !["ADMIN", "SUPER_ADMIN"].includes(member.role)) redirect("/");

  const { data: openingHours, error: openingHoursError } = await supabase.from("opening_hours").select("day_of_week, opens_at, closes_at, active");
  const { data: settings, error: settingsError } = await supabase.from("club_settings").select("slot_duration_minutes, booking_days_ahead, max_active_bookings, cancellation_deadline_minutes").eq("id", 1).single();
  if (openingHoursError || settingsError || !settings) return <main className="min-h-screen"><AppHeader firstName={member.first_name} backHref="/admin" backLabel="Administration" /><div className="asdro-container py-10"><div className="asdro-card p-6 text-red-400">Impossible de charger les paramètres du club.</div></div></main>;
  const getHours = (day: number) => openingHours?.find((item) => item.day_of_week === day);

  return (
    <main className="min-h-screen">
      <AppHeader firstName={member.first_name} backHref="/admin" backLabel="Administration" />
      <div className="asdro-container py-6 md:py-10">
        <p className="text-sm font-medium text-[#b8f536]">Administration</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Horaires &amp; règles</h1><p className="mt-2 text-sm text-white/50">Configurez les heures d&apos;ouverture et les règles de réservation.</p>
        {params.error && <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{params.error}</div>}
        {params.hoursSuccess === "1" && <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">Horaires enregistrés.</div>}
        {params.settingsSuccess === "1" && <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">Règles enregistrées.</div>}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="asdro-card p-5 md:p-6">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]"><Clock3 className="h-5 w-5" /></div><div><h2 className="text-xl font-semibold">Horaires d&apos;ouverture</h2><p className="mt-1 text-sm text-white/45">Définissez les horaires disponibles chaque jour.</p></div></div>
            <form action={updateOpeningHours} className="mt-7">
              <div className="space-y-4">{DAYS.map((day) => { const hours = getHours(day.value); return <div key={day.value} className="rounded-xl border border-white/10 bg-white/[0.02] p-4"><div className="flex items-center justify-between gap-4"><p className="font-semibold">{day.label}</p><label className="flex items-center gap-2 text-sm text-white/60"><input type="checkbox" name={`active-${day.value}`} defaultChecked={hours?.active ?? false} />Ouvert</label></div><div className="mt-4 grid grid-cols-2 gap-3"><div><label htmlFor={`opensAt-${day.value}`} className="mb-2 block text-xs text-white/50">Ouverture</label><input id={`opensAt-${day.value}`} name={`opensAt-${day.value}`} type="time" defaultValue={cleanTime(hours?.opens_at)} className="asdro-input" /></div><div><label htmlFor={`closesAt-${day.value}`} className="mb-2 block text-xs text-white/50">Fermeture</label><input id={`closesAt-${day.value}`} name={`closesAt-${day.value}`} type="time" defaultValue={cleanTime(hours?.closes_at)} className="asdro-input" /></div></div></div>; })}</div>
              <button type="submit" className="asdro-button-primary mt-6 w-full">Enregistrer les horaires</button>
            </form>
          </section>

          <section className="asdro-card p-5 md:p-6">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]"><Settings2 className="h-5 w-5" /></div><div><h2 className="text-xl font-semibold">Règles de réservation</h2><p className="mt-1 text-sm text-white/45">Ces paramètres sont appliqués automatiquement.</p></div></div>
            <form action={updateBookingSettings} className="mt-7 space-y-6">
              <div><label htmlFor="slotDuration" className="block font-medium">Durée d&apos;un créneau</label><select id="slotDuration" name="slotDuration" defaultValue={settings.slot_duration_minutes} className="asdro-input mt-3"><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 heure</option><option value="90">1 h 30</option><option value="120">2 heures</option></select></div>
              <div><label htmlFor="bookingDaysAhead" className="block font-medium">Réservation à l&apos;avance</label><p className="mt-1 text-sm text-white/40">Nombre de jours pendant lesquels un membre peut réserver.</p><input id="bookingDaysAhead" name="bookingDaysAhead" type="number" min={0} max={365} required defaultValue={settings.booking_days_ahead} className="asdro-input mt-3" /></div>
              <div><label htmlFor="maxActiveBookings" className="block font-medium">Réservations simultanées maximum</label><input id="maxActiveBookings" name="maxActiveBookings" type="number" min={1} max={50} required defaultValue={settings.max_active_bookings} className="asdro-input mt-3" /></div>
              <div><label htmlFor="cancellationDeadline" className="block font-medium">Délai d&apos;annulation</label><p className="mt-1 text-sm text-white/40">Nombre de minutes avant le début du créneau.</p><input id="cancellationDeadline" name="cancellationDeadline" type="number" min={0} required defaultValue={settings.cancellation_deadline_minutes} className="asdro-input mt-3" /></div>
              <button type="submit" className="asdro-button-primary w-full">Enregistrer les règles</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
