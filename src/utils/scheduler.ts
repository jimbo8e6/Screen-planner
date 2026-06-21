import { nanoid } from 'nanoid';
import type { Film, Show, ScreenNumber, ScreeningType } from '../types';
import {
  showDurationMinutes,
  slotDurationMinutes,
  showEndMinute,
  isWeekend,
  WEEKDAY_START_MIN,
  WEEKDAY_START_MAX,
  WEEKEND_START_MIN,
  WEEKEND_START_MAX,
  TARGET_END_MIN,
  TARGET_END_MAX,
  DAY_END_HARD,
  CLEANING_MINUTES,
} from './time';
import { addDays, format } from 'date-fns';

const SCREENS: ScreenNumber[] = [1, 2, 3];

interface Slot {
  start: number;
  end: number; // exclusive (end of cleaning gap)
  filmId: string;
  showId: string;
}

type DaySchedule = Record<ScreenNumber, Slot[]>;

function dateStr(weekStart: string, dayIndex: number): string {
  return format(addDays(new Date(weekStart), dayIndex), 'yyyy-MM-dd');
}

function findAvailableStart(
  slots: Slot[],
  afterMinute: number,
  duration: number
): number | null {
  const sorted = [...slots].sort((a, b) => a.start - b.start);
  let candidate = afterMinute;
  for (const slot of sorted) {
    if (candidate + duration <= slot.start) break;
    if (slot.end > candidate) candidate = slot.end;
  }
  if (candidate + duration > DAY_END_HARD) return null;
  return candidate;
}

function hasConflict(slots: Slot[], start: number, end: number): boolean {
  return slots.some((s) => start < s.end && end > s.start);
}

function buildIdealStartTimes(
  runtime: number,
  firstStart: number,
  targetEnd: number
): number[] {
  const showDur = showDurationMinutes(runtime);
  const slotDur = slotDurationMinutes(runtime);

  const lastStart = targetEnd - showDur;
  if (lastStart < firstStart) return [firstStart];

  const times: number[] = [];
  let t = lastStart;
  while (t >= firstStart) {
    times.unshift(t);
    t -= slotDur;
  }
  if (times.length === 0 || times[0] < firstStart) {
    if (times.length > 0) times[0] = firstStart;
    else times.push(firstStart);
  }
  return times;
}

export function buildSchedule(
  weekStart: string,
  films: Film[],
  existingFixed: Show[]
): Show[] {
  const generated: Show[] = [];

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const date = dateStr(weekStart, dayIdx);
    const weekend = isWeekend(dayIdx);
    const firstStartBase = weekend ? WEEKEND_START_MIN : WEEKDAY_START_MIN;
    const firstStartMax = weekend ? WEEKEND_START_MAX : WEEKDAY_START_MAX;

    // Seed day schedule with existing fixed shows
    const daySchedule: DaySchedule = { 1: [], 2: [], 3: [] };
    const fixedToday = existingFixed.filter((s) => s.date === date);
    for (const s of fixedToday) {
      const film = films.find((f) => f.id === s.filmId);
      if (!film) continue;
      const slotEnd = showEndMinute(s.startMinute, film.runtime) + CLEANING_MINUTES;
      daySchedule[s.screen].push({ start: s.startMinute, end: slotEnd, filmId: s.filmId, showId: s.id });
    }

    // ── Special screenings (Senior, Film Club, Cine Circle, Toddlervision, Penguins) ──
    // One-off shows on a specific day. Fixed time → placed exactly; no time → auto-placed.
    for (const film of films) {
      const ss = film.specialScreening;
      if (!ss || ss.day !== dayIdx) continue;

      const slotDur = slotDurationMinutes(film.runtime);
      const showDur = showDurationMinutes(film.runtime);
      const screensToTry: ScreenNumber[] = ss.screen ? [ss.screen] : SCREENS;

      if (ss.time !== undefined) {
        for (const screen of screensToTry) {
          const slotEnd = ss.time + slotDur;
          if (!hasConflict(daySchedule[screen], ss.time, slotEnd)) {
            const id = nanoid();
            daySchedule[screen].push({ start: ss.time, end: slotEnd, filmId: film.id, showId: id });
            generated.push({
              id, filmId: film.id, screen, date,
              startMinute: ss.time, isFixed: true, isSenior: ss.type === 'senior',
              screeningType: ss.type as ScreeningType,
            });
            break;
          }
        }
      } else {
        for (const screen of screensToTry) {
          const start = findAvailableStart(daySchedule[screen], firstStartBase, slotDur);
          if (start !== null && start <= DAY_END_HARD - showDur) {
            const id = nanoid();
            daySchedule[screen].push({ start, end: start + slotDur, filmId: film.id, showId: id });
            generated.push({
              id, filmId: film.id, screen, date,
              startMinute: start, isFixed: false, isSenior: ss.type === 'senior',
              screeningType: ss.type as ScreeningType,
            });
            break;
          }
        }
      }
    }

    // ── Regular scheduling ──
    // Exclude films that are handled as special/senior one-offs.
    const filmsToday: Film[] = films.filter((film) => {
      if (film.specialScreening || film.isSeniorFilm) return false;
      if (film.terms.type === 'specific-days' || film.terms.type === 'split') {
        return film.terms.specificDays?.includes(dayIdx) ?? false;
      }
      return true;
    });

    const targetEnd =
      TARGET_END_MIN + Math.round(Math.random() * (TARGET_END_MAX - TARGET_END_MIN));

    const isAllDay = (t: string) => t === 'all-shows' || t === 'split';
    const orderedFilms = [...filmsToday].sort((a, b) => {
      if (isAllDay(a.terms.type) && !isAllDay(b.terms.type)) return -1;
      if (!isAllDay(a.terms.type) && isAllDay(b.terms.type)) return 1;
      return 0;
    });

    for (let filmIdx = 0; filmIdx < orderedFilms.length; filmIdx++) {
      const film = orderedFilms[filmIdx];
      const showDur = showDurationMinutes(film.runtime);
      const slotDur = slotDurationMinutes(film.runtime);
      const alreadyFixed = fixedToday.filter((s) => s.filmId === film.id);

      if (film.terms.type === 'last-house') {
        const lateStart = targetEnd - showDur;
        for (const screen of SCREENS) {
          const start = findAvailableStart(daySchedule[screen], lateStart, slotDur);
          if (start !== null && start <= DAY_END_HARD - showDur) {
            const id = nanoid();
            daySchedule[screen].push({ start, end: start + slotDur, filmId: film.id, showId: id });
            generated.push({ id, filmId: film.id, screen, date, startMinute: start, isFixed: false, isSenior: false });
            break;
          }
        }
        continue;
      }

      if (film.terms.type === 'one-per-day') {
        if (alreadyFixed.length > 0) continue;
        const preferredScreenOrder = SCREENS.map((_, i) => SCREENS[(filmIdx + dayIdx + i) % 3]);
        const preferStart = firstStartBase + Math.round(Math.random() * (firstStartMax - firstStartBase));
        for (const screen of preferredScreenOrder) {
          const start = findAvailableStart(daySchedule[screen], preferStart, slotDur);
          if (start !== null) {
            const id = nanoid();
            daySchedule[screen].push({ start, end: start + slotDur, filmId: film.id, showId: id });
            generated.push({ id, filmId: film.id, screen, date, startMinute: start, isFixed: false, isSenior: false });
            break;
          }
        }
        continue;
      }

      if (film.terms.type === 'last-two') {
        const idealTimes = buildIdealStartTimes(film.runtime, firstStartBase, targetEnd);
        const lastTwo = idealTimes.slice(-2);
        for (let i = 0; i < lastTwo.length; i++) {
          const screenIdx = (i + filmIdx + dayIdx) % 3;
          const screen = SCREENS[screenIdx];
          const start = findAvailableStart(daySchedule[screen], lastTwo[i], slotDur);
          if (start !== null && start <= DAY_END_HARD - showDur) {
            const id = nanoid();
            daySchedule[screen].push({ start, end: start + slotDur, filmId: film.id, showId: id });
            generated.push({ id, filmId: film.id, screen, date, startMinute: start, isFixed: false, isSenior: false });
          }
        }
        continue;
      }

      // 'all-shows', 'split' (on qualifying days), and 'specific-days':
      // Rotate the SCREEN on each time slot so no film occupies Screen 1 all day.
      // Slot i for film j on day d → screen (i + j + d) % 3.
      // This guarantees each film cycles through Sc1→Sc2→Sc3→Sc1… across the day
      // and that Screen 1 gets a different film at each time slot.
      const idealTimes = buildIdealStartTimes(film.runtime, firstStartBase, targetEnd);

      for (let i = 0; i < idealTimes.length; i++) {
        const screenIdx = (i + filmIdx + dayIdx) % 3;
        const screen = SCREENS[screenIdx];
        const jitter = Math.round(Math.random() * (firstStartMax - firstStartBase));
        const triedStart = idealTimes[i] === firstStartBase ? idealTimes[i] + jitter : idealTimes[i];
        const start = findAvailableStart(daySchedule[screen], triedStart, slotDur);
        if (start !== null && start <= DAY_END_HARD - showDur) {
          const id = nanoid();
          daySchedule[screen].push({ start, end: start + slotDur, filmId: film.id, showId: id });
          generated.push({ id, filmId: film.id, screen, date, startMinute: start, isFixed: false, isSenior: false });
        }
      }
    }
  }

  return generated;
}

// Fill any screens that are still missing shows for 'all-shows' films.
// With the per-slot rotation above this is usually a no-op, but handles
// edge cases where conflicts blocked placement in some screens.
export function fillAdditionalScreens(
  weekStart: string,
  films: Film[],
  currentShows: Show[]
): Show[] {
  const extra: Show[] = [];

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const date = dateStr(weekStart, dayIdx);
    const weekend = isWeekend(dayIdx);
    const firstStartBase = weekend ? WEEKEND_START_MIN : WEEKDAY_START_MIN;
    const firstStartMax = weekend ? WEEKEND_START_MAX : WEEKDAY_START_MAX;

    const allFilms = films.filter((f) => {
      if (f.specialScreening || f.isSeniorFilm) return false;
      if (f.terms.type === 'all-shows') return true;
      if (f.terms.type === 'split' || f.terms.type === 'specific-days') {
        return f.terms.specificDays?.includes(dayIdx) ?? false;
      }
      return false;
    });

    const dayShows = [...currentShows, ...extra].filter((s) => s.date === date);

    for (const film of allFilms) {
      const showDur = showDurationMinutes(film.runtime);
      const slotDur = slotDurationMinutes(film.runtime);
      const filmShows = dayShows.filter((s) => s.filmId === film.id);

      const daySchedule: DaySchedule = { 1: [], 2: [], 3: [] };
      for (const s of dayShows) {
        const f = films.find((f2) => f2.id === s.filmId);
        if (!f) continue;
        daySchedule[s.screen].push({
          start: s.startMinute,
          end: showEndMinute(s.startMinute, f.runtime) + CLEANING_MINUTES,
          filmId: s.filmId,
          showId: s.id,
        });
      }

      const usedScreens = new Set(filmShows.map((s) => s.screen));
      const freeScreens = SCREENS.filter((sc) => !usedScreens.has(sc));

      for (const screen of freeScreens) {
        const targetEnd = TARGET_END_MIN + 15;
        const idealTimes = buildIdealStartTimes(film.runtime, firstStartBase, targetEnd);
        for (const idealStart of idealTimes) {
          const jitter = Math.round(Math.random() * (firstStartMax - firstStartBase));
          const triedStart = idealStart === firstStartBase ? idealStart + jitter : idealStart;
          const start = findAvailableStart(daySchedule[screen], triedStart, slotDur);
          if (start !== null && start <= DAY_END_HARD - showDur) {
            const id = nanoid();
            daySchedule[screen].push({ start, end: start + slotDur, filmId: film.id, showId: id });
            extra.push({ id, filmId: film.id, screen, date, startMinute: start, isFixed: false, isSenior: false });
          }
        }
      }
    }
  }

  return extra;
}
