"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    async function registerServiceWorker() {
      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

        console.log(
          "ASDRO Service Worker enregistré :",
          registration.scope
        );
      } catch (error) {
        console.error(
          "Erreur Service Worker ASDRO :",
          error
        );
      }
    }

    registerServiceWorker();
  }, []);

  return null;
}