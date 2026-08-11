import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  LogOut,
  Settings,
} from "lucide-react";

import { logout } from "@/app/actions/auth";

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
          {/* LOGO / TITRE */}

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

            {isAdmin && !backHref && (
              <Link
                href="/admin"
                className="asdro-button-secondary text-sm"
              >
                <Settings className="h-4 w-4" />
                Administration
              </Link>
            )}

            <form action={logout}>
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

          <nav className="flex items-center gap-2 md:hidden">
            {/* PLANNING */}

            <Link
              href="/"
              aria-label="Planning"
              title="Planning"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
            >
              <CalendarDays className="h-5 w-5" />
            </Link>

            {/* ADMINISTRATION */}

            {isAdmin && !backHref && (
              <Link
                href="/admin"
                aria-label="Administration"
                title="Administration"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
              >
                <Settings className="h-5 w-5" />
              </Link>
            )}

            {/* DÉCONNEXION */}
            <form action={logout}>
              <button
                type="submit"
                aria-label="Déconnexion"
                title="Déconnexion"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </nav>
        </div>
      </div>
    </header>
  );
}