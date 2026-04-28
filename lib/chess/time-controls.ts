/**
 * Catalog of supported time controls for chess matchmaking.
 * Stored as a typed array so server actions and the lobby picker share one
 * source of truth.
 */

export type TimeControlId = "blitz5" | "rapid10" | "rapid15";

export type TimeControl = {
  id: TimeControlId;
  label: string;
  /** Category badge ("Blitz" / "Rapid" / …) shown in the picker. */
  category: string;
  initialMs: number;
  incrementMs: number;
};

export const TIME_CONTROLS: TimeControl[] = [
  {
    id: "blitz5",
    label: "5 min",
    category: "Blitz",
    initialMs: 5 * 60 * 1000,
    incrementMs: 0,
  },
  {
    id: "rapid10",
    label: "10 min",
    category: "Rapid",
    initialMs: 10 * 60 * 1000,
    incrementMs: 0,
  },
  {
    id: "rapid15",
    label: "15 min",
    category: "Rapid",
    initialMs: 15 * 60 * 1000,
    incrementMs: 0,
  },
];

export const DEFAULT_TIME_CONTROL_ID: TimeControlId = "blitz5";

/** Looks up a time control by id, falling back to the default. */
export function resolveTimeControl(id: string | null | undefined): TimeControl {
  return (
    TIME_CONTROLS.find((tc) => tc.id === id) ??
    TIME_CONTROLS.find((tc) => tc.id === DEFAULT_TIME_CONTROL_ID) ??
    TIME_CONTROLS[0]
  );
}
