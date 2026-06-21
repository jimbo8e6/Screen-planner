import { nanoid } from 'nanoid';
import type { Film, Show, ScreenNumber, ScreeningType } from '../types';
import {
  showDurationMinutes,
  slotDurationMinutes,
  showEndMinute,
  isWeekend,
  isThursday,
  WEEKDAY_START_MIN,
  WEEKDAY_START_MAX,
  WEEKEND_START_MIN,
  WEEKEND_START_MAX,
  TARGET_END_MIN,
  TARGET_END_MAX,
  SENIOR_START,
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

// Find available start time in a screen after any existing shows
function findAvailableStart(
  slots: Slot[],
  afterMinute: number,
  duration: number // show+cleaning
): number | null {
  const sorted = [...slots].sort((a, b) => a.start - b.start);
  let candidate = afterMinute;
  for (const slot of sorted) {
    if (candidate + duration <= slot.start) break; // fits before this slot
    if (slot.end > candidate) candidate = slot.end; // push after this slot
  }
  if (candidate + duration > DAY_END_HARD) return null;
  return candidate;
}

// Check if a new slot conflicts with existing slots
function hasConflict(slots: Slot[], start: number, end: number): boolean {
  return slots.some((s) => start < s.end && end > s.start);
}

// Build a list of ideal show start times for a day/screen working backwards
// from the target end window so the last show ends ~9-9:30 PM
function buildIdealStartTimes(
  runtime: number,
  firstStart: number,
  targetEnd: number
): number[] {
  const showDur = showDurationMinutes(runtime);
  const slotDur = slotDurationMinutes(runtime);

  // Last show: start so it ends at targetEnd
  const lastStart = targetEnd - showDur;
  if (lastStart < firstStart) return [firstStart];

  const times: number[] = [];
  let t = lastStart;
  while (t >= firstStart) {
    times.unshift(t);
    t -= slotDur;
  }
  // Always ensure at least one show at or after firstStart
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

  // Process 7 days
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const date = dateStr(weekStart, dayIdx);
    const weekend = isWeekend(dayIdx);
    const thursday = isThursday(dayIdx);
    const firstStartBase = weekend ? WEEKEND_START_MIN : WEEKDAY_START_MIN;
    const firstStartMax = weekend ? WEEKEND_START_MAX : WEEKDAY_START_MAX;

    // Build current day schedule from fixed shows
    const daySchedule: DaySchedule = { 1: [], 2: [], 3: [] };
    const fixedToday = existingFixed.filter((s) => s.date === date);
    for (const s of fixedToday) {
      const film = films.find((f) => f.id === s.filmId);
      if (!film) continue;
      const slotEnd = showEndMinute(s.startMinute, film.runtime) + CLEANING_MINUTES;
      daySchedule[s.screen].push({
        start: s.startMinute,
        end: slotEnd,
        filmId: s.filmId,
        showId: s.id,
      });
    }

    // ── Senior screening (Thursday 10:30) ──
    if (thursday) {
      const seniorFilm = films.find((f) => f.isSeniorFilm);
      if (seniorFilm) {
        const slotEnd =
          showEndMinute(SENIOR_START, seniorFilm.runtime) + CLEANING_MINUTES;
        if (!hasConflict(daySchedule[2], SENIOR_START, slotEnd)) {
          const id = nanoid();
          daySchedule[2].push({
            start: SENIOR_START,
            end: slotEnd,
            filmId: seniorFilm.id,
            showId: id,
          });
          generated.push({
            id,
            filmId: seniorFilm.id,
            screen: 2,
            date,
            startMinute: SENIOR_START,
            isFixed: false,
            isSenior: true,
          });
        }
      }
    }

    // ── Special screenings (Film Club, Cine Circle, Toddlervision, Penguins) ──
    // These are one-off shows on a specific day. If a time is provided it's
    // fixed; if not, the scheduler auto-places it like any regular show.
    for (const film of films) {
      const ss = film.specialScreening;
      if (!ss || ss.day !== dayIdx) continue;

      const slotDur = slotDurationMinutes(film.runtime);
      const showDur = showDurationMinutes(film.runtime);

      if (ss.time !== undefined) {
        // Fixed time — place exactly here on any free screen
        for (const screen of SCREENS) {
          const slotEnd = ss.time + slotDur;
          if (!hasConflict(daySchedule[screen], ss.time, slotEnd)) {
            const id = nanoid();
            daySchedule[screen].push({ start: ss.time, end: slotEnd, filmId: film.id, showId: id });
            generated.push({
              id, filmId: film.id, screen, date,
              startMinute: ss.time, isFixed: true, isSenior: false,
              screeningType: ss.type as ScreeningType,
            });
            break;
          }
        }
      } else {
        // Auto-place: find best free slot, prefer evening
        const preferStart = firstStartBase;
        for (const screen of SCREENS) {
          const start = findAvailableStart(daySchedule[screen], preferStart, slotDur);
          if (start !== null && start <= DAY_END_HARD - showDur) {
            const id = nanoid();
            daySchedule[screen].push({ start, end: start + slotDur, filmId: film.id, showId: id });
            generated.push({
              id, filmId: film.id, screen, date,
              startMinute: start, isFixed: false, isSenior: false,
              screeningType: ss.type as ScreeningType,
            });
            break;
          }
        }
      }
    }

    // ── Determine which films need scheduling today ──
    // Films with a specialScreening are a single one-off show handled above;
    // exclude them from the regular scheduling pass entirely.
    const filmsToday: Film[] = films.filter((film) => {
      if (film.specialScreening) return false;
      if (film.terms.type === 'specific-days') {
        return film.terms.specificDays?.includes(dayIdx) ?? false;
      }
      return true; // all-shows, one-per-day, last-house all run every day
    });

    // ── Screen 1 rotation tracking ──
    // We track which screen each film will use for the "4pm" slot each day
    // to ensure Screen 1 rotates
    // Simple approach: on day N, for show slot index i, assign screens as
    // (filmIndex + dayIdx) mod 3 to rotate.

    const targetEnd =
      TARGET_END_MIN + Math.round(Math.random() * (TARGET_END_MAX - TARGET_END_MIN));

    // Sort films by priority: senior first, then all-shows, then others
    const orderedFilms = [...filmsToday].sort((a, b) => {
      if (a.isSeniorFilm && !b.isSeniorFilm) return -1;
      if (!a.isSeniorFilm && b.isSeniorFilm) return 1;
      if (a.terms.type === 'all-shows' && b.terms.type !== 'all-shows') return -1;
      if (a.terms.type !== 'all-shows' && b.terms.type === 'all-shows') return 1;
      return 0;
    });

    // For each film, generate its shows for this day
    for (let filmIdx = 0; filmIdx < orderedFilms.length; filmIdx++) {
      const film = orderedFilms[filmIdx];
      const showDur = showDurationMinutes(film.runtime);
      const slotDur = slotDurationMinutes(film.runtime);

      // Already has fixed shows today for this film?
      const alreadyFixed = fixedToday.filter((s) => s.filmId === film.id);

      if (film.terms.type === 'last-house') {
        // Schedule only one show, as late as possible without breaching DAY_END_HARD
        // but trying to end ~9-9:30 PM on the last possible later-evening show
        const lateStart = targetEnd - showDur;
        // Find a free screen for this
        for (const screen of SCREENS) {
          const start = findAvailableStart(daySchedule[screen], lateStart, slotDur);
          if (start !== null && start <= DAY_END_HARD - showDur) {
            const id = nanoid();
            const end = start + slotDur;
            daySchedule[screen].push({ start, end, filmId: film.id, showId: id });
            generated.push({
              id,
              filmId: film.id,
              screen,
              date,
              startMinute: start,
              isFixed: false,
              isSenior: false,
            });
            break;
          }
        }
        continue;
      }

      if (film.terms.type === 'one-per-day') {
        if (alreadyFixed.length > 0) continue; // already placed
        // Rotate screens: day index shifts which screen this film uses
        const preferredScreenOrder = SCREENS.map(
          (_, i) => SCREENS[(filmIdx + dayIdx + i) % 3]
        );
        const preferStart = firstStartBase + Math.round(Math.random() * (firstStartMax - firstStartBase));
        for (const screen of preferredScreenOrder) {
          const start = findAvailableStart(daySchedule[screen], preferStart, slotDur);
          if (start !== null) {
            const id = nanoid();
            daySchedule[screen].push({ start, end: start + slotDur, filmId: film.id, showId: id });
            generated.push({
              id, filmId: film.id, screen, date, startMinute: start, isFixed: false, isSenior: false,
            });
            break;
          }
        }
        continue;
      }

      // 'all-shows' (and 'specific-days' behaves like all-shows on those days)
      // Build ideal times for all 3 screens, rotating which screen starts first each day
      // to satisfy the Screen 1 accessibility rotation rule.
      const idealTimes = buildIdealStartTimes(film.runtime, firstStartBase, targetEnd);

      // Assign screens in rotation based on dayIdx
      // On day 0: film uses Screen (filmIdx % 3), on day 1: ((filmIdx+1) % 3), etc.
      const baseScreen = (filmIdx + dayIdx) % 3;
      const screenOrder: ScreenNumber[] = [
        SCREENS[baseScreen],
        SCREENS[(baseScreen + 1) % 3],
        SCREENS[(baseScreen + 2) % 3],
      ];

      for (const screen of screenOrder) {
        for (const idealStart of idealTimes) {
          const jitter = Math.round(Math.random() * (firstStartMax - firstStartBase));
          const triedStart = idealStart === firstStartBase ? idealStart + jitter : idealStart;
          const start = findAvailableStart(daySchedule[screen], triedStart, slotDur);
          if (start !== null && start <= DAY_END_HARD - showDur) {
            const id = nanoid();
            daySchedule[screen].push({ start, end: start + slotDur, filmId: film.id, showId: id });
            generated.push({
              id, filmId: film.id, screen, date, startMinute: start, isFixed: false, isSenior: false,
            });
          }
        }
        break; // one screen per film for 'all-shows' — place in one screen per pass
        // To fill multiple screens with same film, remove this break
      }
    }
  }

  return generated;
}

// Attempt to place shows in multiple screens for "all-shows" films
// This is a separate pass to fill remaining screens after first pass
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

    const allFilms = films.filter((f) =>
      !f.specialScreening && (f.terms.type === 'all-shows' || f.terms.type === 'specific-days')
    );

    const dayShows = [...currentShows, ...extra].filter((s) => s.date === date);

    for (const film of allFilms) {
      const showDur = showDurationMinutes(film.runtime);
      const slotDur = slotDurationMinutes(film.runtime);
      const filmShows = dayShows.filter((s) => s.filmId === film.id);

      // Build occupied slots per screen
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

      // Find screens that don't yet have this film
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
            extra.push({
              id, filmId: film.id, screen, date, startMinute: start, isFixed: false, isSenior: false,
            });
          }
        }
      }
    }
  }

  return extra;
}
