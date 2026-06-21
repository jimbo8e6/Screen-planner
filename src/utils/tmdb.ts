import type { TMDBSearchResult, TMDBMovieDetail } from '../types';

const BASE = 'https://api.themoviedb.org/3';
export const IMG_BASE = 'https://image.tmdb.org/t/p/w185';

async function apiFetch<T>(path: string, apiKey: string): Promise<T> {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function searchFilms(
  query: string,
  apiKey: string
): Promise<TMDBSearchResult[]> {
  const data = await apiFetch<{ results: TMDBSearchResult[] }>(
    `/search/movie?query=${encodeURIComponent(query)}&include_adult=false`,
    apiKey
  );
  return data.results.slice(0, 8);
}

export async function getFilmDetail(
  tmdbId: number,
  apiKey: string
): Promise<TMDBMovieDetail> {
  return apiFetch<TMDBMovieDetail>(`/movie/${tmdbId}`, apiKey);
}
