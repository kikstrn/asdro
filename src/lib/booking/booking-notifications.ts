"server-only";

import {
  createCalendarToken,
} from "@/lib/booking/calendar-token";

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

function one<T>(
  value:
    | T
    | T[]
    | null
    | undefined
) {
  if (
    Array.isArray(value)
  ) {
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
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
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

    playerNames.push(
      name
    );

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

    playerNames.push(
      name
    );

    if (player.email) {
      recipients.push({
        email:
          player.email,
        name,
      });
    }
  }

  const uniqueRecipients =
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
    );

  return {
    booking,
    courtName:
      court?.name ??
      "Terrain ASDRO",
    playerNames,
    recipients:
      uniqueRecipients,
  };
}

async function calendarUrl(
  bookingId: string
) {
  const appUrl =
    getAppUrl();

  if (!appUrl) {
    return null;
  }

  const token =
    await createCalendarToken(
      bookingId
    );

  return `${appUrl}/api/bookings/${bookingId}/calendar?token=${encodeURIComponent(
    token
  )}`;
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
  label: string,
  primary = true
) {
  const background =
    primary
      ? "#b8f536"
      : "#18251e";

  const color =
    primary
      ? "#07110c"
      : "#ffffff";

  return `
    <a
      href="${escapeHtml(
        href
      )}"
      style="
        display:inline-block;
        margin:6px 6px 6px 0;
        padding:13px 18px;
        border-radius:12px;
        background:${background};
        color:${color};
        font-weight:700;
        text-decoration:none;
      "
    >
      ${escapeHtml(label)}
    </a>
  `;
}

async function buildHtml(
  bookingId: string,
  title: string,
  intro: string,
  snapshot:
    Awaited<
      ReturnType<
        typeof loadSnapshot
      >
    >
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

  const calendar =
    await calendarUrl(
      bookingId
    );

  const details =
    reservationUrl(
      bookingId
    );

  const actions = [
    calendar
      ? button(
          calendar,
          "Ajouter au calendrier"
        )
      : "",
    details
      ? button(
          details,
          "Voir la réservation",
          false
        )
      : "",
  ].join("");

  const players =
    snapshot.playerNames
      .map(
        (name) =>
          `<li style="margin:6px 0;">${escapeHtml(
            name
          )}</li>`
      )
      .join("");

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
              <p style="margin:0 0 8px;"><strong>${escapeHtml(
                snapshot.courtName
              )}</strong></p>
              <p style="margin:0 0 6px;color:#d7dfda;text-transform:capitalize;">${escapeHtml(
                date
              )}</p>
              <p style="margin:0 0 6px;color:#d7dfda;">${escapeHtml(
                `${start} – ${end}`
              )}</p>
              <p style="margin:0;color:#b8f536;font-weight:700;">${matchLabel}</p>
            </div>

            <div style="margin-top:20px;">
              <p style="margin:0 0 8px;font-weight:700;">Joueurs</p>
              <ul style="margin:0;padding-left:20px;color:#d7dfda;">
                ${players}
              </ul>
            </div>

            ${
              actions
                ? `<div style="margin-top:24px;">${actions}</div>`
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
  subject: string,
  htmlContent: string,
  textContent: string,
  tag: string
) {
  const results =
    await Promise.allSettled(
      recipients.map(
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
            subject,
            htmlContent,
            textContent,
            tags: [tag],
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
    await buildHtml(
      bookingId,
      "Réservation confirmée",
      "Votre réservation de tennis est confirmée.",
      snapshot
    );

  await sendToRecipients(
    snapshot.recipients,
    "Réservation confirmée — ASDRO Tennis",
    html,
    "Votre réservation ASDRO Tennis est confirmée.",
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
    await buildHtml(
      bookingId,
      "Réservation modifiée",
      "La composition de votre réservation a été mise à jour.",
      snapshot
    );

  await sendToRecipients(
    snapshot.recipients,
    "Réservation modifiée — ASDRO Tennis",
    html,
    "Votre réservation ASDRO Tennis a été modifiée.",
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

    await sendToRecipients(
      removedRecipients,
      "Modification d'une réservation — ASDRO Tennis",
      removedHtml,
      "Vous ne faites plus partie des joueurs de cette réservation ASDRO Tennis.",
      "booking-player-removed"
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
    await buildHtml(
      bookingId,
      "Réservation annulée",
      "Cette réservation a été annulée par son organisateur.",
      snapshot
    );

  await sendToRecipients(
    snapshot.recipients,
    "Réservation annulée — ASDRO Tennis",
    html,
    "Votre réservation ASDRO Tennis a été annulée.",
    "booking-cancelled"
  );
}
