"use client";

import {
  FormEvent,
  useState,
} from "react";
import {
  createPortal,
} from "react-dom";

import {
  CheckCircle2,
  KeyRound,
  Mail,
  X,
} from "lucide-react";

import {
  requestPasswordReset,
} from "@/app/connexion/password-reset-actions";

export function ForgotPasswordModal() {
  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

  const canUseDOM =
    typeof document !==
    "undefined";

  function close() {
    setOpen(false);
    setMessage("");
    setSuccess(false);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result =
        await requestPasswordReset(
          email
        );

      setSuccess(
        result.ok
      );

      setMessage(
        result.message
      );
    } finally {
      setLoading(false);
    }
  }

  const modal =
    canUseDOM &&
    open
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                close();
              }
            }}
          >
            <div
              className="w-full rounded-t-[28px] border border-white/10 bg-[#07110c] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.60)] sm:max-w-md sm:rounded-3xl sm:p-6"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
                  <KeyRound className="h-5 w-5" />
                </div>

                <button
                  type="button"
                  onClick={close}
                  aria-label="Fermer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h2
                id="forgot-password-title"
                className="mt-5 text-xl font-bold"
              >
                Mot de passe oublié
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Saisissez l&apos;adresse e-mail associée à votre compte.
                Nous vous enverrons un lien pour choisir un nouveau mot de passe.
              </p>

              {message && (
                <div
                  className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${
                    success
                      ? "border-green-500/25 bg-green-500/10 text-green-300"
                      : "border-red-500/25 bg-red-500/10 text-red-300"
                  }`}
                >
                  {success && (
                    <CheckCircle2 className="mb-2 h-5 w-5" />
                  )}

                  {message}
                </div>
              )}

              {!success && (
                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="mt-6"
                >
                  <label
                    htmlFor="forgot-email"
                    className="mb-2 block text-sm font-medium"
                  >
                    Adresse e-mail
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

                    <input
                      id="forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(
                        event
                      ) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="prenom.nom@email.fr"
                      className="asdro-input !pl-12"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      loading
                    }
                    className="asdro-button-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Envoi..."
                      : "Envoyer le lien"}
                  </button>
                </form>
              )}

              {success && (
                <button
                  type="button"
                  onClick={close}
                  className="asdro-button-secondary mt-5 w-full"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="text-sm font-medium text-[#b8f536] transition hover:underline"
      >
        Mot de passe oublié ?
      </button>

      {modal}
    </>
  );
}
