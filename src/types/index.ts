export type ScreenNumber = 1 | 2 | 3;

export type FilmTermType =
  | 'all-shows'
  | 'one-per-day'
  | 'last-house'
  | 'specific-days';

export interface FilmTerms {
  type: FilmTermType;
  minPerformancesPerWeek?: number;
  specificDays?: number[]; // 0=Mon … 6=Sun
}

export interface Film {
  id: string;
  tmdbId: number;
  title: string;
  runtime: number; // minutes (raw, without trailers)
  poster: string | null;
  year: number;
  overview: string;
  color: string;
  terms: FilmTerms;
  isSeniorFilm: boolean; // if true, plays Thu 10:30
}

export interface Show {
  id: string;
  filmId: string;
  screen: ScreenNumber;
  date: string; // 'YYYY-MM-DD'
  startMinute: number; // minutes from midnight
  isFixed: boolean; // event cinema / senior – auto-scheduler won't move
  isSenior: boolean;
}

export interface EventCinemaEntry {
  title: string;
  date: string;
  screen: ScreenNumber;
  startMinute: number;
  runtime: number;
  color: string;
}

export interface ScheduleState {
  weekStart: string; // Monday ISO date 'YYYY-MM-DD'
  films: Film[];
  shows: Show[];
  tmdbApiKey: string;
  zoom: number; // px per minute
  selectedDay: number; // 0=Mon … 6=Sun
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
}

export interface TMDBMovieDetail extends TMDBSearchResult {
  runtime: number;
}
