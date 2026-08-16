"server-only";

import {
  sendTransactionalEmail,
} from "@/lib/email/brevo";

import {
  createClient,
} from "@/lib/supabase/server";

export type BookingRemovedRecipient = {
  email: string;
  name: string;
};

type Recipient = {
  email: string;
  name: string;
};

type NotificationKind =
  | "created"
  | "updated"
  | "cancelled";

function one<T>(
  value:
    | T
    | T[]
    | null
    | undefined
) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      timeZone:
        "Europe/Paris",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}

function formatTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      timeZone:
        "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeIcsText(
  value: string
) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsUtc(
  value: string | Date
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function utf8ToBase64(
  value: string
) {
  const bytes =
    new TextEncoder().encode(
      value
    );

  let binary = "";

  for (
    const byte of bytes
  ) {
    binary +=
      String.fromCharCode(
        byte
      );
  }

  return btoa(binary);
}

function getAppUrl() {
  return (
    process.env
      .NEXT_PUBLIC_APP_URL ??
    ""
  ).replace(
    /\/$/,
    ""
  );
}

function reservationUrl(
  bookingId: string
) {
  const appUrl =
    getAppUrl();

  return appUrl
    ? `${appUrl}/mes-reservations/${bookingId}`
    : null;
}

function button(
  href: string,
  label: string
) {
  return `
    <a
      href="${escapeHtml(href)}"
      style="
        display:inline-block;
        margin:6px 0;
        padding:13px 18px;
        border-radius:12px;
        background:#18251e;
        color:#ffffff;
        font-weight:700;
        text-decoration:none;
      "
    >
      ${escapeHtml(label)}
    </a>
  `;
}

async function loadSnapshot(
  bookingId: string
) {
  const supabase =
    await createClient();

  const {
    data: booking,
    error,
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
        last_name,
        email
      ),

      booking_participants (
        member_id,
        members (
          id,
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq(
      "id",
      bookingId
    )
    .single();

  if (
    error ||
    !booking
  ) {
    throw new Error(
      "Impossible de charger la réservation pour l'e-mail."
    );
  }

  const owner =
    one(
      booking.members
    );

  const court =
    one(
      booking.courts
    );

  const recipients:
    Recipient[] = [];

  const playerNames:
    string[] = [];

  if (owner) {
    const name =
      `${owner.first_name} ${owner.last_name}`;

    playerNames.push(name);

    if (owner.email) {
      recipients.push({
        email:
          owner.email,
        name,
      });
    }
  }

  for (
    const participant
    of booking
      .booking_participants ??
    []
  ) {
    const player =
      one(
        participant.members
      );

    if (!player) {
      continue;
    }

    const name =
      `${player.first_name} ${player.last_name}`;

    playerNames.push(name);

    if (player.email) {
      recipients.push({
        email:
          player.email,
        name,
      });
    }
  }

  return {
    booking,

    courtName:
      court?.name ??
      "Terrain ASDRO",

    playerNames,

    recipients:
      Array.from(
        new Map(
          recipients.map(
            (recipient) => [
              recipient.email
                .toLowerCase(),
              recipient,
            ]
          )
        ).values()
      ),
  };
}

type Snapshot =
  Awaited<
    ReturnType<
      typeof loadSnapshot
    >
  >;

function createIcsInvitation(
  snapshot: Snapshot,
  recipient: Recipient,
  kind: NotificationKind
) {
  const matchLabel =
    snapshot.booking
      .match_type ===
    "DOUBLES"
      ? "Double"
      : "Simple";

  const summary =
    `ASDRO Tennis - ${matchLabel} - ${snapshot.courtName}`;

  const description = [
    `Type de partie : ${matchLabel}`,
    `Terrain : ${snapshot.courtName}`,
    snapshot.playerNames.length >
    0
      ? `Joueurs : ${snapshot.playerNames.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const senderEmail =
    process.env
      .BREVO_SENDER_EMAIL ??
    "";

  const senderName =
    process.env
      .BREVO_SENDER_NAME ??
    "ASDRO Tennis";

  const cancelled =
    kind ===
    "cancelled";

  // Un SEQUENCE croissant permet aux clients calendrier
  // de traiter les modifications/annulations du même UID.
  const sequence =
    Math.floor(
      Date.now() /
        1000
    );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ASDRO Tennis//Reservation//FR",
    "CALSCALE:GREGORIAN",
    `METHOD:${cancelled ? "CANCEL" : "REQUEST"}`,
    "BEGIN:VEVENT",
    `UID:${snapshot.booking.id}@asdro-tennis`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `SEQUENCE:${sequence}`,
    `DTSTART:${toIcsUtc(snapshot.booking.starts_at)}`,
    `DTEND:${toIcsUtc(snapshot.booking.ends_at)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(snapshot.courtName)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `STATUS:${cancelled ? "CANCELLED" : "CONFIRMED"}`,
  ];

  if (senderEmail) {
    lines.push(
      `ORGANIZER;CN=${escapeIcsText(senderName)}:mailto:${senderEmail}`
    );
  }

  lines.push(
    `ATTENDEE;CN=${escapeIcsText(recipient.name)};RSVP=TRUE:mailto:${recipient.email}`,
    "END:VEVENT",
    "END:VCALENDAR",
    ""
  );

  return lines.join(
    "\r\n"
  );
}

function buildHtml(
  bookingId: string,
  title: string,
  intro: string,
  snapshot: Snapshot,
  kind: NotificationKind
) {
  const matchLabel =
    snapshot.booking
      .match_type ===
    "DOUBLES"
      ? "Double"
      : "Simple";

  const date =
    formatDate(
      snapshot.booking
        .starts_at
    );

  const start =
    formatTime(
      snapshot.booking
        .starts_at
    );

  const end =
    formatTime(
      snapshot.booking
        .ends_at
    );

  const details =
    reservationUrl(
      bookingId
    );

  const players =
    snapshot.playerNames
      .map(
        (name) =>
          `<li style="margin:6px 0;">${escapeHtml(name)}</li>`
      )
      .join("");

  const calendarMessage =
    kind ===
    "cancelled"
      ? "L'invitation calendrier jointe informe également votre calendrier de l'annulation."
      : "Une invitation calendrier est jointe à cet e-mail. Ouvrez-la depuis votre téléphone pour ajouter ou mettre à jour le match dans votre calendrier.";

  return `
    <!doctype html>
    <html lang="fr">
      <body style="margin:0;background:#07110c;color:#ffffff;font-family:Arial,sans-serif;">
        <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
          <div style="border:1px solid rgba(255,255,255,.12);border-radius:20px;background:#0b1812;padding:26px;">
            <div style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#b8f536;">
              ASDRO Tennis
            </div>

            <h1 style="margin:12px 0 8px;font-size:26px;line-height:1.2;">
              ${escapeHtml(title)}
            </h1>

            <p style="margin:0 0 22px;color:#b9c3bd;line-height:1.6;">
              ${escapeHtml(intro)}
            </p>

            <div style="border:1px solid rgba(255,255,255,.10);border-radius:16px;background:#07110c;padding:18px;">
              <p style="margin:0 0 8px;"><strong>${escapeHtml(snapshot.courtName)}</strong></p>
              <p style="margin:0 0 6px;color:#d7dfda;text-transform:capitalize;">${escapeHtml(date)}</p>
              <p style="margin:0 0 6px;color:#d7dfda;">${escapeHtml(`${start} – ${end}`)}</p>
              <p style="margin:0;color:#b8f536;font-weight:700;">${escapeHtml(matchLabel)}</p>
            </div>

            <div style="margin-top:20px;">
              <p style="margin:0 0 8px;font-weight:700;">Joueurs</p>
              <ul style="margin:0;padding-left:20px;color:#d7dfda;">
                ${players}
              </ul>
            </div>

            <div style="margin-top:22px;padding:15px;border-radius:14px;background:rgba(184,245,54,.07);border:1px solid rgba(184,245,54,.18);">
              <p style="margin:0;color:#dce8df;font-size:14px;line-height:1.6;">
                📅 ${escapeHtml(calendarMessage)}
              </p>
            </div>

            ${
              details
                ? `<div style="margin-top:22px;">${button(details, "Voir la réservation")}</div>`
                : ""
            }

            <p style="margin:24px 0 0;color:#7f8d84;font-size:12px;line-height:1.6;">
              Message automatique envoyé par ASDRO Tennis.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendToRecipients(
  recipients: Recipient[],
  snapshot: Snapshot,
  kind: NotificationKind,
  subject: string,
  htmlContent: string,
  textContent: string,
  tag: string
) {
  const results =
    await Promise.allSettled(
      recipients.map(
        (recipient) => {
          const ics =
            createIcsInvitation(
              snapshot,
              recipient,
              kind
            );

          return sendTransactionalEmail({
            to: [
              {
                email:
                  recipient.email,
                name:
                  recipient.name,
              },
            ],

            subject,
            htmlContent,
            textContent,
            tags: [tag],

            attachments: [
              {
                name:
                  kind ===
                  "cancelled"
                    ? "annulation-asdro.ics"
                    : "reservation-asdro.ics",

                content:
                  utf8ToBase64(
                    ics
                  ),
              },
            ],
          });
        }
      )
    );

  results.forEach(
    (result) => {
      if (
        result.status ===
        "rejected"
      ) {
        console.error(
          "Erreur envoi e-mail réservation :",
          result.reason
        );
      }
    }
  );
}

export async function sendBookingCreatedEmails(
  bookingId: string
) {
  const snapshot =
    await loadSnapshot(
      bookingId
    );

  const html =
    buildHtml(
      bookingId,
      "Réservation confirmée",
      "Votre réservation de tennis est confirmée.",
      snapshot,
      "created"
    );

  await sendToRecipients(
    snapshot.recipients,
    snapshot,
    "created",
    "Réservation confirmée — ASDRO Tennis",
    html,
    "Votre réservation ASDRO Tennis est confirmée. Une invitation calendrier est jointe à cet e-mail.",
    "booking-created"
  );
}

export async function sendBookingUpdatedEmails(
  bookingId: string,
  removedRecipients:
    BookingRemovedRecipient[] = []
) {
  const snapshot =
    await loadSnapshot(
      bookingId
    );

  const html =
    buildHtml(
      bookingId,
      "Réservation modifiée",
      "La composition de votre réservation a été mise à jour.",
      snapshot,
      "updated"
    );

  await sendToRecipients(
    snapshot.recipients,
    snapshot,
    "updated",
    "Réservation modifiée — ASDRO Tennis",
    html,
    "Votre réservation ASDRO Tennis a été modifiée. Une invitation calendrier mise à jour est jointe à cet e-mail.",
    "booking-updated"
  );

  if (
    removedRecipients.length >
    0
  ) {
    const removedHtml = `
      <!doctype html>
      <html lang="fr">
        <body style="margin:0;background:#07110c;color:#ffffff;font-family:Arial,sans-serif;">
          <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
            <div style="border:1px solid rgba(255,255,255,.12);border-radius:20px;background:#0b1812;padding:26px;">
              <div style="color:#b8f536;font-weight:700;">ASDRO Tennis</div>
              <h1 style="margin:12px 0 8px;">Modification d&apos;une réservation</h1>
              <p style="color:#b9c3bd;line-height:1.6;">
                Vous ne faites plus partie des joueurs de cette réservation.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const results =
      await Promise.allSettled(
        removedRecipients.map(
          (recipient) =>
            sendTransactionalEmail({
              to: [
                {
                  email:
                    recipient.email,
                  name:
                    recipient.name,
                },
              ],
              subject:
                "Modification d'une réservation — ASDRO Tennis",
              htmlContent:
                removedHtml,
              textContent:
                "Vous ne faites plus partie des joueurs de cette réservation ASDRO Tennis.",
              tags: [
                "booking-player-removed",
              ],
            })
        )
      );

    results.forEach(
      (result) => {
        if (
          result.status ===
          "rejected"
        ) {
          console.error(
            "Erreur e-mail joueur retiré :",
            result.reason
          );
        }
      }
    );
  }
}

export async function sendBookingCancelledEmails(
  bookingId: string
) {
  const snapshot =
    await loadSnapshot(
      bookingId
    );

  const html =
    buildHtml(
      bookingId,
      "Réservation annulée",
      "Cette réservation a été annulée par son organisateur.",
      snapshot,
      "cancelled"
    );

  await sendToRecipients(
    snapshot.recipients,
    snapshot,
    "cancelled",
    "Réservation annulée — ASDRO Tennis",
    html,
    "Votre réservation ASDRO Tennis a été annulée. Une invitation calendrier d'annulation est jointe à cet e-mail.",
    "booking-cancelled"
  );
}
