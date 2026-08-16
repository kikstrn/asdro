import { NextResponse } from "next/server";

import { verifyCalendarToken } from "@/lib/booking/calendar-token";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsUtc(value: string | Date) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export async function GET(
  request: Request,
  { params }: RouteProps
) {
  const { id } = await params;

  const url =
    new URL(request.url);

  const token =
    url.searchParams.get(
      "token"
    ) ?? "";

  let tokenIsValid =
    false;

  if (token) {
    try {
      tokenIsValid =
        await verifyCalendarToken(
          id,
          token
        );
    } catch {
      tokenIsValid =
        false;
    }
  }

  const supabase =
    await createClient();

  let memberId:
    string | null = null;

  if (!tokenIsValid) {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Vous devez être connecté.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: member,
      error: memberError,
    } = await supabase
      .from("members")
      .select(`
        id,
        active
      `)
      .eq(
        "user_id",
        user.id
      )
      .single();

    if (
      memberError ||
      !member ||
      !member.active
    ) {
      return NextResponse.json(
        {
          error:
            "Adhérent introuvable.",
        },
        {
          status: 403,
        }
      );
    }

    memberId =
      member.id;
  }

  const {
    data: booking,
    error: bookingError,
  } = await supabase
    .from("bookings")
    .select(`
      id,
      member_id,
      starts_at,
      ends_at,
      status,
      match_type,

      courts (
        name
      ),

      members (
        id,
        first_name,
        last_name
      ),

      booking_participants (
        member_id,
        members (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq("id", id)
    .single();

  if (
    bookingError ||
    !booking
  ) {
    return NextResponse.json(
      {
        error:
          "Réservation introuvable.",
      },
      {
        status: 404,
      }
    );
  }

  const participants =
    booking
      .booking_participants ??
    [];

  if (!tokenIsValid) {
    const isOwner =
      booking.member_id ===
      memberId;

    const isParticipant =
      participants.some(
        (participant) =>
          participant.member_id ===
          memberId
      );

    if (
      !isOwner &&
      !isParticipant
    ) {
      return NextResponse.json(
        {
          error:
            "Vous n'avez pas accès à cette réservation.",
        },
        {
          status: 403,
        }
      );
    }
  }

  const court =
    Array.isArray(
      booking.courts
    )
      ? booking.courts[0]
      : booking.courts;

  const owner =
    Array.isArray(
      booking.members
    )
      ? booking.members[0]
      : booking.members;

  const playerNames: string[] = [];

  if (owner) {
    playerNames.push(
      `${owner.first_name} ${owner.last_name}`
    );
  }

  for (
    const participant
    of participants
  ) {
    const player =
      Array.isArray(
        participant.members
      )
        ? participant
            .members[0]
        : participant
            .members;

    if (player) {
      playerNames.push(
        `${player.first_name} ${player.last_name}`
      );
    }
  }

  const matchLabel =
    booking.match_type ===
    "DOUBLES"
      ? "Double"
      : "Simple";

  const courtName =
    court?.name ??
    "Terrain ASDRO";

  const summary =
    `ASDRO Tennis - ${matchLabel} - ${courtName}`;

  const descriptionParts = [
    `Type de partie : ${matchLabel}`,
    `Terrain : ${courtName}`,
  ];

  if (
    playerNames.length >
    0
  ) {
    descriptionParts.push(
      `Joueurs : ${playerNames.join(", ")}`
    );
  }

  if (
    booking.status ===
    "CANCELLED"
  ) {
    descriptionParts.push(
      "Statut : réservation annulée"
    );
  }

  const description =
    descriptionParts.join(
      "\n"
    );

  const filename =
    `asdro-${booking.id}.ics`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ASDRO Tennis//Reservation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.id}@asdro-tennis`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(booking.starts_at)}`,
    `DTEND:${toIcsUtc(booking.ends_at)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(courtName)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new NextResponse(
    ics,
    {
      status: 200,
      headers: {
        "Content-Type":
          "text/calendar; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="${filename}"`,
        "Cache-Control":
          "private, no-store",
      },
    }
  );
}
