import { useState, useMemo } from 'react';
import { X, Archive, RotateCcw, Search } from 'lucide-react';
import { useStore } from '../../store';
import { IMG_BASE } from '../../utils/tmdb';

interface Props {
  onClose: () => void;
}

const PRESET_IDS = new Set([
  'preset-film-club',
  'preset-cine-circle',
  'preset-toddlervision',
  'preset-penguins',
]);

type RuntimeFilter = 'all' | 'short' | 'medium' | 'long';

const RUNTIME_LABELS: Record<RuntimeFilter, string> = {
  all:    'All runtimes',
  short:  'Short (≤90 min)',
  medium: 'Medium (91–120 min)',
  long:   'Long (>120 min)',
};

export function FilmArchiveModal({ onClose }: Props) {
  const films = useStore((s) => s.films);
  const restoreFilm = useStore((s) => s.restoreFilm);

  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [runtimeFilter, setRuntimeFilter] = useState<RuntimeFilter>('all');

  const archived = useMemo(
    () => films.filter((f) => !PRESET_IDS.has(f.id) && f.isArchived),
    [films]
  );

  const years = useMemo(() => {
    const ys = [...new Set(archived.map((f) => f.year))].sort((a, b) => b - a);
    return ys;
  }, [archived]);

  const filtered = useMemo(() => {
    return archived.filter((f) => {
      if (query && !f.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (yearFilter !== 'all' && f.year !== yearFilter) return false;
      if (runtimeFilter === 'short'  && f.runtime > 90)  return false;
      if (runtimeFilter === 'medium' && (f.runtime < 91 || f.runtime > 120)) return false;
      if (runtimeFilter === 'long'   && f.runtime <= 120) return false;
      return true;
    });
  }, [archived, query, yearFilter, runtimeFilter]);

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl my-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Archive size={16} className="text-gray-400" />
            <h2 className="text-white font-semibold">Film Archive</h2>
            {archived.length > 0 && (
              <span className="text-xs text-gray-500">{archived.length} film{archived.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {archived.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Archive size={32} className="text-gray-700" />
            <p className="text-gray-500 text-sm">No films in the archive yet.</p>
          </div>
        ) : (
          <>
            {/* Search + filters */}
            <div className="px-5 py-3 border-b border-gray-700 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by title…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={yearFilter === 'all' ? 'all' : String(yearFilter)}
                  onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-gray-800 text-gray-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
                >
                  <option value="all">All years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={runtimeFilter}
                  onChange={(e) => setRuntimeFilter(e.target.value as RuntimeFilter)}
                  className="bg-gray-800 text-gray-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
                >
                  {(Object.keys(RUNTIME_LABELS) as RuntimeFilter[]).map((k) => (
                    <option key={k} value={k}>{RUNTIME_LABELS[k]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto max-h-[60vh] px-5 py-3 space-y-2">
              {filtered.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No films match your filters.</p>
              ) : (
                filtered.map((film) => (
                  <div
                    key={film.id}
                    className="flex items-center gap-3 rounded-lg p-3 bg-gray-800/60"
                    style={{ borderLeft: `3px solid ${film.color}` }}
                  >
                    {film.poster ? (
                      <img
                        src={`${IMG_BASE}${film.poster}`}
                        alt=""
                        className="w-8 h-12 object-cover rounded flex-shrink-0 opacity-60"
                      />
                    ) : (
                      <div
                        className="w-8 h-12 rounded flex-shrink-0 opacity-40"
                        style={{ backgroundColor: film.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{film.title}</p>
                      <p className="text-gray-400 text-xs">{film.year} · {film.runtime} min</p>
                      {film.overview && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{film.overview}</p>
                      )}
                    </div>
                    <button
                      onClick={() => restoreFilm(film.id)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded px-3 py-1.5 transition-colors"
                      title="Restore to programme"
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
