export type ScreenNumber = 1 | 2 | 3;

export type FilmTermType =
  | 'all-shows'
  | 'one-per-day'
  | 'last-house'
  | 'last-two'
  | 'split'
  | 'specific-days';

export interface FilmTerms {
  type: FilmTermType;
  minPerformancesPerWeek?: number;
  specificDays?: number[]; // 0=Fri … 6=Thu
}

export type ScreeningType = 'film-club' | 'cine-circle' | 'toddlervision' | 'penguins' | 'senior';

export interface SpecialScreening {
  type: ScreeningType;
  day: number;           // 0=Fri … 6=Thu
  time?: number;         // minutes from midnight; undefined = auto-place on that day
  screen?: ScreenNumber; // if undefined, auto-select the first free screen
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
  isSeniorFilm: boolean;
  isArchived?: boolean;
  specialScreening?: SpecialScreening;
}

export interface Show {
  id: string;
  filmId: string;
  screen: ScreenNumber;
  date: string; // 'YYYY-MM-DD'
  startMinute: number; // minutes from midnight
  isFixed: boolean;
  isSenior: boolean;
  isOpen?: boolean;
  ticketsSold?: number;
  priceCard?: string;
  screeningType?: ScreeningType; // badge shown on the timeline block
}

export interface ScheduleState {
  weekStart: string;
  films: Film[];
  shows: Show[];
  tmdbApiKey: string;
  zoom: number;
  selectedDay: number;
}

export type SeatCellType = 'gap' | 'standard' | 'dda' | 'unavailable';

export interface SeatPlanRow {
  label: string;
  cells: SeatCellType[];
}

export interface SeatPlan {
  screen: ScreenNumber;
  cols: number;
  rows: SeatPlanRow[];
}

export interface TicketType {
  id: string;
  name: string;  // "Adult", "Child", "Senior", "Meerkat", "Comp" etc.
  price: number; // in £, e.g. 10.50
}

export interface PriceCard {
  id: string;
  name: string;           // "U/PG/12A", "15", "18" etc.
  ticketTypeIds: string[];
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
