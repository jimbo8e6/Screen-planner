import { format, addDays } from 'date-fns';
import { useStore } from '../../store';
import { minutesToTimeString, showDurationMinutes } from '../../utils/time';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SCREENS = [1, 2, 3] as const;

// Mini grid: 10:00 → 23:30
const START = 10 * 60;
const END = 23 * 60 + 30;
const SPAN = END - START;

export function WeekOverview() {
  const weekStart = useStore((s) => s.weekStart);
  const shows = useStore((s) => s.shows);
  const films = useStore((s) => s.films);
  const selectedDay = useStore((s) => s.selectedDay);
  const setSelectedDay = useStore((s) => s.setSelectedDay);

  const totalShows = shows.length;

  return (
    <div className="bg-gray-900 border-t border-gray-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          Week overview
        </p>
        <p className="text-gray-500 text-xs">{totalShows} shows scheduled</p>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((day, dayIdx) => {
          const date = format(addDays(new Date(weekStart), dayIdx), 'yyyy-MM-dd');
          const dayShows = shows.filter((s) => s.date === date);
          const isSelected = dayIdx === selectedDay;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(dayIdx)}
              className={`rounded overflow-hidden border transition-colors ${
                isSelected
                  ? 'border-blue-500'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              {/* Day header */}
              <div
                className={`py-0.5 px-1 text-center text-xs font-medium ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {day}
              </div>

              {/* Mini tracks */}
              <div className="bg-gray-800/50 p-0.5 space-y-0.5">
                {SCREENS.map((screen) => {
                  const screenShows = dayShows.filter((s) => s.screen === screen);
                  return (
                    <div
                      key={screen}
                      className="relative h-3 bg-gray-700 rounded-sm overflow-hidden"
                    >
                      {screenShows.map((show) => {
                        const film = films.find((f) => f.id === show.filmId);
                        if (!film) return null;
                        const left = Math.max(
                          0,
                          ((show.startMinute - START) / SPAN) * 100
                        );
                        const width = Math.min(
                          (showDurationMinutes(film.runtime) / SPAN) * 100,
                          100 - left
                        );
                        return (
                          <div
                            key={show.id}
                            className="absolute top-0 bottom-0 rounded-sm"
                            style={{
                              left: `${left}%`,
                              width: `${Math.max(width, 4)}%`,
                              backgroundColor: film.color,
                              opacity: 0.85,
                            }}
                            title={`${film.title} ${minutesToTimeString(show.startMinute)}`}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-xs text-gray-500 py-0.5">
                {dayShows.length > 0 ? `${dayShows.length}` : '–'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Colour legend */}
      {films.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {films.map((f) => (
            <div key={f.id} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: f.color }}
              />
              <span className="text-gray-400 text-xs truncate max-w-24">{f.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
