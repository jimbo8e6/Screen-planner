import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useStore } from '../../store';
import { IMG_BASE } from '../../utils/tmdb';
import type { Film, FilmTermType, FilmTerms } from '../../types';

const DAYS = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

interface Props {
  film: Film;
}

export function FilmCard({ film }: Props) {
  const removeFilm = useStore((s) => s.removeFilm);
  const updateFilmTerms = useStore((s) => s.updateFilmTerms);
  const toggleSeniorFilm = useStore((s) => s.toggleSeniorFilm);
  const [expanded, setExpanded] = useState(false);

  const setTermType = (type: FilmTermType) => {
    const terms: FilmTerms = { ...film.terms, type };
    if (type !== 'specific-days') delete terms.specificDays;
    updateFilmTerms(film.id, terms);
  };

  const toggleDay = (dayIdx: number) => {
    const days = film.terms.specificDays ?? [];
    const next = days.includes(dayIdx)
      ? days.filter((d) => d !== dayIdx)
      : [...days, dayIdx];
    updateFilmTerms(film.id, { ...film.terms, specificDays: next });
  };

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: film.color + '55' }}
    >
      <div className="flex items-center gap-2 p-2" style={{ backgroundColor: film.color + '22' }}>
        {film.poster ? (
          <img
            src={`${IMG_BASE}${film.poster}`}
            alt=""
            className="w-8 h-12 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div
            className="w-8 h-12 rounded flex-shrink-0"
            style={{ backgroundColor: film.color + '44' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold leading-tight truncate">
            {film.title}
          </p>
          <p className="text-gray-400 text-xs">
            {film.year} · {film.runtime} min
          </p>
          <div
            className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: film.color, color: '#fff' }}
          >
            {film.terms.type === 'all-shows' && 'All shows'}
            {film.terms.type === 'one-per-day' && '1/day'}
            {film.terms.type === 'last-house' && 'Last house'}
            {film.terms.type === 'specific-days' && 'Specific days'}
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={() => toggleSeniorFilm(film.id)}
            title="Senior film (Thu 10:30)"
            className={`p-1 rounded transition-colors ${
              film.isSeniorFilm
                ? 'text-yellow-400 bg-yellow-400/20'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Star size={12} />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={() => removeFilm(film.id)}
            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-gray-800 p-2 space-y-2">
          <div>
            <p className="text-gray-400 text-xs mb-1 font-medium">Screening term</p>
            <div className="grid grid-cols-2 gap-1">
              {(['all-shows', 'one-per-day', 'last-house', 'specific-days'] as FilmTermType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setTermType(type)}
                    className={`text-xs py-1 px-2 rounded transition-colors ${
                      film.terms.type === type
                        ? 'text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    style={film.terms.type === type ? { backgroundColor: film.color } : {}}
                  >
                    {type === 'all-shows' && 'All shows'}
                    {type === 'one-per-day' && '1 per day'}
                    {type === 'last-house' && 'Last house'}
                    {type === 'specific-days' && 'Specific days'}
                  </button>
                )
              )}
            </div>
          </div>

          {film.terms.type === 'specific-days' && (
            <div>
              <p className="text-gray-400 text-xs mb-1 font-medium">Days</p>
              <div className="flex gap-1 flex-wrap">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(i)}
                    className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                      film.terms.specificDays?.includes(i)
                        ? 'text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    style={
                      film.terms.specificDays?.includes(i)
                        ? { backgroundColor: film.color }
                        : {}
                    }
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`senior-${film.id}`}
              checked={film.isSeniorFilm}
              onChange={() => toggleSeniorFilm(film.id)}
              className="accent-yellow-400"
            />
            <label htmlFor={`senior-${film.id}`} className="text-xs text-gray-300">
              Senior film (Thu 10:30, Screen 2)
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
