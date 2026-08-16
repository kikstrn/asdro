"server-only";

type EmailRecipient = {
  email: string;
  name?: string;
};

type EmailAttachment = {
  name: string;
  content: string;
};

type SendTransactionalEmailParams = {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
  attachments?: EmailAttachment[];
};

export async function sendTransactionalEmail({
  to,
  subject,
  htmlContent,
  textContent,
  tags,
  attachments,
}: SendTransactionalEmailParams) {
  if (to.length === 0) {
    return;
  }

  const apiKey =
    process.env.BREVO_API_KEY;

  const senderEmail =
    process.env.BREVO_SENDER_EMAIL;

  const senderName =
    process.env.BREVO_SENDER_NAME ??
    "ASDRO Tennis";

  if (!apiKey) {
    throw new Error(
      "BREVO_API_KEY est manquante."
    );
  }

  if (!senderEmail) {
    throw new Error(
      "BREVO_SENDER_EMAIL est manquante."
    );
  }

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",

      headers: {
        accept:
          "application/json",
        "api-key":
          apiKey,
        "content-type":
          "application/json",
      },

      body: JSON.stringify({
        sender: {
          name:
            senderName,
          email:
            senderEmail,
        },

        to,

        subject,

        htmlContent,

        ...(textContent
          ? {
              textContent,
            }
          : {}),

        ...(tags &&
        tags.length > 0
          ? {
              tags,
            }
          : {}),

        ...(attachments &&
        attachments.length >
          0
          ? {
              attachment:
                attachments,
            }
          : {}),
      }),
    }
  );

  if (!response.ok) {
    const details =
      await response.text();

    throw new Error(
      `Brevo ${response.status}: ${details}`
    );
  }

  return response.json();
}
