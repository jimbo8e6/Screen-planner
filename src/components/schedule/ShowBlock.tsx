import { useState, useRef } from 'react';
import { X, Lock } from 'lucide-react';
import { useStore } from '../../store';
import { minutesToTimeString, showDurationMinutes } from '../../utils/time';
import type { Show, Film } from '../../types';
import { hexToRgba } from '../../utils/colors';

interface Props {
  show: Show;
  film: Film;
  zoom: number;
  timelineStart: number; // minute offset of left edge
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function ShowBlock({ show, film, zoom, timelineStart, onDragStart, onDragEnd }: Props) {
  const removeShow = useStore((s) => s.removeShow);
  const moveShow = useStore((s) => s.moveShow);
  const [hovered, setHovered] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const dragStartMinute = useRef<number>(0);

  const showDur = showDurationMinutes(film.runtime);
  const left = (show.startMinute - timelineStart) * zoom;
  const width = showDur * zoom;

  const endMinute = show.startMinute + showDur;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (show.isFixed) return;
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartMinute.current = show.startMinute;
    onDragStart?.();

    const onMove = (me: MouseEvent) => {
      if (dragStartX.current === null) return;
      const delta = Math.round((me.clientX - dragStartX.current) / zoom);
      const newStart = Math.max(0, dragStartMinute.current + delta);
      moveShow(show.id, show.screen, newStart);
    };

    const onUp = () => {
      dragStartX.current = null;
      onDragEnd?.();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className="absolute top-1 bottom-1 rounded select-none overflow-hidden"
      style={{
        left,
        width: Math.max(width, 24),
        backgroundColor: hexToRgba(film.color, show.isSenior ? 0.9 : 0.75),
        borderLeft: `3px solid ${film.color}`,
        cursor: show.isFixed ? 'default' : 'grab',
        zIndex: hovered ? 10 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={handleMouseDown}
    >
      {/* Trailer buffer indicator */}
      <div
        className="absolute top-0 right-0 bottom-0 opacity-30"
        style={{
          width: 20 * zoom,
          backgroundColor: '#000',
        }}
        title="20 min trailers"
      />

      <div className="relative px-1.5 py-0.5 h-full flex flex-col justify-between overflow-hidden">
        <div className="flex items-start justify-between gap-1">
          <p
            className="text-white font-semibold leading-tight"
            style={{ fontSize: width > 80 ? 12 : 10 }}
          >
            {width > 50 ? film.title : ''}
            {show.isSenior && (
              <span className="ml-1 text-yellow-300 text-xs">★</span>
            )}
            {show.isFixed && (
              <Lock size={10} className="inline ml-1 text-white/60" />
            )}
          </p>
          {hovered && !show.isFixed && (
            <button
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                removeShow(show.id);
              }}
            >
              <X size={10} />
            </button>
          )}
        </div>
        {width > 70 && (
          <p className="text-white/70 text-xs">
            {minutesToTimeString(show.startMinute)}–{minutesToTimeString(endMinute)}
          </p>
        )}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute z-20 bg-gray-900 border border-gray-600 rounded p-2 shadow-xl pointer-events-none"
          style={{ top: '100%', left: 0, minWidth: 160, marginTop: 4 }}
        >
          <p className="text-white text-xs font-semibold">{film.title}</p>
          <p className="text-gray-400 text-xs">
            {minutesToTimeString(show.startMinute)} – {minutesToTimeString(endMinute)}
          </p>
          <p className="text-gray-400 text-xs">
            Runtime: {film.runtime} min + 20 trailers
          </p>
          {show.isSenior && (
            <p className="text-yellow-400 text-xs">★ Senior screening</p>
          )}
          {show.isFixed && (
            <p className="text-purple-400 text-xs">🔒 Fixed (event cinema)</p>
          )}
        </div>
      )}
    </div>
  );
}
