/**
 * DB already stores Indian time. JS parses it as UTC then the browser
 * adds the local offset again. Using timeZone:"UTC" prevents the
 * double-conversion and displays the stored value as-is.
 */

/** Format as "29 Mar 2026, 2:45 pm" */
export function formatIST(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format as "29 Mar, 2:45 pm" (no year, compact) */
export function formatISTShort(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format time only as "2:45:30 pm" */
export function formatISTTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
