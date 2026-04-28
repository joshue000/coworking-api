/**
 * Converts HH:mm string to total minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Checks if two time ranges overlap (inclusive start, exclusive end).
 */
export function doTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

/**
 * Returns the start and end DateTime of the ISO week containing the given date.
 */
export function getWeekBounds(date: Date): { weekStart: Date; weekEnd: Date } {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);

  const weekStart = new Date(d);
  weekStart.setUTCDate(d.getUTCDate() + diffToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  return { weekStart, weekEnd };
}

/**
 * Checks if a UTC timestamp is within the office hours of a given timezone.
 */
export function isWithinOfficeHours(
  timestamp: Date,
  opensAt: string,
  closesAt: string,
  timezone: string
): boolean {
  const localTime = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(timestamp);

  const [h, m] = localTime.split(":").map(Number);
  const currentMinutes = h * 60 + m;
  const openMinutes = timeToMinutes(opensAt);
  const closeMinutes = timeToMinutes(closesAt);

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
