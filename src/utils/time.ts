export const TRAILERS_MINUTES = 20;
export const CLEANING_MINUTES = 20;

export const WEEKDAY_START_MIN = 16 * 60; // 4:00 PM
export const WEEKDAY_START_MAX = 16 * 60 + 30; // 4:30 PM
export const WEEKEND_START_MIN = 13 * 60; // 1:00 PM
export const WEEKEND_START_MAX = 13 * 60 + 30; // 1:30 PM

export const TARGET_END_MIN = 21 * 60; // 9:00 PM
export const TARGET_END_MAX = 21 * 60 + 30; // 9:30 PM

export const SENIOR_START = 10 * 60 + 30; // 10:30 AM Thursday
export const DAY_END_HARD = 23 * 60 + 30; // 11:30 PM absolute latest

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function showDurationMinutes(runtime: number): number {
  return runtime + TRAILERS_MINUTES;
}

export function slotDurationMinutes(runtime: number): number {
  return runtime + TRAILERS_MINUTES + CLEANING_MINUTES;
}

export function showEndMinute(startMinute: number, runtime: number): number {
  return startMinute + showDurationMinutes(runtime);
}

// Week runs Fri–Thu (0=Fri, 1=Sat, 2=Sun, 3=Mon, 4=Tue, 5=Wed, 6=Thu)
export function isWeekend(dayIndex: number): boolean {
  return dayIndex === 1 || dayIndex === 2; // Sat=1, Sun=2
}

export function isThursday(dayIndex: number): boolean {
  return dayIndex === 6; // Thu is the last day of the cinema week
}

export function getDefaultFirstStart(dayIndex: number): number {
  return isWeekend(dayIndex) ? WEEKEND_START_MIN : WEEKDAY_START_MIN;
}
