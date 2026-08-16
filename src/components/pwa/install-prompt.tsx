"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import {
  Download,
  Share2,
  Smartphone,
  X,
} from "lucide-react";

type BeforeInstallPromptEvent =
  Event & {
    prompt: () => Promise<void>;

    userChoice: Promise<{
      outcome:
        | "accepted"
        | "dismissed";
    }>;
  };

function subscribeToHydration() {
  return () => {};
}

function useIsHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
}

function detectStandalone() {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  return (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    (
      "standalone" in
        window.navigator &&
      (
        window.navigator as Navigator & {
          standalone?: boolean;
        }
      ).standalone === true
    )
  );
}

function detectIOS() {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return false;
  }

  return /iPad|iPhone|iPod/.test(
    navigator.userAgent
  );
}

export function InstallPrompt() {
  const hydrated =
    useIsHydrated();

  const [
    deferredPrompt,
    setDeferredPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null
    );

  const [
    dismissed,
    setDismissed,
  ] = useState(false);

  const [
    installed,
    setInstalled,
  ] = useState(false);

  const isIOS =
    hydrated
      ? detectIOS()
      : false;

  const isStandalone =
    hydrated
      ? detectStandalone() ||
        installed
      : false;

  useEffect(() => {
    function handleBeforeInstallPrompt(
      event: Event
    ) {
      event.preventDefault();

      setDeferredPrompt(
        event as BeforeInstallPromptEvent
      );
    }

    function handleInstalled() {
      setDeferredPrompt(
        null
      );

      setInstalled(
        true
      );
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );
    };
  }, []);

  async function install() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();

    const choice =
      await deferredPrompt.userChoice;

    if (
      choice.outcome ===
      "accepted"
    ) {
      setInstalled(true);
    }

    setDeferredPrompt(
      null
    );
  }

  if (!hydrated) {
    return null;
  }

  if (
    isStandalone ||
    dismissed
  ) {
    return null;
  }

  if (
    !deferredPrompt &&
    !isIOS
  ) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-md">
      <div className="asdro-card border-[#b8f536]/20 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b8f536]/10 text-[#b8f536]">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Installer ASDRO Tennis
            </p>

            <p className="mt-1 text-sm leading-6 text-white/50">
              {isIOS
                ? "Ajoutez l'application à votre écran d'accueil pour y accéder plus rapidement."
                : "Installez l'application sur votre appareil pour un accès rapide."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setDismissed(true)
            }
            aria-label="Fermer"
            className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">
              Dans Safari :
            </p>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <Share2 className="h-4 w-4 text-[#b8f536]" />

              <span>
                Partager
              </span>

              <span className="text-white/30">
                →
              </span>

              <span>
                Sur l&apos;écran d&apos;accueil
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={install}
            className="asdro-button-primary mt-4 w-full"
          >
            <Download className="h-4 w-4" />

            Installer l&apos;application
          </button>
        )}
      </div>
    </div>
  );
}