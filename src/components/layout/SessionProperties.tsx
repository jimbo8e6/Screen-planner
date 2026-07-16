import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { minutesToTimeString } from '../../utils/time';
import { SCREENING_TYPES } from '../../utils/screeningTypes';
import type { ScreeningType } from '../../types';

const SCREEN_LABELS: Record<number, string> = {
  1: 'Screen 1',
  2: 'Screen 2',
  3: 'Screen 3',
};

const DAY_NAMES = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

export function SessionProperties() {
  const focusedShowId = useStore((s) => s.focusedShowId);
  const shows = useStore((s) => s.shows);
  const films = useStore((s) => s.films);
  const weekStart = useStore((s) => s.weekStart);
  const priceCards = useStore((s) => s.priceCards);
  const ticketTypes = useStore((s) => s.ticketTypes);
  const ticketCounts = useStore((s) => s.ticketCounts);
  const ticketBreakdown = useStore((s) => s.ticketBreakdown);
  const screenCapacities = useStore((s) => s.screenCapacities);
  const openSessions = useStore((s) => s.openSessions);
  const closeSession = useStore((s) => s.closeSession);
  const updateShowProperties = useStore((s) => s.updateShowProperties);

  const show = shows.find((s) => s.id === focusedShowId) ?? null;
  const film = show ? films.find((f) => f.id === show.filmId) ?? null : null;

  // Local state only needed for price card (session status saved immediately)
  const [, forceUpdate] = useState(0);
  useEffect(() => { forceUpdate((n) => n + 1); }, [focusedShowId]);

  if (!show || !film) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-500 text-xs text-center">
          Tap a show on the timeline to view its properties.
        </p>
      </div>
    );
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  });
  const dayIndex = weekDates.indexOf(show.date);
  const dayLabel = dayIndex >= 0
    ? `${DAY_NAMES[dayIndex]} ${format(new Date(show.date), 'd MMM')}`
    : show.date;

  const handleStatusChange = (value: string) => {
    if (value === 'open') openSessions([show.id]);
    else closeSession(show.id);
  };

  const handlePriceCardChange = (value: string) => {
    updateShowProperties(show.id, { priceCard: value || undefined });
  };

  const handleShowTypeChange = (value: string) => {
    updateShowProperties(show.id, {
      screeningType: value ? (value as ScreeningType) : null,
    });
  };

  const filmAttributes = film.attributes ?? [];

  const totalSold = ticketCounts[show.id] ?? 0;
  const breakdown = ticketBreakdown[show.id] ?? {};
  const capacity = screenCapacities[show.screen];
  const fillPct = capacity > 0 ? Math.min(totalSold / capacity, 1) : null;
  const barColor = fillPct === null ? '' : fillPct >= 0.9 ? '#EF4444' : fillPct >= 0.7 ? '#F59E0B' : '#22C55E';

  return (
    <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-4">
      {/* Show summary */}
      <div>
        <p className="text-white font-semibold text-sm leading-tight">{film.title}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          {dayLabel} · {minutesToTimeString(show.startMinute)} · {SCREEN_LABELS[show.screen]}
        </p>
        <p className="text-gray-500 text-xs">{film.runtime} min runtime</p>
      </div>

      <div className="border-t border-gray-700" />

      {/* Session Status */}
      <div className="space-y-1">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          Session Status
        </label>
        <select
          value={show.isOpen ? 'open' : 'closed'}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="closed">Closed</option>
          <option value="open">Open</option>
        </select>
      </div>

      {/* Show type */}
      <div className="space-y-1">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          Show Type
        </label>
        {filmAttributes.length > 0 && (
          <p className="text-gray-600 text-xs">
            Film attributes: {filmAttributes.map((a) => SCREENING_TYPES[a].label).join(', ')}
          </p>
        )}
        <select
          value={show.screeningType ?? ''}
          onChange={(e) => handleShowTypeChange(e.target.value)}
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Standard</option>
          {(Object.keys(SCREENING_TYPES) as ScreeningType[]).map((type) => (
            <option key={type} value={type}>{SCREENING_TYPES[type].label}</option>
          ))}
        </select>
      </div>

      {/* Tickets Sold — live from till */}
      <div className="space-y-1.5">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          Tickets Sold
        </label>
        <div className="bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
          {totalSold === 0 ? (
            <p className="text-gray-500 text-sm">No sales recorded yet</p>
          ) : (
            <>
              <p className="text-white text-sm font-semibold">
                {totalSold}
                {capacity > 0 && (
                  <span className="text-gray-400 font-normal"> / {capacity} seats</span>
                )}
              </p>
              {/* Breakdown by ticket type */}
              {Object.keys(breakdown).length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {Object.entries(breakdown).map(([typeId, qty]) => {
                    const typeName = ticketTypes.find((t) => t.id === typeId)?.name ?? typeId;
                    return (
                      <p key={typeId} className="text-gray-400 text-xs">
                        {typeName}: {qty}
                      </p>
                    );
                  })}
                </div>
              )}
              {/* Occupancy bar */}
              {fillPct !== null && (
                <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${fillPct * 100}%`, backgroundColor: barColor }}
                  />
                </div>
              )}
              {fillPct !== null && (
                <p className="text-xs mt-1" style={{ color: barColor }}>
                  {Math.round(fillPct * 100)}% capacity
                </p>
              )}
            </>
          )}
        </div>
        <p className="text-gray-600 text-xs">Updated live from the till</p>
      </div>

      {/* Price Card */}
      <div className="space-y-1">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          Price Card
        </label>
        <select
          value={show.priceCard ?? ''}
          onChange={(e) => handlePriceCardChange(e.target.value)}
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— Select price card —</option>
          {priceCards.map((pc) => (
            <option key={pc.id} value={pc.id}>{pc.name}</option>
          ))}
        </select>
        {priceCards.length === 0 && (
          <p className="text-gray-600 text-xs">No price cards created yet.</p>
        )}
      </div>
    </div>
  );
}
