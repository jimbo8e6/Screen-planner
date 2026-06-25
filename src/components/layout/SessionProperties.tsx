import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import { minutesToTimeString } from '../../utils/time';

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
  const openSessions = useStore((s) => s.openSessions);
  const closeSession = useStore((s) => s.closeSession);
  const updateShowProperties = useStore((s) => s.updateShowProperties);

  const show = shows.find((s) => s.id === focusedShowId) ?? null;
  const film = show ? films.find((f) => f.id === show.filmId) ?? null : null;

  const [ticketsSold, setTicketsSold] = useState('');
  const [priceCard, setPriceCard] = useState('');

  // Sync local inputs whenever the focused show changes
  useEffect(() => {
    if (show) {
      setTicketsSold(show.ticketsSold !== undefined ? String(show.ticketsSold) : '');
      setPriceCard(show.priceCard ?? '');
    } else {
      setTicketsSold('');
      setPriceCard('');
    }
  }, [focusedShowId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show || !film) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-500 text-xs text-center">
          Tap a show on the timeline to view its properties.
        </p>
      </div>
    );
  }

  // Work out which day index this show falls on (relative to weekStart)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  });
  const dayIndex = weekDates.indexOf(show.date);
  const dayLabel = dayIndex >= 0 ? `${DAY_NAMES[dayIndex]} ${format(new Date(show.date), 'd MMM')}` : show.date;

  const handleStatusChange = (value: string) => {
    if (value === 'open') openSessions([show.id]);
    else closeSession(show.id);
  };

  const saveTickets = () => {
    const n = parseInt(ticketsSold, 10);
    updateShowProperties(show.id, { ticketsSold: isNaN(n) ? undefined : n });
  };

  const savePriceCard = () => {
    updateShowProperties(show.id, { priceCard: priceCard.trim() || undefined });
  };

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

      {/* Tickets Sold */}
      <div className="space-y-1">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          Tickets Sold
        </label>
        <input
          type="number"
          min={0}
          value={ticketsSold}
          onChange={(e) => setTicketsSold(e.target.value)}
          onBlur={saveTickets}
          placeholder="—"
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
        />
      </div>

      {/* Price Card */}
      <div className="space-y-1">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          Price Card
        </label>
        <input
          type="text"
          value={priceCard}
          onChange={(e) => setPriceCard(e.target.value)}
          onBlur={savePriceCard}
          placeholder="e.g. Standard £10.50"
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
        />
      </div>
    </div>
  );
}
