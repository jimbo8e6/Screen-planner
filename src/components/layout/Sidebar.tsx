import { useState, useMemo } from 'react';
import { Wand2, Trash2, Calendar, Key, Film as FilmIcon, Clapperboard, FileDown, ArrowUpDown, Cloud } from 'lucide-react';
import { useStore } from '../../store';
import { FilmCard } from '../films/FilmCard';
import { FilmSearch } from '../films/FilmSearch';
import { EventCinemaModal } from '../modals/EventCinemaModal';
import { RegularShowModal } from '../modals/RegularShowModal';
import { ApiKeyModal } from '../modals/ApiKeyModal';
import { SyncModal } from '../modals/SyncModal';
import { exportSchedulePdf } from '../../utils/exportPdf';
import { supabase } from '../../lib/supabase';
import type { Film } from '../../types';

// These preset IDs must stay hidden from the main films list
const PRESET_IDS = new Set([
  'preset-film-club',
  'preset-cine-circle',
  'preset-toddlervision',
  'preset-penguins',
]);

type SortKey = 'added' | 'az' | 'za' | 'term' | 'runtime-asc' | 'runtime-desc';

const TERM_ORDER: Record<string, number> = {
  'all-shows':     0,
  'split':         1,
  'one-per-day':   2,
  'last-two':      3,
  'last-house':    4,
  'specific-days': 5,
};

const SORT_LABELS: Record<SortKey, string> = {
  added:        'Added',
  az:           'A–Z',
  za:           'Z–A',
  term:         'Term',
  'runtime-asc':  'Runtime ↑',
  'runtime-desc': 'Runtime ↓',
};

function sortFilms(films: Film[], key: SortKey): Film[] {
  const copy = [...films];
  switch (key) {
    case 'az':           return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'za':           return copy.sort((a, b) => b.title.localeCompare(a.title));
    case 'term':         return copy.sort((a, b) => (TERM_ORDER[a.terms.type] ?? 9) - (TERM_ORDER[b.terms.type] ?? 9));
    case 'runtime-asc':  return copy.sort((a, b) => a.runtime - b.runtime);
    case 'runtime-desc': return copy.sort((a, b) => b.runtime - a.runtime);
    default:             return copy;
  }
}

interface SidebarProps {
  switchToCode: (code: string) => Promise<void>;
}

export function Sidebar({ switchToCode }: SidebarProps) {
  const allFilms = useStore((s) => s.films);
  const shows = useStore((s) => s.shows);
  const weekStart = useStore((s) => s.weekStart);
  const autoSchedule = useStore((s) => s.autoSchedule);
  const clearGeneratedShows = useStore((s) => s.clearGeneratedShows);
  const apiKey = useStore((s) => s.tmdbApiKey);

  const syncStatus = useStore((s) => s.syncStatus);

  const [showEventModal, setShowEventModal] = useState(false);
  const [showRegularModal, setShowRegularModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('added');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const baseFilms = useMemo(
    () => allFilms.filter((f) => !PRESET_IDS.has(f.id)),
    [allFilms]
  );

  const films = useMemo(() => sortFilms(baseFilms, sortKey), [baseFilms, sortKey]);

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
            onClick={() => setShowRegularModal(true)}
            className="flex-1 flex items-center gap-1.5 justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded py-1.5 px-2 transition-colors"
          >
            <Clapperboard size={12} />
            Regular Shows
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="flex-1 flex items-center gap-1.5 justify-center bg-purple-600/80 hover:bg-purple-600 text-white text-xs rounded py-1.5 px-2 transition-colors"
          >
            <Calendar size={12} />
            Event Cinema
          </button>
        </div>
        <button
          onClick={() => clearGeneratedShows()}
          className="w-full flex items-center gap-1.5 justify-center bg-gray-700/60 hover:bg-gray-700 text-gray-400 text-xs rounded py-1.5 px-2 transition-colors"
        >
          <Trash2 size={12} />
          Clear Auto-Scheduled Shows
        </button>
        <button
          onClick={() => exportSchedulePdf(weekStart, allFilms, shows)}
          disabled={shows.length === 0}
          className="w-full flex items-center gap-1.5 justify-center bg-green-700/80 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded py-1.5 px-2 transition-colors"
        >
          <FileDown size={12} />
          Export / Share PDF
        </button>
      </div>

      {/* Films list */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {/* Sort bar */}
        {baseFilms.length > 1 && (
          <div className="px-3 pt-2 pb-1 relative">
            <button
              onClick={() => setShowSortMenu((v) => !v)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors"
            >
              <ArrowUpDown size={11} />
              <span>{SORT_LABELS[sortKey]}</span>
            </button>

            {showSortMenu && (
              <div className="absolute left-3 top-full mt-1 z-30 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-36">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { setSortKey(key); setShowSortMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      sortKey === key
                        ? 'text-white bg-blue-600/40'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-3 pb-2 space-y-2 flex-1">
          {films.length === 0 && (
            <div className="text-center py-8">
              <FilmIcon size={24} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">
                {apiKey
                  ? 'Search for films below to add them to the programme.'
                  : 'Add your TMDB API key to search for films.'}
              </p>
            </div>
          )}
          {films.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}

          <FilmSearch />
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-700 space-y-1">
        {supabase && (
          <button
            onClick={() => setShowSyncModal(true)}
            className="w-full flex items-center gap-2 text-gray-400 hover:text-white text-xs py-1.5 transition-colors"
          >
            <Cloud size={12} />
            <span className="flex-1 text-left">Cloud sync</span>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              syncStatus === 'synced'  ? 'bg-green-400' :
              syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
              syncStatus === 'error'   ? 'bg-red-400' :
                                         'bg-gray-600'
            }`} />
          </button>
        )}
        <button
          onClick={() => setShowApiModal(true)}
          className="w-full flex items-center gap-2 text-gray-400 hover:text-white text-xs py-1.5 transition-colors"
        >
          <Key size={12} />
          {apiKey ? (
            <span>
              TMDB API key set <span className="text-green-400">✓</span>
            </span>
          ) : (
            <span className="text-yellow-400">Set TMDB API key…</span>
          )}
        </button>
      </div>

      {showRegularModal && (
        <RegularShowModal onClose={() => setShowRegularModal(false)} />
      )}
      {showEventModal && (
        <EventCinemaModal onClose={() => setShowEventModal(false)} />
      )}
      {showApiModal && (
        <ApiKeyModal onClose={() => setShowApiModal(false)} />
      )}
      {showSyncModal && (
        <SyncModal
          onClose={() => setShowSyncModal(false)}
          switchToCode={switchToCode}
        />
      )}
    </aside>
  );
}
