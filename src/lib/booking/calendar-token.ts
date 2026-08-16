"server-only";

const encoder =
  new TextEncoder();

function toHex(
  bytes: Uint8Array
) {
  return Array.from(bytes)
    .map((value) =>
      value
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

async function hmac(
  value: string
) {
  const secret =
    process.env
      .CALENDAR_TOKEN_SECRET;

  if (!secret) {
    throw new Error(
      "CALENDAR_TOKEN_SECRET est manquante."
    );
  }

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(value)
    );

  return toHex(
    new Uint8Array(
      signature
    )
  );
}

export async function createCalendarToken(
  bookingId: string
) {
  return hmac(
    `booking:${bookingId}`
  );
}

export async function verifyCalendarToken(
  bookingId: string,
  token: string
) {
  if (!token) {
    return false;
  }

  const expected =
    await createCalendarToken(
      bookingId
    );

  if (
    expected.length !==
    token.length
  ) {
    return false;
  }

  let difference = 0;

  for (
    let index = 0;
    index <
    expected.length;
    index += 1
  ) {
    difference |=
      expected.charCodeAt(
        index
      ) ^
      token.charCodeAt(
        index
      );
  }

  return difference === 0;
}
