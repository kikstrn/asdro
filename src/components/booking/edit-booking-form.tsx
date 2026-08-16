"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  updateBookingParticipants,
} from "@/app/mes-reservations/[id]/modifier/actions";

type MemberOption = {
  id: string;
  first_name: string;
  last_name: string;
};

type EditBookingFormProps = {
  bookingId: string;
  currentMemberName: string;
  initialMatchType:
  | "SINGLES"
  | "DOUBLES";
  initialParticipantIds: string[];
  members: MemberOption[];
};

export function EditBookingForm({
  bookingId,
  currentMemberName,
  initialMatchType,
  initialParticipantIds,
  members,
}: EditBookingFormProps) {
  const [
    matchType,
    setMatchType,
  ] =
    useState<
      "SINGLES" |
      "DOUBLES"
    >(
      initialMatchType
    );

  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState<string[]>(
      initialParticipantIds
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const limit =
    matchType ===
      "SINGLES"
      ? 1
      : 3;

  const selectedMembers =
    members.filter(
      (member) =>
        selectedIds.includes(
          member.id
        )
    );

  const results =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLocaleLowerCase(
            "fr"
          );

      if (
        term.length < 2
      ) {
        return [];
      }

      return members
        .filter(
          (member) => {
            if (
              selectedIds.includes(
                member.id
              )
            ) {
              return false;
            }

            const value =
              `${member.first_name} ${member.last_name}`
                .toLocaleLowerCase(
                  "fr"
                );

            return value.includes(
              term
            );
          }
        )
        .slice(0, 8);
    }, [
      members,
      search,
      selectedIds,
    ]);

  function changeMatchType(
    value:
      | "SINGLES"
      | "DOUBLES"
  ) {
    setMatchType(
      value
    );

    const nextLimit =
      value ===
        "SINGLES"
        ? 1
        : 3;

    setSelectedIds(
      (current) =>
        current.slice(
          0,
          nextLimit
        )
    );
  }

  function addMember(
    memberId: string
  ) {
    setSelectedIds(
      (current) => {
        if (
          current.includes(
            memberId
          ) ||
          current.length >=
          limit
        ) {
          return current;
        }

        return [
          ...current,
          memberId,
        ];
      }
    );

    setSearch("");
  }

  function removeMember(
    memberId: string
  ) {
    setSelectedIds(
      (current) =>
        current.filter(
          (id) =>
            id !==
            memberId
        )
    );
  }

  return (
    <form
      action={
        updateBookingParticipants
      }
    >
      <input
        type="hidden"
        name="bookingId"
        value={bookingId}
      />

      <input
        type="hidden"
        name="matchType"
        value={matchType}
      />

      <input
        type="hidden"
        name="participantIds"
        value={JSON.stringify(
          selectedIds
        )}
      />

      <div>
        <h2 className="text-xl font-semibold">
          Type de partie
        </h2>

        <p className="mt-1 text-sm text-white/45">
          Choisissez le format du match.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              changeMatchType(
                "SINGLES"
              )
            }
            className={`rounded-xl border px-4 py-4 font-semibold transition ${matchType ===
                "SINGLES"
                ? "border-[#b8f536]/40 bg-[#b8f536]/10 text-[#b8f536]"
                : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/5"
              }`}
          >
            Simple
          </button>

          <button
            type="button"
            onClick={() =>
              changeMatchType(
                "DOUBLES"
              )
            }
            className={`rounded-xl border px-4 py-4 font-semibold transition ${matchType ===
                "DOUBLES"
                ? "border-[#b8f536]/40 bg-[#b8f536]/10 text-[#b8f536]"
                : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/5"
              }`}
          >
            Double
          </button>
        </div>
      </div>

      <div className="mt-7">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/35">
            Joueur 1
          </p>

          <p className="mt-1 font-semibold">
            {currentMemberName}
          </p>

          <p className="mt-1 text-xs text-[#b8f536]">
            Organisateur
          </p>
        </div>
      </div>

      <div className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Joueurs invités
            </h2>

            <p className="mt-1 text-sm text-white/45">
              {selectedIds.length}/{limit} joueur
              {limit > 1
                ? "s"
                : ""} supplémentaire
              {limit > 1
                ? "s"
                : ""}
            </p>
          </div>

          <Users className="h-5 w-5 text-white/30" />
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/35" />

          <input
            type="search"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event
                  .target
                  .value
              )
            }
            disabled={
              selectedIds.length >=
              limit
            }
            placeholder={
              selectedIds.length >=
                limit
                ? "Nombre maximum atteint"
                : "Rechercher par prénom ou nom..."
            }
            className="asdro-input !pl-12 !pr-4"
          />
        </div>

        {search.trim().length ===
          1 && (
            <p className="mt-2 text-xs text-white/35">
              Saisissez au moins 2 caractères.
            </p>
          )}

        {results.length >
          0 && (
            <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0b1812]">
              {results.map(
                (member) => (
                  <button
                    key={
                      member.id
                    }
                    type="button"
                    onClick={() =>
                      addMember(
                        member.id
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/5"
                  >
                    <span className="font-medium">
                      {
                        member.first_name
                      }{" "}
                      {
                        member.last_name
                      }
                    </span>

                    <UserPlus className="h-4 w-4 text-[#b8f536]" />
                  </button>
                )
              )}
            </div>
          )}

        {search
          .trim()
          .length >= 2 &&
          results.length ===
          0 &&
          selectedIds.length <
          limit && (
            <p className="mt-3 text-sm text-white/40">
              Aucun adhérent trouvé.
            </p>
          )}

        {selectedMembers.length >
          0 && (
            <div className="mt-5 space-y-2">
              {selectedMembers.map(
                (
                  member,
                  index
                ) => (
                  <div
                    key={
                      member.id
                    }
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#b8f536]/20 bg-[#b8f536]/5 p-4"
                  >
                    <div>
                      <p className="text-xs text-white/35">
                        Joueur{" "}
                        {index + 2}
                      </p>

                      <p className="mt-1 font-semibold">
                        {
                          member.first_name
                        }{" "}
                        {
                          member.last_name
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeMember(
                          member.id
                        )
                      }
                      aria-label={`Retirer ${member.first_name} ${member.last_name}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              )}
            </div>
          )}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/mes-reservations"
          className="asdro-button-secondary w-full sm:w-auto"
        >
          Annuler
        </Link>

        <button
          type="submit"
          className="asdro-button-primary w-full sm:w-auto"
        >
          Enregistrer les modifications
        </button>
      </div>
    </form>
  );
}
