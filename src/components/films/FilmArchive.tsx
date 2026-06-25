import { RotateCcw, Archive } from 'lucide-react';
import { useStore } from '../../store';
import { IMG_BASE } from '../../utils/tmdb';

export function FilmArchive() {
  const films = useStore((s) => s.films);
  const restoreFilm = useStore((s) => s.restoreFilm);

  const archived = films.filter((f) => f.isArchived);

  if (archived.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
        <Archive size={28} className="text-gray-700" />
        <p className="text-gray-500 text-xs text-center">
          No films in the archive yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-2">
      {archived.map((film) => (
        <div
          key={film.id}
          className="flex items-center gap-2 rounded-lg p-2 bg-gray-800/60"
          style={{ borderLeft: `3px solid ${film.color}` }}
        >
          {film.poster ? (
            <img
              src={`${IMG_BASE}${film.poster}`}
              alt=""
              className="w-7 h-10 object-cover rounded flex-shrink-0 opacity-60"
            />
          ) : (
            <div
              className="w-7 h-10 rounded flex-shrink-0 opacity-40"
              style={{ backgroundColor: film.color }}
            />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-gray-300 text-xs font-semibold truncate">{film.title}</p>
            <p className="text-gray-500 text-xs">{film.year} · {film.runtime} min</p>
          </div>

          <button
            onClick={() => restoreFilm(film.id)}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 transition-colors"
            title="Restore to palette"
          >
            <RotateCcw size={11} />
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
