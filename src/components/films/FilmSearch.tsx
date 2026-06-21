import { useState, useCallback } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
import { useStore } from '../../store';
import { searchFilms, getFilmDetail, IMG_BASE } from '../../utils/tmdb';
import type { TMDBSearchResult } from '../../types';

export function FilmSearch() {
  const apiKey = useStore((s) => s.tmdbApiKey);
  const addFilm = useStore((s) => s.addFilm);
  const existingFilms = useStore((s) => s.films);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState<number | null>(null);

  const search = useCallback(async () => {
    if (!query.trim() || !apiKey) return;
    setLoading(true);
    setError('');
    try {
      const r = await searchFilms(query, apiKey);
      setResults(r);
    } catch {
      setError('Search failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  }, [query, apiKey]);

  const handleAdd = async (result: TMDBSearchResult) => {
    if (!apiKey) return;
    setAdding(result.id);
    try {
      const detail = await getFilmDetail(result.id, apiKey);
      addFilm({
        tmdbId: detail.id,
        title: detail.title,
        runtime: detail.runtime ?? 90,
        poster: detail.poster_path,
        year: parseInt(detail.release_date?.slice(0, 4) ?? '0'),
        overview: detail.overview,
      });
      setResults((r) => r.filter((x) => x.id !== result.id));
    } catch {
      setError('Failed to load film details.');
    } finally {
      setAdding(null);
    }
  };

  const alreadyAdded = (id: number) => existingFilms.some((f) => f.tmdbId === id);

  if (!apiKey) return null;

  return (
    <div className="border-t border-gray-700 pt-3 mt-3">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
        Add Film
      </p>
      <div className="flex gap-1">
        <input
          className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1.5 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Search TMDB…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button
          onClick={search}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded p-1.5 transition-colors"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      {results.length > 0 && (
        <ul className="mt-2 space-y-1 max-h-64 overflow-y-auto">
          {results.map((r) => {
            const added = alreadyAdded(r.id);
            return (
              <li
                key={r.id}
                className="flex items-center gap-2 bg-gray-700 rounded p-1.5"
              >
                {r.poster_path ? (
                  <img
                    src={`${IMG_BASE}${r.poster_path}`}
                    alt=""
                    className="w-7 h-10 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-10 bg-gray-600 rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{r.title}</p>
                  <p className="text-gray-400 text-xs">
                    {r.release_date?.slice(0, 4) ?? '—'}
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(r)}
                  disabled={added || adding === r.id}
                  className={`flex-shrink-0 p-1 rounded transition-colors ${
                    added
                      ? 'text-gray-500 cursor-default'
                      : 'text-green-400 hover:text-green-300 hover:bg-gray-600'
                  }`}
                >
                  {adding === r.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
