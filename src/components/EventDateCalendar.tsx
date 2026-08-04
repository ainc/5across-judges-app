"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { formatEventDate } from "@/lib/competition-results";
import "react-day-picker/style.css";

type EventDateCalendarProps = {
  value: string;
  onChange: (value: string) => void;
};

const YEAR_RANGE = 16;

function getCalendarBounds() {
  const year = new Date().getFullYear();
  return {
    startMonth: new Date(year - YEAR_RANGE, 0),
    endMonth: new Date(year + 5, 11),
  };
}

function parseIsoDate(value: string): Date | undefined {
  const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EventDateCalendar({ value, onChange }: EventDateCalendarProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);
  const [month, setMonth] = useState<Date>(() => selected ?? new Date());
  const { startMonth, endMonth } = getCalendarBounds();

  useEffect(() => {
    if (selected) {
      setMonth(selected);
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const displayLabel = value ? formatEventDate(value) : "Select event date";

  return (
    <div ref={containerRef} className="event-date-calendar relative mt-2">
      <button
        type="button"
        className="event-date-calendar-trigger flex w-full items-center justify-between rounded border bg-white px-3 py-2 text-left"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value ? "font-medium" : "text-gray-500"}>{displayLabel}</span>
        <span className="text-sm text-gray-500" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open ? (
        <div
          id={listboxId}
          role="dialog"
          aria-label="Choose event date"
          className="event-date-calendar-popover absolute left-0 top-full z-50 mt-1 rounded border bg-white p-3 shadow-lg"
        >
          <DayPicker
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              onChange(toIsoDate(date));
              setOpen(false);
            }}
            captionLayout="dropdown-years"
            navLayout="around"
            reverseYears
            startMonth={startMonth}
            endMonth={endMonth}
          />
        </div>
      ) : null}
    </div>
  );
}
