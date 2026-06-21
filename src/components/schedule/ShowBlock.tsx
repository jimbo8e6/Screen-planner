import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useStore } from '../../store';
import { minutesToTimeString, showDurationMinutes } from '../../utils/time';
import type { Show, Film } from '../../types';
import { hexToRgba } from '../../utils/colors';
import { SCREENING_TYPES } from '../../utils/screeningTypes';

interface Props {
  show: Show;
  film: Film;
  zoom: number;
  timelineStart: number;
}

export function ShowBlock({ show, film, zoom, timelineStart }: Props) {
  const removeShow = useStore((s) => s.removeShow);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const showDur = showDurationMinutes(film.runtime);
  const left = (show.startMinute - timelineStart) * zoom;
  const width = showDur * zoom;
  const endMinute = show.startMinute + showDur;

  const draggable = !show.isSenior;

  const handleDragStart = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetMinutes = Math.round((e.clientX - rect.left) / zoom);
    e.dataTransfer.setData('showId', show.id);
    e.dataTransfer.setData('offsetMinutes', String(offsetMinutes));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => setIsDragging(false);

  return (
    <div
      draggable={draggable}
      className="absolute top-1 bottom-1 rounded select-none overflow-hidden transition-opacity"
      style={{
        left,
        width: Math.max(width, 24),
        backgroundColor: hexToRgba(film.color, show.isSenior ? 0.9 : 0.75),
        borderLeft: `3px solid ${film.color}`,
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'default',
        zIndex: hovered ? 10 : 1,
        opacity: isDragging ? 0.4 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Trailer buffer indicator */}
      <div
        className="absolute top-0 right-0 bottom-0 opacity-30"
        style={{ width: 20 * zoom, backgroundColor: '#000' }}
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
            {show.isFixed && !show.isSenior && (
              <Lock size={10} className="inline ml-1 text-white/60" />
            )}
            {show.screeningType && (
              <span
                className="ml-1 text-xs font-bold px-0.5 rounded"
                style={{ backgroundColor: SCREENING_TYPES[show.screeningType].color, color: '#fff' }}
              >
                {SCREENING_TYPES[show.screeningType].short}
              </span>
            )}
          </p>
          {hovered && (
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
          {show.isFixed && !show.isSenior && (
            <p className="text-purple-400 text-xs">🔒 Fixed position</p>
          )}
          {show.screeningType && (
            <p className="text-xs font-semibold" style={{ color: SCREENING_TYPES[show.screeningType].color }}>
              {SCREENING_TYPES[show.screeningType].label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
