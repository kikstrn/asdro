"use client";

import {
  useRef,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CalendarDays,
} from "lucide-react";

type DatePickerProps = {
  value: string;
  min?: string;
  max?: string;
};

export function DatePicker({
  value,
  min,
  max,
}: DatePickerProps) {
  const router =
    useRouter();

  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  function openPicker() {
    const input =
      inputRef.current;

    if (!input) {
      return;
    }

    try {
      input.showPicker();
    } catch {
      input.focus();
      input.click();
    }
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const date =
      event.target.value;

    if (!date) {
      return;
    }

    router.push(
      `/?date=${encodeURIComponent(
        date
      )}`
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={
          openPicker
        }
        className="flex items-center justify-center gap-2"
      >
        <CalendarDays className="h-5 w-5 text-[#b8f536]" />

        <span className="text-sm font-semibold">
          Choisir une date
        </span>
      </button>

      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={
          handleChange
        }
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
    </div>
  );
}