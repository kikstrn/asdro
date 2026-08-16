"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import {
  createPortal,
} from "react-dom";

import {
  CalendarCheck,
  CalendarDays,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";

import {
  logout,
} from "@/app/actions/auth";

type MobileMenuProps = {
  isAdmin?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function MobileMenu({
  isAdmin = false,
  backHref,
  backLabel,
}: MobileMenuProps) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const canUseDOM =
    typeof document !==
    "undefined";

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  const menu =
    canUseDOM &&
    open
      ? createPortal(
          <div
            className="
              fixed inset-0 z-[9999]
              bg-black/70
              backdrop-blur-md
              md:hidden
            "
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setOpen(false);
              }
            }}
          >
            <aside
              className="
                absolute
                inset-y-0 right-0

                flex h-[100dvh]
                w-[min(340px,90vw)]
                flex-col

                border-l
                border-white/10

                bg-[#07110c]
                shadow-[-24px_0_80px_rgba(0,0,0,0.55)]
              "
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              {/* HEADER */}

              <div
                className="
                  flex
                  shrink-0
                  items-center
                  justify-between
                  gap-4

                  border-b
                  border-white/10

                  px-5
                  pb-4
                  pt-[max(1rem,env(safe-area-inset-top))]
                "
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b8f536]">
                    Navigation
                  </p>

                  <p className="mt-1 font-bold">
                    ASDRO Tennis
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  aria-label="Fermer le menu"
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-xl
                    border border-white/10
                    bg-white/5
                    text-white/50
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* NAVIGATION */}

              <nav
                className="
                  min-h-0
                  flex-1
                  overflow-y-auto
                  px-4
                  py-4
                "
              >
                <div className="space-y-2">
                  {backHref ? (
                    <Link
                      href={backHref}
                      onClick={() =>
                        setOpen(false)
                      }
                      className="
                        flex min-h-12
                        items-center gap-3
                        rounded-xl
                        border border-white/10
                        bg-white/[0.03]
                        px-4 py-3
                        text-sm font-semibold
                        text-white/80
                        transition
                        hover:bg-white/[0.06]
                      "
                    >
                      <span className="text-white/40">
                        ←
                      </span>

                      {backLabel ??
                        "Retour"}
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      onClick={() =>
                        setOpen(false)
                      }
                      className="
                        flex min-h-12
                        items-center gap-3
                        rounded-xl
                        border border-white/10
                        bg-white/[0.03]
                        px-4 py-3
                        text-sm font-semibold
                        text-white/80
                        transition
                        hover:bg-white/[0.06]
                      "
                    >
                      <CalendarDays className="h-5 w-5 text-[#b8f536]" />
                      Planning
                    </Link>
                  )}

                  {!backHref && (
                    <Link
                      href="/mes-reservations"
                      onClick={() =>
                        setOpen(false)
                      }
                      className="
                        flex min-h-12
                        items-center gap-3
                        rounded-xl
                        border border-white/10
                        bg-white/[0.03]
                        px-4 py-3
                        text-sm font-semibold
                        text-white/80
                        transition
                        hover:bg-white/[0.06]
                      "
                    >
                      <CalendarCheck className="h-5 w-5 text-[#b8f536]" />
                      Mes réservations
                    </Link>
                  )}

                  {!backHref && (
                    <Link
                      href="/mon-compte"
                      onClick={() =>
                        setOpen(false)
                      }
                      className="
                        flex min-h-12
                        items-center gap-3
                        rounded-xl
                        border border-white/10
                        bg-white/[0.03]
                        px-4 py-3
                        text-sm font-semibold
                        text-white/80
                        transition
                        hover:bg-white/[0.06]
                      "
                    >
                      <UserRound className="h-5 w-5 text-[#b8f536]" />
                      Mon compte
                    </Link>
                  )}

                  {isAdmin &&
                    !backHref && (
                      <Link
                        href="/admin"
                        onClick={() =>
                          setOpen(false)
                        }
                        className="
                          flex min-h-12
                          items-center gap-3
                          rounded-xl
                          border border-white/10
                          bg-white/[0.03]
                          px-4 py-3
                          text-sm font-semibold
                          text-white/80
                          transition
                          hover:bg-white/[0.06]
                        "
                      >
                        <Settings className="h-5 w-5 text-[#b8f536]" />
                        Administration
                      </Link>
                    )}
                </div>
              </nav>

              {/* FOOTER */}

              <div
                className="
                  shrink-0
                  border-t
                  border-white/10
                  p-4
                  pb-[max(1rem,env(safe-area-inset-bottom))]
                "
              >
                <form
                  action={logout}
                >
                  <button
                    type="submit"
                    className="
                      flex min-h-12
                      w-full
                      items-center
                      justify-center
                      gap-3
                      rounded-xl
                      border
                      border-red-500/20
                      bg-red-500/5
                      px-4 py-3
                      text-sm font-semibold
                      text-red-400
                      transition
                      hover:bg-red-500/10
                    "
                  >
                    <LogOut className="h-5 w-5" />
                    Déconnexion
                  </button>
                </form>
              </div>
            </aside>
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
        aria-label="Ouvrir le menu"
        title="Menu"
        className="
          flex h-11 w-11
          items-center justify-center
          rounded-xl
          border border-white/10
          bg-white/5
          text-white/80
          transition
          hover:bg-white/10
          hover:text-white
          md:hidden
        "
      >
        <Menu className="h-5 w-5" />
      </button>

      {menu}
    </>
  );
}