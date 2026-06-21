import { useState } from 'react';
import { Wand2, Trash2, Calendar, Key, Film as FilmIcon } from 'lucide-react';
import { useStore } from '../../store';
import { FilmCard } from '../films/FilmCard';
import { FilmSearch } from '../films/FilmSearch';
import { EventCinemaModal } from '../modals/EventCinemaModal';
import { ApiKeyModal } from '../modals/ApiKeyModal';

export function Sidebar() {
  const films = useStore((s) => s.films);
  const autoSchedule = useStore((s) => s.autoSchedule);
  const clearGeneratedShows = useStore((s) => s.clearGeneratedShows);
  const apiKey = useStore((s) => s.tmdbApiKey);

  const [showEventModal, setShowEventModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <FilmIcon size={16} className="text-blue-400" />
          <h1 className="text-white font-bold text-sm tracking-wide">
            Cinema Scheduler
          </h1>
        </div>
        <p className="text-gray-500 text-xs mt-0.5">3-screen programme planner</p>
      </div>

      {/* Action buttons */}
      <div className="px-3 py-2 border-b border-gray-700 space-y-1.5">
        <button
          onClick={() => autoSchedule()}
          disabled={films.length === 0}
          className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded py-2 px-3 transition-colors font-medium"
        >
          <Wand2 size={14} />
          Auto-Schedule Week
        </button>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowEventModal(true)}
            className="flex-1 flex items-center gap-1.5 justify-center bg-purple-600/80 hover:bg-purple-600 text-white text-xs rounded py-1.5 px-2 transition-colors"
          >
            <Calendar size={12} />
            Event Cinema
          </button>
          <button
            onClick={() => clearGeneratedShows()}
            className="flex-1 flex items-center gap-1.5 justify-center bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded py-1.5 px-2 transition-colors"
          >
            <Trash2 size={12} />
            Clear Shows
          </button>
        </div>
      </div>

      {/* Films list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {films.length === 0 && (
          <div className="text-center py-8">
            <FilmIcon size={24} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">
              {apiKey ? 'Search for films below to add them to the programme.' : 'Add your TMDB API key to search for films.'}
            </p>
          </div>
        )}
        {films.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}

        <FilmSearch />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-700">
        <button
          onClick={() => setShowApiModal(true)}
          className="w-full flex items-center gap-2 text-gray-400 hover:text-white text-xs py-1.5 transition-colors"
        >
          <Key size={12} />
          {apiKey ? (
            <span>
              TMDB API key set{' '}
              <span className="text-green-400">✓</span>
            </span>
          ) : (
            <span className="text-yellow-400">Set TMDB API key…</span>
          )}
        </button>
      </div>

      {showEventModal && (
        <EventCinemaModal onClose={() => setShowEventModal(false)} />
      )}
      {showApiModal && (
        <ApiKeyModal onClose={() => setShowApiModal(false)} />
      )}
    </aside>
  );
}
