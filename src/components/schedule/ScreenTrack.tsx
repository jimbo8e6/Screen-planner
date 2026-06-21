import { useMemo, useRef, useState } from 'react';
import { useStore } from '../../store';
import { ShowBlock } from './ShowBlock';
import type { ScreenNumber } from '../../types';

interface Props {
  screen: ScreenNumber;
  date: string;
  zoom: number;
  timelineStart: number;
}

const SCREEN_LABELS: Record<ScreenNumber, string> = {
  1: 'Screen 1 (no DDA)',
  2: 'Screen 2',
  3: 'Screen 3',
};

export function ScreenTrack({ screen, date, zoom, timelineStart }: Props) {
  const allShows = useStore((s) => s.shows);
  const films = useStore((s) => s.films);
  const moveShow = useStore((s) => s.moveShow);
  const addFixedShow = useStore((s) => s.addFixedShow);

  const [isDragOver, setIsDragOver] = useState(false);
  const [dropMinute, setDropMinute] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const shows = useMemo(
    () => allShows.filter((sh) => sh.screen === screen && sh.date === date),
    [allShows, screen, date]
  );

  const clientXToMinute = (clientX: number): number => {
    if (!trackRef.current) return timelineStart;
    const rect = trackRef.current.getBoundingClientRect();
    const raw = Math.round((clientX - rect.left) / zoom) + timelineStart;
    return Math.round(raw / 5) * 5; // snap to 5-minute grid
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    setDropMinute(clientXToMinute(e.clientX));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!trackRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropMinute(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDropMinute(null);

    const minute = clientXToMinute(e.clientX);
    const showId = e.dataTransfer.getData('showId');
    const filmId = e.dataTransfer.getData('filmId');

    if (showId) {
      const offset = parseInt(e.dataTransfer.getData('offsetMinutes') || '0');
      const newStart = Math.max(timelineStart, minute - offset);
      moveShow(showId, screen, newStart);
    } else if (filmId) {
      addFixedShow({
        filmId,
        screen,
        date,
        startMinute: Math.max(timelineStart, minute),
        isFixed: true,
        isSenior: false,
      });
    }
  };

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
        ref={trackRef}
        className={`flex-1 relative h-14 border-b border-gray-700 transition-colors ${
          isDragOver ? 'bg-blue-900/30' : 'bg-gray-800'
        }`}
        style={isDragOver ? { outline: '2px solid #3b82f6', outlineOffset: '-2px' } : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
        {isDragOver && dropMinute !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-400 pointer-events-none z-20"
            style={{ left: (dropMinute - timelineStart) * zoom }}
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
            />
          );
        })}
      </div>
    </div>
  );
}
