import Link from "next/link";
import Image from "next/image";

import {
  CalendarCheck,
  CalendarDays,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import {
  logout,
} from "@/app/actions/auth";

import {
  MobileMenu,
} from "@/components/navigation/mobile-menu";

type AppHeaderProps = {
  firstName?: string;
  isAdmin?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function AppHeader({
  firstName,
  isAdmin = false,
  backHref,
  backLabel,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07110c]/90 backdrop-blur-xl">
      <div className="asdro-container">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
              <Image
                src="/icons/icon-192.png"
                alt="ASDRO Tennis"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="truncate font-bold">
                ASDRO Tennis
              </p>

              {firstName && (
                <p className="truncate text-xs text-white/50">
                  Bonjour {firstName}
                </p>
              )}
            </div>
          </Link>

          {/* DESKTOP */}

          <nav className="hidden items-center gap-2 md:flex">
            {backHref ? (
              <Link
                href={backHref}
                className="asdro-button-secondary text-sm"
              >
                ← {backLabel ?? "Retour"}
              </Link>
            ) : (
              <Link
                href="/"
                className="asdro-button-secondary text-sm"
              >
                <CalendarDays className="h-4 w-4" />
                Planning
              </Link>
            )}

            {!backHref && (
              <Link
                href="/mes-reservations"
                className="asdro-button-secondary text-sm"
              >
                <CalendarCheck className="h-4 w-4" />
                Mes réservations
              </Link>
            )}

            {!backHref && (
              <Link
                href="/mon-compte"
                className="asdro-button-secondary text-sm"
              >
                <UserRound className="h-4 w-4" />
                Mon compte
              </Link>
            )}

            {isAdmin &&
              !backHref && (
                <Link
                  href="/admin"
                  className="asdro-button-secondary text-sm"
                >
                  <Settings className="h-4 w-4" />
                  Administration
                </Link>
              )}

            <form
              action={logout}
            >
              <button
                type="submit"
                className="asdro-button-secondary text-sm"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </form>
          </nav>

          {/* MOBILE */}

          <MobileMenu
            isAdmin={isAdmin}
            backHref={backHref}
            backLabel={backLabel}
          />
        </div>
      </div>
    </header>
  );
}
