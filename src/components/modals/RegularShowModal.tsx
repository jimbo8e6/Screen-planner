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

const PRESETS = [
  {
    id: 'preset-film-club',
    name: 'Louth Film Club',
    color: '#B91C1C',
    runtime: 120,
    defaultTime: '19:30',
  },
  {
    id: 'preset-cine-circle',
    name: 'Louth Cine Circle',
    color: '#6D28D9',
    runtime: 120,
    defaultTime: '19:30',
  },
  {
    id: 'preset-toddlervision',
    name: 'Toddlervision',
    color: '#047857',
    runtime: 75,
    defaultTime: '10:30',
  },
  {
    id: 'preset-penguins',
    name: 'Penguins',
    color: '#1D4ED8',
    runtime: 90,
    defaultTime: '11:00',
  },
] as const;

type PresetId = (typeof PRESETS)[number]['id'];

export function RegularShowModal({ onClose }: Props) {
  const weekStart = useStore((s) => s.weekStart);
  const films = useStore((s) => s.films);
  const addFixedShow = useStore((s) => s.addFixedShow);

  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null);
  const [dayIdx, setDayIdx] = useState(3); // Monday default
  const [screen, setScreen] = useState<ScreenNumber>(2);
  const [startTime, setStartTime] = useState('19:30');
  const [runtime, setRuntime] = useState(120);

  const selectPreset = (preset: (typeof PRESETS)[number]) => {
    setSelectedPreset(preset.id);
    setStartTime(preset.defaultTime);
    setRuntime(preset.runtime);
  };

  const handleAdd = () => {
    const preset = PRESETS.find((p) => p.id === selectedPreset);
    if (!preset) return;

    const date = format(addDays(new Date(weekStart), dayIdx), 'yyyy-MM-dd');

    // Add the preset to films if not already there
    if (!films.some((f) => f.id === preset.id)) {
      useStore.setState((s) => ({
        films: [
          ...s.films,
          {
            id: preset.id,
            tmdbId: -1,
            title: preset.name,
            runtime: preset.runtime,
            poster: null,
            year: new Date().getFullYear(),
            overview: '',
            color: preset.color,
            terms: { type: 'one-per-day' as const },
            isSeniorFilm: false,
          },
        ],
      }));
    }

    addFixedShow({
      filmId: preset.id,
      screen,
      date,
      startMinute: timeStringToMinutes(startTime),
      isFixed: true,
      isSenior: false,
    });

    onClose();
  };

  const active = PRESETS.find((p) => p.id === selectedPreset);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-5 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Regular Shows</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Preset selector */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className="relative rounded-lg p-2.5 text-left transition-all border-2"
                style={{
                  borderColor: isSelected ? preset.color : 'transparent',
                  backgroundColor: isSelected ? preset.color + '22' : '#374151',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full mb-1.5"
                  style={{ backgroundColor: preset.color }}
                />
                <p className="text-white text-xs font-medium leading-tight">
                  {preset.name}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">{preset.runtime} min</p>
              </button>
            );
          })}
        </div>

        {/* Scheduling fields — only visible once a type is selected */}
        {active && (
          <div className="space-y-3 border-t border-gray-700 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Day</label>
                <select
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1"
                  style={{ ['--tw-ring-color' as string]: active.color }}
                  value={dayIdx}
                  onChange={(e) => setDayIdx(Number(e.target.value))}
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Screen</label>
                <select
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none"
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
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Runtime (min)</label>
                <input
                  type="number"
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none"
                  value={runtime}
                  onChange={(e) => setRuntime(Number(e.target.value))}
                  min={30}
                  max={300}
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full text-white text-sm rounded py-2 font-medium transition-colors"
              style={{ backgroundColor: active.color }}
            >
              Add {active.name}
            </button>
          </div>
        )}

        {!active && (
          <p className="text-gray-500 text-xs text-center">
            Select a show type above to set the date and time
          </p>
        )}
      </div>
    </div>
  );
}
