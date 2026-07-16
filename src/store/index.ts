import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import type { Film, Show, ScreenNumber, FilmTerms, SpecialScreening, ScreeningType, TicketType, PriceCard, SeatPlan } from '../types';
import { nextColor } from '../utils/colors';
import { buildSchedule, fillAdditionalScreens } from '../utils/scheduler';

interface State {
  weekStart: string;
  films: Film[];
  shows: Show[];
  tmdbApiKey: string;
  zoom: number;
  selectedDay: number;
  colorMode: 'per-film' | 'by-category';
  syncCode: string;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  focusedShowId: string | null;
  ticketTypes: TicketType[];
  priceCards: PriceCard[];
  screenCapacities: Record<ScreenNumber, number>;
  seatPlans: Record<ScreenNumber, SeatPlan>;
  ticketCounts: Record<string, number>;
  ticketBreakdown: Record<string, Record<string, number>>;

  setTmdbApiKey: (key: string) => void;
  setZoom: (z: number) => void;
  setSelectedDay: (d: number) => void;
  setColorMode: (m: 'per-film' | 'by-category') => void;
  setSyncCode: (code: string) => void;
  setSyncStatus: (s: 'idle' | 'syncing' | 'synced' | 'error') => void;
  setFocusedShowId: (id: string | null) => void;
  nextWeek: () => void;
  prevWeek: () => void;

  addFilm: (film: Omit<Film, 'id' | 'color' | 'terms' | 'isSeniorFilm'>) => void;
  removeFilm: (id: string) => void;
  archiveFilm: (id: string) => void;
  restoreFilm: (id: string) => void;
  updateFilmTerms: (id: string, terms: FilmTerms) => void;
  toggleSeniorFilm: (id: string) => void;
  setSpecialScreening: (id: string, screening: SpecialScreening | undefined) => void;
  setFilmAttributes: (id: string, attrs: ScreeningType[]) => void;

  addFixedShow: (show: Omit<Show, 'id'>) => void;
  removeShow: (id: string) => void;
  moveShow: (id: string, screen: ScreenNumber, startMinute: number) => void;
  openSessions: (showIds: string[]) => void;
  closeSession: (showId: string) => void;
  updateShowProperties: (showId: string, props: { ticketsSold?: number; priceCard?: string; screeningType?: ScreeningType | null }) => void;

  addTicketType: (name: string, price: number) => void;
  updateTicketType: (id: string, name: string, price: number) => void;
  removeTicketType: (id: string) => void;

  addPriceCard: (name: string, ticketTypeIds: string[]) => void;
  updatePriceCard: (id: string, name: string, ticketTypeIds: string[]) => void;
  removePriceCard: (id: string) => void;

  setScreenCapacity: (screen: ScreenNumber, capacity: number) => void;
  setSeatPlan: (screen: ScreenNumber, plan: SeatPlan) => void;
  setTicketSalesData: (counts: Record<string, number>, breakdown: Record<string, Record<string, number>>) => void;

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
      colorMode: 'per-film',
      syncCode: (() => { try { return localStorage.getItem('cinema-sync-code') ?? ''; } catch { return ''; } })(),
      syncStatus: 'idle' as const,
      focusedShowId: null,
      ticketTypes: [],
      priceCards: [],
      screenCapacities: { 1: 0, 2: 0, 3: 0 },
      seatPlans: {
        1: { screen: 1, cols: 12, rows: [] },
        2: { screen: 2, cols: 12, rows: [] },
        3: { screen: 3, cols: 12, rows: [] },
      },
      ticketCounts: {},
      ticketBreakdown: {},

      setTmdbApiKey: (key) => {
        // Persist API key under a stable key so it survives store version resets
        try { localStorage.setItem('tmdb-api-key', key); } catch { /* ignore */ }
        set({ tmdbApiKey: key });
      },
      setZoom: (z) => set({ zoom: Math.max(1, Math.min(4, z)) }),
      setSelectedDay: (d) => set({ selectedDay: d }),
      setColorMode: (m) => set({ colorMode: m }),
      setSyncCode: (code) => {
        try { localStorage.setItem('cinema-sync-code', code); } catch { /* ignore */ }
        set({ syncCode: code });
      },
      setSyncStatus: (s) => set({ syncStatus: s }),
      setFocusedShowId: (id) => set({ focusedShowId: id }),

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

      archiveFilm: (id) =>
        set((s) => ({
          films: s.films.map((f) => f.id === id ? { ...f, isArchived: true } : f),
        })),

      restoreFilm: (id) =>
        set((s) => ({
          films: s.films.map((f) => f.id === id ? { ...f, isArchived: false } : f),
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
              : { ...f, isSeniorFilm: false }
          ),
        })),

      setSpecialScreening: (id, screening) =>
        set((s) => ({
          films: s.films.map((f) =>
            f.id === id ? { ...f, specialScreening: screening } : f
          ),
        })),

      setFilmAttributes: (id, attrs) =>
        set((s) => ({
          films: s.films.map((f) =>
            f.id === id ? { ...f, attributes: attrs } : f
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
            sh.id === id ? { ...sh, screen, startMinute, isFixed: true } : sh
          ),
        })),

      openSessions: (showIds) =>
        set((s) => ({
          shows: s.shows.map((sh) =>
            showIds.includes(sh.id) ? { ...sh, isOpen: true } : sh
          ),
        })),

      closeSession: (showId) =>
        set((s) => ({
          shows: s.shows.map((sh) =>
            sh.id === showId ? { ...sh, isOpen: false } : sh
          ),
        })),

      updateShowProperties: (showId, { screeningType, ...rest }) =>
        set((s) => ({
          shows: s.shows.map((sh) => {
            if (sh.id !== showId) return sh;
            const updated = { ...sh, ...rest };
            if (screeningType === null) delete updated.screeningType;
            else if (screeningType !== undefined) updated.screeningType = screeningType;
            return updated;
          }),
        })),

      addTicketType: (name, price) =>
        set((s) => ({
          ticketTypes: [...s.ticketTypes, { id: nanoid(), name: name.trim(), price }],
        })),

      updateTicketType: (id, name, price) =>
        set((s) => ({
          ticketTypes: s.ticketTypes.map((t) =>
            t.id === id ? { ...t, name: name.trim(), price } : t
          ),
        })),

      removeTicketType: (id) =>
        set((s) => ({
          ticketTypes: s.ticketTypes.filter((t) => t.id !== id),
          // strip from any price cards that reference it
          priceCards: s.priceCards.map((pc) => ({
            ...pc,
            ticketTypeIds: pc.ticketTypeIds.filter((tid) => tid !== id),
          })),
        })),

      addPriceCard: (name, ticketTypeIds) =>
        set((s) => ({
          priceCards: [...s.priceCards, { id: nanoid(), name: name.trim(), ticketTypeIds }],
        })),

      updatePriceCard: (id, name, ticketTypeIds) =>
        set((s) => ({
          priceCards: s.priceCards.map((pc) =>
            pc.id === id ? { ...pc, name: name.trim(), ticketTypeIds } : pc
          ),
        })),

      removePriceCard: (id) =>
        set((s) => ({
          priceCards: s.priceCards.filter((pc) => pc.id !== id),
        })),

      setScreenCapacity: (screen, capacity) =>
        set((s) => ({
          screenCapacities: { ...s.screenCapacities, [screen]: Math.max(0, capacity) },
        })),

      setSeatPlan: (screen, plan) =>
        set((s) => ({
          seatPlans: { ...s.seatPlans, [screen]: plan },
        })),

      setTicketSalesData: (counts, breakdown) =>
        set({ ticketCounts: counts, ticketBreakdown: breakdown }),

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
      version: 3,
      migrate: (stored) => stored, // accept any prior version as-is
      onRehydrateStorage: () => (state) => {
        // Recover API key from stable key if the main store was reset
        if (state && !state.tmdbApiKey) {
          try {
            const saved = localStorage.getItem('tmdb-api-key');
            if (saved) state.tmdbApiKey = saved;
          } catch { /* ignore */ }
        }
      },
      partialize: (s) => ({
        weekStart: s.weekStart,
        films: s.films,
        shows: s.shows,
        tmdbApiKey: s.tmdbApiKey,
        zoom: s.zoom,
        colorMode: s.colorMode,
        ticketTypes: s.ticketTypes,
        priceCards: s.priceCards,
        screenCapacities: s.screenCapacities,
        seatPlans: s.seatPlans,
      }),
    }
  )
);
