"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, UserPlus, Users, X } from "lucide-react";

import { createBookingWithParticipants } from "@/app/actions/booking-with-participants";

type MemberOption = {
    id: string;
    first_name: string;
    last_name: string;
};

type BookingComposerProps = {
    courtId: string;
    courtName: string;
    date: string;
    start: string;
    end: string;
    currentMemberName: string;
    members: MemberOption[];
    compact?: boolean;
};

export function BookingComposer({
    courtId,
    courtName,
    date,
    start,
    end,
    currentMemberName,
    members,
    compact = false,
}: BookingComposerProps) {
    const [open, setOpen] = useState(false);
    const [matchType, setMatchType] = useState<"SINGLES" | "DOUBLES">("SINGLES");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const canUseDOM =
        typeof document !== "undefined";

    const limit = matchType === "SINGLES" ? 1 : 3;

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
                setMatchType("SINGLES");
                setSearch("");
                setSelectedIds([]);
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const selectedMembers = members.filter((member) =>
        selectedIds.includes(member.id)
    );

    const results = useMemo(() => {
        const term = search.trim().toLocaleLowerCase("fr");

        if (term.length < 2) {
            return [];
        }

        return members
            .filter((member) => {
                if (selectedIds.includes(member.id)) {
                    return false;
                }

                const name = `${member.first_name} ${member.last_name}`.toLocaleLowerCase("fr");
                return name.includes(term);
            })
            .slice(0, 8);
    }, [members, search, selectedIds]);

    function reset() {
        setMatchType("SINGLES");
        setSearch("");
        setSelectedIds([]);
    }

    function close() {
        setOpen(false);
        reset();
    }

    function changeMatchType(value: "SINGLES" | "DOUBLES") {
        setMatchType(value);
        const nextLimit = value === "SINGLES" ? 1 : 3;
        setSelectedIds((current) => current.slice(0, nextLimit));
    }

    function addMember(memberId: string) {
        setSelectedIds((current) => {
            if (current.length >= limit || current.includes(memberId)) {
                return current;
            }
            return [...current, memberId];
        });

        setSearch("");
    }

    function removeMember(memberId: string) {
        setSelectedIds((current) => current.filter((id) => id !== memberId));
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={
                    compact
                        ? "group flex min-h-24 w-full flex-col justify-center rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-[#b8f536]/40 hover:bg-[#b8f536]/5"
                        : "asdro-button-primary w-full"
                }
            >
                {compact ? (
                    <>
                        <span className="font-semibold transition group-hover:text-[#b8f536]">
                            Disponible
                        </span>
                        <span className="mt-1 text-xs text-white/35">
                            {start} – {end}
                        </span>
                        <span className="mt-3 text-xs font-semibold text-[#b8f536]">
                            Réserver →
                        </span>
                    </>
                ) : (
                    "Réserver ce créneau"
                )}
            </button>

            {canUseDOM &&
                open &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-6"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`booking-title-${courtId}-${start}`}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                close();
                            }
                        }}
                    >
                        <div
                            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[30px] border border-white/15 bg-[#07110c]/98 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-h-[88dvh] sm:max-w-[560px] sm:rounded-[28px]"
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            <div className="shrink-0 border-b border-white/10 bg-[#07110c]/95 p-5 sm:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b8f536]">
                                            Nouvelle réservation
                                        </p>
                                        <h2
                                            id={`booking-title-${courtId}-${start}`}
                                            className="mt-2 text-xl font-bold"
                                        >
                                            {courtName}
                                        </h2>
                                        <p className="mt-1 text-sm text-white/50">
                                            {start} – {end}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={close}
                                        aria-label="Fermer"
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
                                <form action={createBookingWithParticipants}>
                                    <input type="hidden" name="courtId" value={courtId} />
                                    <input type="hidden" name="date" value={date} />
                                    <input type="hidden" name="start" value={start} />
                                    <input type="hidden" name="end" value={end} />
                                    <input type="hidden" name="matchType" value={matchType} />
                                    <input
                                        type="hidden"
                                        name="participantIds"
                                        value={JSON.stringify(selectedIds)}
                                    />

                                    <div>
                                        <p className="text-sm font-semibold">Type de partie</p>

                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => changeMatchType("SINGLES")}
                                                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${matchType === "SINGLES"
                                                        ? "border-[#b8f536]/40 bg-[#b8f536]/10 text-[#b8f536]"
                                                        : "border-white/10 bg-white/5 text-white/60"
                                                    }`}
                                            >
                                                Simple
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => changeMatchType("DOUBLES")}
                                                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${matchType === "DOUBLES"
                                                        ? "border-[#b8f536]/40 bg-[#b8f536]/10 text-[#b8f536]"
                                                        : "border-white/10 bg-white/5 text-white/60"
                                                    }`}
                                            >
                                                Double
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:mt-6">
                                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/35">
                                            Joueur 1
                                        </p>
                                        <p className="mt-1 font-semibold">{currentMemberName}</p>
                                        <p className="mt-1 text-xs text-white/40">Vous</p>
                                    </div>

                                    <div className="mt-5 sm:mt-6">
                                        <div className="flex items-end justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold">Ajouter des joueurs</p>
                                                <p className="mt-1 text-xs text-white/40">
                                                    {selectedIds.length}/{limit} joueur{limit > 1 ? "s" : ""} supplémentaire{limit > 1 ? "s" : ""}
                                                </p>
                                            </div>

                                            <Users className="h-5 w-5 text-white/30" />
                                        </div>

                                        <div className="relative mt-3">
                                            <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/35" />
                                            <input
                                                type="search"
                                                value={search}
                                                onChange={(event) => setSearch(event.target.value)}
                                                disabled={selectedIds.length >= limit}
                                                placeholder={
                                                    selectedIds.length >= limit
                                                        ? "Nombre maximum atteint"
                                                        : "Prénom ou nom..."
                                                }
                                                className="asdro-input !pl-12 !pr-4"
                                            />
                                        </div>

                                        {search.trim().length === 1 && (
                                            <p className="mt-2 text-xs text-white/35">
                                                Saisissez au moins 2 caractères.
                                            </p>
                                        )}

                                        {results.length > 0 && (
                                            <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0b1812]">
                                                {results.map((member) => (
                                                    <button
                                                        key={member.id}
                                                        type="button"
                                                        onClick={() => addMember(member.id)}
                                                        className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/5"
                                                    >
                                                        <span className="font-medium">
                                                            {member.first_name} {member.last_name}
                                                        </span>
                                                        <UserPlus className="h-4 w-4 text-[#b8f536]" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {search.trim().length >= 2 &&
                                            results.length === 0 &&
                                            selectedIds.length < limit && (
                                                <p className="mt-3 text-sm text-white/40">
                                                    Aucun adhérent trouvé.
                                                </p>
                                            )}
                                    </div>

                                    {selectedMembers.length > 0 && (
                                        <div className="mt-5 space-y-2">
                                            {selectedMembers.map((member, index) => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-[#b8f536]/20 bg-[#b8f536]/5 p-3"
                                                >
                                                    <div>
                                                        <p className="text-xs text-white/35">
                                                            Joueur {index + 2}
                                                        </p>
                                                        <p className="mt-0.5 text-sm font-semibold">
                                                            {member.first_name} {member.last_name}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeMember(member.id)}
                                                        aria-label={`Retirer ${member.first_name} ${member.last_name}`}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="sticky bottom-0 -mx-5 mt-7 mb-7 border-t border-white/10 bg-[#07110c]/95 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl sm:static sm:mx-0 sm:flex sm:flex-row-reverse sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-6 sm:backdrop-blur-none">
                                        <button
                                            type="submit"
                                            className="asdro-button-primary w-full sm:w-auto"
                                        >
                                            Confirmer la réservation
                                        </button>

                                        <button
                                            type="button"
                                            onClick={close}
                                            className="asdro-button-secondary mt-3 w-full sm:mt-0 sm:w-auto"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
