import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Search } from "lucide-react";
import { cancelBookingByAdmin } from "./actions";
import { AppHeader } from "@/components/navigation/app-header";
import { formatBookingDate, formatBookingTime } from "@/lib/booking/date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ q?: string; date?: string; court?: string; status?: string; error?: string; cancelled?: string }> };

export default async function AdminReservationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: currentMember } = await supabase.from("members").select("id, first_name, last_name, role, active").eq("user_id", user.id).single();
  if (!currentMember || !currentMember.active || !["ADMIN", "SUPER_ADMIN"].includes(currentMember.role)) redirect("/");

  const search = (params.q ?? "").trim(); const selectedDate = params.date ?? ""; const selectedCourt = params.court ?? ""; const selectedStatus = params.status ?? "";
  const { data: courts } = await supabase.from("courts").select("id, name, sort_order").order("sort_order");
  let query = supabase.from("bookings").select("id, member_id, court_id, starts_at, ends_at, status, created_at, members(first_name, last_name, membership_number, email), courts(name)").order("starts_at", { ascending: false });
  if (selectedCourt) query = query.eq("court_id", selectedCourt);
  if (["CONFIRMED", "CANCELLED"].includes(selectedStatus)) query = query.eq("status", selectedStatus);
  if (selectedDate) { const start = new Date(`${selectedDate}T00:00:00+02:00`); const end = new Date(`${selectedDate}T23:59:59+02:00`); query = query.gte("starts_at", start.toISOString()).lte("starts_at", end.toISOString()); }
  const { data: rawBookings, error: bookingsError } = await query;
  const normalizedSearch = search.toLocaleLowerCase("fr");
  const bookings = rawBookings?.filter((booking) => { if (!normalizedSearch) return true; const member = booking.members?.[0]; if (!member) return false; return [member.first_name, member.last_name, member.membership_number, member.email].filter(Boolean).join(" ").toLocaleLowerCase("fr").includes(normalizedSearch); }) ?? [];

  const now = new Date();
  const upcomingCount = bookings.filter((booking) => booking.status === "CONFIRMED" && new Date(booking.starts_at) > now).length;
  const cancelledCount = bookings.filter((booking) => booking.status === "CANCELLED").length;
  const todayString = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const todayCount = bookings.filter((booking) => booking.status === "CONFIRMED" && new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(booking.starts_at)) === todayString).length;

  return (
    <main className="min-h-screen">
      <AppHeader firstName={currentMember.first_name} backHref="/admin" backLabel="Administration" />
      <div className="asdro-container py-6 md:py-10">
        <p className="text-sm font-medium text-[#b8f536]">Administration</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Réservations</h1><p className="mt-2 text-sm text-white/50">Consultez et gérez les réservations des adhérents.</p>
        {params.error && <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{params.error}</div>}
        {params.cancelled === "1" && <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">Réservation annulée.</div>}

        <section className="mt-8 grid gap-4 sm:grid-cols-3"><div className="asdro-card p-5"><p className="text-sm text-white/45">Aujourd&apos;hui</p><p className="mt-2 text-3xl font-bold">{todayCount}</p></div><div className="asdro-card p-5"><p className="text-sm text-white/45">À venir</p><p className="mt-2 text-3xl font-bold text-[#b8f536]">{upcomingCount}</p></div><div className="asdro-card p-5"><p className="text-sm text-white/45">Annulées</p><p className="mt-2 text-3xl font-bold">{cancelledCount}</p></div></section>

        <section className="asdro-card mt-8 p-5"><form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"><div><label htmlFor="q" className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">Adhérent</label><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" /><input id="q" name="q" type="search" defaultValue={search} placeholder="Nom, numéro, e-mail..." className="asdro-input pl-10" /></div></div><div><label htmlFor="date" className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">Date</label><input id="date" name="date" type="date" defaultValue={selectedDate} className="asdro-input" /></div><div><label htmlFor="court" className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">Terrain</label><select id="court" name="court" defaultValue={selectedCourt} className="asdro-input"><option value="">Tous</option>{courts?.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</select></div><div><label htmlFor="status" className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/40">Statut</label><select id="status" name="status" defaultValue={selectedStatus} className="asdro-input"><option value="">Tous</option><option value="CONFIRMED">Confirmées</option><option value="CANCELLED">Annulées</option></select></div><div className="flex items-end"><button type="submit" className="asdro-button-primary w-full xl:w-auto"><Search className="h-4 w-4" />Filtrer</button></div></form>{(search || selectedDate || selectedCourt || selectedStatus) && <div className="mt-4"><Link href="/admin/reservations" className="text-sm text-white/50 underline hover:text-white">Réinitialiser les filtres</Link></div>}</section>

        <section className="mt-8 pb-12"><h2 className="text-xl font-bold">Liste des réservations</h2><p className="mt-1 text-sm text-white/45">{bookings.length} résultat(s)</p>{bookingsError && <div className="asdro-card mt-5 p-6 text-red-400">Impossible de charger les réservations.</div>}{!bookingsError && bookings.length === 0 && <div className="asdro-card mt-5 p-10 text-center"><CalendarDays className="mx-auto h-8 w-8 text-white/25" /><p className="mt-4 font-semibold">Aucune réservation</p></div>}{!bookingsError && bookings.length > 0 && <div className="mt-5 space-y-4">{bookings.map((booking) => { const start = new Date(booking.starts_at); const end = new Date(booking.ends_at); const member = booking.members?.[0]; const court = booking.courts?.[0]; const isPast = end < new Date(); const statusLabel = booking.status === "CANCELLED" ? "Annulée" : isPast ? "Passée" : "Confirmée"; return <article key={booking.id} className="asdro-card p-5 md:p-6"><div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${booking.status === "CANCELLED" ? "border-red-500/25 text-red-400" : isPast ? "border-white/10 text-white/40" : "border-[#b8f536]/25 text-[#b8f536]"}`}>{statusLabel}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50">{court?.name ?? "Terrain"}</span></div><h3 className="mt-4 text-lg font-bold capitalize">{formatBookingDate(start)}</h3><p className="mt-1 text-sm text-white/50">{formatBookingTime(start)} – {formatBookingTime(end)}</p><div className="mt-4"><p className="font-semibold">{member ? `${member.first_name} ${member.last_name}` : "Adhérent"}</p>{member && <p className="mt-1 text-xs text-white/40">Adhérent n° {member.membership_number}</p>}</div></div>{booking.status === "CONFIRMED" && !isPast && <form action={cancelBookingByAdmin} className="w-full max-w-sm xl:w-auto"><input type="hidden" name="bookingId" value={booking.id} /><label htmlFor={`reason-${booking.id}`} className="mb-2 block text-xs text-white/40">Motif de l&apos;annulation</label><input id={`reason-${booking.id}`} name="reason" placeholder="Ex : indisponibilité exceptionnelle" className="asdro-input" /><button type="submit" className="mt-3 w-full rounded-xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10">Annuler la réservation</button></form>}</div></article>; })}</div>}</section>
      </div>
    </main>
  );
}
