"use client";

import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TIME_CONTROLS,
  type TimeControl,
  type TimeControlId,
} from "@/lib/chess/time-controls";

type TimeControlPickerProps = {
  value: TimeControlId;
  onChange: (id: TimeControlId) => void;
};

/**
 * Time-control selector for the lobby. Renders the active control as a
 * button; clicking opens a popover listing all available controls grouped
 * loosely by category badge.
 */
export function TimeControlPicker({ value, onChange }: TimeControlPickerProps) {
  const [open, setOpen] = useState(false);
  const active = TIME_CONTROLS.find((tc) => tc.id === value) ?? TIME_CONTROLS[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="btn-3d-dark flex h-14 w-full items-center justify-between rounded-md px-5 text-[15px] font-semibold text-white ring-1 ring-white/5"
        >
          <span className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-navy-300" strokeWidth={2} />
            {active.label} ({active.category})
          </span>
          <ChevronDown
            className="h-4 w-4 text-navy-300"
            strokeWidth={2.25}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] rounded-md border-white/10 bg-navy-900 p-1.5"
      >
        <ul className="flex flex-col gap-1">
          {TIME_CONTROLS.map((tc) => (
            <li key={tc.id}>
              <Option
                tc={tc}
                active={tc.id === value}
                onClick={() => {
                  onChange(tc.id);
                  setOpen(false);
                }}
              />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function Option({
  tc,
  active,
  onClick,
}: {
  tc: TimeControl;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition ${
        active
          ? "bg-white/[0.06] text-white"
          : "text-navy-200 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <span className="flex items-center gap-2.5 text-[14px] font-semibold">
        <Clock className="h-4 w-4 text-navy-400" strokeWidth={2} />
        {tc.label}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-navy-400">
        {tc.category}
      </span>
    </button>
  );
}
