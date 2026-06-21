import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../store';
import { addDays, format } from 'date-fns';
import { timeStringToMinutes } from '../../utils/time';
import type { ScreenNumber } from '../../types';

interface Props {
  onClose: () => void;
}

const DAY_NAMES = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export function EventCinemaModal({ onClose }: Props) {
  const weekStart = useStore((s) => s.weekStart);
  const films = useStore((s) => s.films);
  const addFixedShow = useStore((s) => s.addFixedShow);

  const [title, setTitle] = useState('');
  const [dayIdx, setDayIdx] = useState(0);
  const [screen, setScreen] = useState<ScreenNumber>(1);
  const [startTime, setStartTime] = useState('19:00');
  const [runtime, setRuntime] = useState(180);
  const [selectedFilmId, setSelectedFilmId] = useState('');

  const handleSubmit = () => {
    const date = format(addDays(new Date(weekStart), dayIdx), 'yyyy-MM-dd');
    const filmId = selectedFilmId || 'event-' + Date.now();

    addFixedShow({
      filmId,
      screen,
      date,
      startMinute: timeStringToMinutes(startTime),
      isFixed: true,
      isSenior: false,
    });

    // If it's a new event (not an existing film), store metadata as a pseudo-film
    if (!selectedFilmId && title) {
      // We need a film record for display — add a synthetic one
      useStore.setState((s) => ({
        films: [
          ...s.films,
          {
            id: filmId,
            tmdbId: -1,
            title: title || 'Event Cinema',
            runtime,
            poster: null,
            year: new Date().getFullYear(),
            overview: 'Event cinema screening',
            color: '#9333EA',
            terms: { type: 'one-per-day' },
            isSeniorFilm: false,
          },
        ],
      }));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-5 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Add Event Cinema</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Event Title</label>
            <input
              className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="e.g. ROH: La Traviata"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Or link to existing film</label>
            <select
              className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={selectedFilmId}
              onChange={(e) => setSelectedFilmId(e.target.value)}
            >
              <option value="">— New event —</option>
              {films.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Day</label>
              <select
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={dayIdx}
                onChange={(e) => setDayIdx(Number(e.target.value))}
              >
                {DAY_NAMES.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Screen</label>
              <select
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={screen}
                onChange={(e) => setScreen(Number(e.target.value) as ScreenNumber)}
              >
                <option value={1}>Screen 1</option>
                <option value={2}>Screen 2</option>
                <option value={3}>Screen 3</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Start time</label>
              <input
                type="time"
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            {!selectedFilmId && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Runtime (min)</label>
                <input
                  type="number"
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  value={runtime}
                  onChange={(e) => setRuntime(Number(e.target.value))}
                  min={30}
                  max={360}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title && !selectedFilmId}
            className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm rounded py-2 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
