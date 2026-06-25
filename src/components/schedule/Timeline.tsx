import { useRef, useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Palette, Layers, Unlock } from 'lucide-react';
import { useStore } from '../../store';
import { TimeAxis } from './TimeAxis';
import { ScreenTrack } from './ScreenTrack';
import { ShowDetailModal } from './ShowDetailModal';
import { OpenSessionsModal } from '../modals/OpenSessionsModal';

const DAY_NAMES = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

// Timeline shows 10:00 AM to midnight
const TIMELINE_START = 10 * 60; // 600
const TIMELINE_END = 24 * 60; // 1440

export function Timeline() {
  const weekStart = useStore((s) => s.weekStart);
  const selectedDay = useStore((s) => s.selectedDay);
  const zoom = useStore((s) => s.zoom);
  const setSelectedDay = useStore((s) => s.setSelectedDay);
  const setZoom = useStore((s) => s.setZoom);
  const nextWeek = useStore((s) => s.nextWeek);
  const prevWeek = useStore((s) => s.prevWeek);
  const shows = useStore((s) => s.shows);
  const colorMode = useStore((s) => s.colorMode);
  const setColorMode = useStore((s) => s.setColorMode);
  const openSessions = useStore((s) => s.openSessions);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [detailShowId, setDetailShowId] = useState<string | null>(null);
  const [selectedShowIds, setSelectedShowIds] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  const handleShowSelect = (showId: string, toggle: boolean) => {
    if (toggle) {
      setSelectedShowIds((prev) =>
        prev.includes(showId) ? prev.filter((id) => id !== showId) : [...prev, showId]
      );
    } else {
      setSelectedShowIds([showId]);
    }
  };

  const clearSelection = () => setSelectedShowIds([]);
  const [openSessionsModal, setOpenSessionsModal] = useState(false);

  // All show IDs in the current week (for "open all")
  const weekShowIds = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(new Date(weekStart), i), 'yyyy-MM-dd')
    );
    return shows.filter((s) => dates.includes(s.date)).map((s) => s.id);
  }, [shows, weekStart]);

  const currentDate = format(
    addDays(new Date(weekStart), selectedDay),
    'yyyy-MM-dd'
  );

  const weekLabel = format(new Date(weekStart), "'w/c' d MMM yyyy");

  // Count shows per day for the day tabs
  const showCountByDay = DAY_NAMES.map((_, i) => {
    const d = format(addDays(new Date(weekStart), i), 'yyyy-MM-dd');
    return shows.filter((s) => s.date === d).length;
  });

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Week navigation + day tabs */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 bg-gray-800 flex-shrink-0">
        <button
          onClick={prevWeek}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-gray-300 text-sm font-medium min-w-36 text-center">
          {weekLabel}
        </span>
        <button
          onClick={nextWeek}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={18} />
        </button>

        <div className="flex-1 flex gap-1">
          {DAY_NAMES.map((name, i) => {
            const dayDate = addDays(new Date(weekStart), i);
            const isSelected = i === selectedDay;
            const count = showCountByDay[i];
            return (
              <button
                key={name}
                onClick={() => { setSelectedDay(i); clearSelection(); }}
                className={`flex-1 flex flex-col items-center py-1 px-1 rounded text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="font-medium">{name}</span>
                <span className={isSelected ? 'text-blue-200' : 'text-gray-500'}>
                  {format(dayDate, 'd')}
                </span>
                {count > 0 && (
                  <span
                    className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Colour mode toggle */}
        <div className="flex items-center border-l border-gray-700 pl-2 gap-1">
          <button
            onClick={() => setColorMode(colorMode === 'per-film' ? 'by-category' : 'per-film')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              colorMode === 'by-category'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title={colorMode === 'per-film' ? 'Switch to category colours' : 'Switch to per-film colours'}
          >
            <Palette size={14} />
          </button>
          <button
            onClick={() => { setMultiSelectMode((v) => !v); if (multiSelectMode) clearSelection(); }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              multiSelectMode
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title={multiSelectMode ? 'Exit multi-select' : 'Multi-select (or Ctrl/⌘+click)'}
          >
            <Layers size={14} />
            {selectedShowIds.length > 1 && (
              <span className="font-medium">{selectedShowIds.length}</span>
            )}
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
          <button
            onClick={() => setZoom(zoom - 0.5)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-gray-400 text-xs w-6 text-center">
            {zoom}×
          </span>
          <button
            onClick={() => setZoom(zoom + 0.5)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable timeline */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
        style={{ minHeight: 0 }}
      >
        <div
          style={{
            width: Math.max((TIMELINE_END - TIMELINE_START) * zoom + 112, 600),
            minWidth: '100%',
          }}
        >
          <TimeAxis
            timelineStart={TIMELINE_START}
            timelineEnd={TIMELINE_END}
            zoom={zoom}
          />
          {([1, 2, 3] as const).map((screen) => (
            <ScreenTrack
              key={screen}
              screen={screen}
              date={currentDate}
              zoom={zoom}
              timelineStart={TIMELINE_START}
              selectedShowIds={selectedShowIds}
              multiSelectMode={multiSelectMode}
              onShowSelect={handleShowSelect}
              onClearSelection={clearSelection}
              onShowClick={setDetailShowId}
            />
          ))}
        </div>
      </div>

      {/* Open Sessions bar */}
      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800 px-3 py-2 flex items-center gap-3">
        <button
          onClick={() => setOpenSessionsModal(true)}
          disabled={weekShowIds.length === 0}
          className="flex items-center gap-1.5 bg-green-700/80 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded py-1.5 px-3 transition-colors font-medium"
        >
          <Unlock size={13} />
          Open Sessions
        </button>
        {selectedShowIds.length > 0 && (
          <span className="text-gray-400 text-xs">
            {selectedShowIds.length} show{selectedShowIds.length !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      {detailShowId && (
        <ShowDetailModal
          showId={detailShowId}
          onClose={() => setDetailShowId(null)}
        />
      )}

      {openSessionsModal && (
        <OpenSessionsModal
          mode={selectedShowIds.length > 0 ? 'selected' : 'all'}
          weekStart={weekStart}
          selectedCount={selectedShowIds.length}
          onConfirm={() => {
            openSessions(selectedShowIds.length > 0 ? selectedShowIds : weekShowIds);
          }}
          onClose={() => setOpenSessionsModal(false)}
        />
      )}
    </div>
  );
}
