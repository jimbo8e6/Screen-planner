import { useMemo } from 'react';
import { useStore } from '../../store';
import { ShowBlock } from './ShowBlock';
import { useDragContext } from '../../contexts/DragContext';
import type { ScreenNumber } from '../../types';

interface Props {
  screen: ScreenNumber;
  date: string;
  zoom: number;
  timelineStart: number;
  onShowClick: (showId: string) => void;
}

const SCREEN_LABELS: Record<ScreenNumber, string> = {
  1: 'Screen 1 (no DDA)',
  2: 'Screen 2',
  3: 'Screen 3',
};

export function ScreenTrack({ screen, date, zoom, timelineStart, onShowClick }: Props) {
  const allShows = useStore((s) => s.shows);
  const films = useStore((s) => s.films);
  const { activeTarget } = useDragContext();

  const shows = useMemo(
    () => allShows.filter((sh) => sh.screen === screen && sh.date === date),
    [allShows, screen, date]
  );

  const isHovering =
    activeTarget !== null &&
    activeTarget.screen === screen &&
    activeTarget.date === date;

  return (
    <div className="flex">
      {/* Label */}
      <div className="w-28 flex-shrink-0 flex items-center px-2 border-r border-gray-700">
        <p
          className="text-xs font-medium"
          style={{ color: screen === 1 ? '#F59E0B' : '#9CA3AF' }}
        >
          {SCREEN_LABELS[screen]}
        </p>
      </div>

      {/* Track */}
      <div
        data-screen={screen}
        data-date={date}
        data-zoom={zoom}
        data-timeline-start={timelineStart}
        className={`flex-1 relative h-14 border-b border-gray-700 transition-colors ${
          isHovering ? 'bg-blue-900/30' : 'bg-gray-800'
        }`}
        style={isHovering ? { outline: '2px solid #3b82f6', outlineOffset: '-2px' } : undefined}
      >
        {/* Hour grid lines */}
        {Array.from({ length: 24 }, (_, h) => {
          const minute = h * 60;
          const left = (minute - timelineStart) * zoom;
          if (left < 0) return null;
          return (
            <div
              key={h}
              className="absolute top-0 bottom-0 border-l border-gray-700/50"
              style={{ left }}
            />
          );
        })}

        {/* Drop position indicator */}
        {isHovering && activeTarget !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-400 pointer-events-none z-20"
            style={{ left: (activeTarget.minute - timelineStart) * zoom }}
          />
        )}

        {/* Shows */}
        {shows.map((show) => {
          const film = films.find((f) => f.id === show.filmId);
          if (!film) return null;
          return (
            <ShowBlock
              key={show.id}
              show={show}
              film={film}
              zoom={zoom}
              timelineStart={timelineStart}
              onShowClick={onShowClick}
            />
          );
        })}
      </div>
    </div>
  );
}
