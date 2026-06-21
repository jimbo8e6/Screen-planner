import { useState, useEffect } from 'react';
import { X, Monitor, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { minutesToTimeString, timeStringToMinutes, showDurationMinutes } from '../../utils/time';
import { SCREENING_TYPES } from '../../utils/screeningTypes';
import type { ScreenNumber } from '../../types';

const IMG_BASE_LG = 'https://image.tmdb.org/t/p/w342';

const SCREEN_LABELS: Record<ScreenNumber, string> = {
  1: 'Screen 1 (no DDA)',
  2: 'Screen 2',
  3: 'Screen 3',
};

interface Props {
  showId: string;
  onClose: () => void;
}

export function ShowDetailModal({ showId, onClose }: Props) {
  const shows = useStore((s) => s.shows);
  const films = useStore((s) => s.films);
  const moveShow = useStore((s) => s.moveShow);
  const removeShow = useStore((s) => s.removeShow);

  const show = shows.find((s) => s.id === showId);
  const film = show ? films.find((f) => f.id === show.filmId) : null;

  const [timeValue, setTimeValue] = useState('');

  useEffect(() => {
    if (show) setTimeValue(minutesToTimeString(show.startMinute));
  }, [showId, show?.startMinute]);

  if (!show || !film) return null;

  const showDur = showDurationMinutes(film.runtime);
  const endMinute = show.startMinute + showDur;

  const applyDelta = (deltaMinutes: number) => {
    const newStart = Math.max(0, show.startMinute + deltaMinutes);
    moveShow(show.id, show.screen, newStart);
  };

  const applyTimeInput = () => {
    if (!timeValue) return;
    const minutes = timeStringToMinutes(timeValue);
    if (minutes >= 0) moveShow(show.id, show.screen, minutes);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applyTimeInput();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md border border-gray-700 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
        >
          <X size={18} />
        </button>

        {/* Header: poster + title/meta */}
        <div className="flex gap-4 p-4 pb-3" style={{ backgroundColor: film.color + '22' }}>
          {film.poster ? (
            <img
              src={`${IMG_BASE_LG}${film.poster}`}
              alt={film.title}
              className="w-20 h-28 object-cover rounded-lg flex-shrink-0 shadow-lg"
            />
          ) : (
            <div
              className="w-20 h-28 rounded-lg flex-shrink-0"
              style={{ backgroundColor: film.color + '55' }}
            />
          )}
          <div className="min-w-0 flex-1 pt-1 pr-6">
            <h2 className="text-white font-bold text-base leading-snug">{film.title}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{film.year}</p>
            <div className="mt-2 space-y-0.5">
              <p className="text-gray-300 text-xs">Runtime: {film.runtime} min + 20 min trailers</p>
              <p className="text-gray-300 text-xs">
                Finishes: {minutesToTimeString(endMinute)}
              </p>
            </div>
            {show.screeningType && (
              <span
                className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold"
                style={{ backgroundColor: SCREENING_TYPES[show.screeningType].color, color: '#fff' }}
              >
                {SCREENING_TYPES[show.screeningType].label}
              </span>
            )}
          </div>
        </div>

        {/* Synopsis */}
        {film.overview && (
          <div className="px-4 py-3 border-t border-gray-800">
            <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wide">Synopsis</p>
            <p className="text-gray-300 text-sm leading-relaxed overflow-y-auto max-h-28">
              {film.overview}
            </p>
          </div>
        )}

        {/* Screen + time editor */}
        <div className="px-4 py-3 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-2">
            <Monitor size={14} className="text-gray-500 flex-shrink-0" />
            <span className="text-gray-300 text-sm">{SCREEN_LABELS[show.screen]}</span>
            {show.isFixed && (
              <span className="ml-auto text-xs text-purple-400">Fixed position</span>
            )}
          </div>

          <div>
            <p className="text-gray-400 text-xs mb-2">Adjust start time</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => applyDelta(-15)}
                className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
              >
                −15m
              </button>
              <button
                onClick={() => applyDelta(-5)}
                className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
              >
                −5m
              </button>
              <input
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                onBlur={applyTimeInput}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
              />
              <button
                onClick={() => applyDelta(5)}
                className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
              >
                +5m
              </button>
              <button
                onClick={() => applyDelta(15)}
                className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
              >
                +15m
              </button>
            </div>
          </div>
        </div>

        {/* Delete */}
        <div className="px-4 py-3 border-t border-gray-800">
          <button
            onClick={() => { removeShow(show.id); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 text-sm rounded-lg py-2 transition-colors"
          >
            <Trash2 size={14} />
            Remove this showing
          </button>
        </div>
      </div>
    </div>
  );
}
