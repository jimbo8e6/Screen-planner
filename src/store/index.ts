import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import type { Film, Show, ScreenNumber, FilmTerms } from '../types';
import { nextColor } from '../utils/colors';
import { buildSchedule, fillAdditionalScreens } from '../utils/scheduler';

interface State {
  weekStart: string;
  films: Film[];
  shows: Show[];
  tmdbApiKey: string;
  zoom: number;
  selectedDay: number;

  setTmdbApiKey: (key: string) => void;
  setZoom: (z: number) => void;
  setSelectedDay: (d: number) => void;
  nextWeek: () => void;
  prevWeek: () => void;

  addFilm: (film: Omit<Film, 'id' | 'color' | 'terms' | 'isSeniorFilm'>) => void;
  removeFilm: (id: string) => void;
  updateFilmTerms: (id: string, terms: FilmTerms) => void;
  toggleSeniorFilm: (id: string) => void;

  addFixedShow: (show: Omit<Show, 'id'>) => void;
  removeShow: (id: string) => void;
  moveShow: (id: string, screen: ScreenNumber, startMinute: number) => void;

  autoSchedule: () => void;
  clearGeneratedShows: () => void;
}

function fridayOf(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 5 }), 'yyyy-MM-dd');
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      weekStart: fridayOf(new Date()),
      films: [],
      shows: [],
      tmdbApiKey: '',
      zoom: 2, // px per minute
      selectedDay: 0,

      setTmdbApiKey: (key) => set({ tmdbApiKey: key }),
      setZoom: (z) => set({ zoom: Math.max(1, Math.min(4, z)) }),
      setSelectedDay: (d) => set({ selectedDay: d }),

      nextWeek: () =>
        set((s) => ({ weekStart: fridayOf(addWeeks(new Date(s.weekStart), 1)) })),
      prevWeek: () =>
        set((s) => ({ weekStart: fridayOf(subWeeks(new Date(s.weekStart), 1)) })),

      addFilm: (filmData) => {
        const film: Film = {
          ...filmData,
          id: nanoid(),
          color: nextColor(),
          terms: { type: 'all-shows' },
          isSeniorFilm: false,
        };
        set((s) => ({ films: [...s.films, film] }));
      },

      removeFilm: (id) =>
        set((s) => ({
          films: s.films.filter((f) => f.id !== id),
          shows: s.shows.filter((sh) => sh.filmId !== id),
        })),

      updateFilmTerms: (id, terms) =>
        set((s) => ({
          films: s.films.map((f) => (f.id === id ? { ...f, terms } : f)),
        })),

      toggleSeniorFilm: (id) =>
        set((s) => ({
          films: s.films.map((f) =>
            f.id === id
              ? { ...f, isSeniorFilm: !f.isSeniorFilm }
              : { ...f, isSeniorFilm: false } // only one senior film at a time
          ),
        })),

      addFixedShow: (showData) => {
        const show: Show = { ...showData, id: nanoid() };
        set((s) => ({ shows: [...s.shows, show] }));
      },

      removeShow: (id) =>
        set((s) => ({ shows: s.shows.filter((sh) => sh.id !== id) })),

      moveShow: (id, screen, startMinute) =>
        set((s) => ({
          shows: s.shows.map((sh) =>
            sh.id === id ? { ...sh, screen, startMinute } : sh
          ),
        })),

      autoSchedule: () => {
        const { weekStart, films, shows } = get();
        const fixedShows = shows.filter((s) => s.isFixed || s.isSenior);
        // Clear previously auto-generated shows
        const generated = buildSchedule(weekStart, films, fixedShows);
        const extra = fillAdditionalScreens(weekStart, films, [
          ...fixedShows,
          ...generated,
        ]);
        set({ shows: [...fixedShows, ...generated, ...extra] });
      },

      clearGeneratedShows: () =>
        set((s) => ({ shows: s.shows.filter((sh) => sh.isFixed || sh.isSenior) })),
    }),
    {
      name: 'cinema-schedule',
      partialize: (s) => ({
        weekStart: s.weekStart,
        films: s.films,
        shows: s.shows,
        tmdbApiKey: s.tmdbApiKey,
        zoom: s.zoom,
      }),
    }
  )
);
