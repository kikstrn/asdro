"use client";

import {
  useState,
} from "react";

import {
  Eye,
  EyeOff,
} from "lucide-react";

type PasswordInputProps = {
  id?: string;
  name?: string;
  placeholder?: string;
  autoComplete?:
    | "current-password"
    | "new-password";
  minLength?: number;
};

export function PasswordInput({
  id = "password",
  name = "password",
  placeholder = "Votre mot de passe",
  autoComplete = "current-password",
  minLength,
}: PasswordInputProps) {
  const [
    visible,
    setVisible,
  ] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={
          visible
            ? "text"
            : "password"
        }
        required
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="asdro-input pr-12"
      />

      <button
        type="button"
        onClick={() =>
          setVisible(
            (current) =>
              !current
          )
        }
        aria-label={
          visible
            ? "Masquer le mot de passe"
            : "Afficher le mot de passe"
        }
        aria-pressed={visible}
        className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-[#b8f536]"
      >
        {visible ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}