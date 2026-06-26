import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useStore } from '../../store';
import type { ScreenNumber } from '../../types';

interface Props {
  onClose: () => void;
}

const SCREENS: { num: ScreenNumber; label: string }[] = [
  { num: 1, label: 'Screen 1' },
  { num: 2, label: 'Screen 2' },
  { num: 3, label: 'Screen 3' },
];

export function ScreenCapacityModal({ onClose }: Props) {
  const screenCapacities = useStore((s) => s.screenCapacities);
  const setScreenCapacity = useStore((s) => s.setScreenCapacity);

  const [values, setValues] = useState<Record<ScreenNumber, string>>({
    1: screenCapacities[1] > 0 ? String(screenCapacities[1]) : '',
    2: screenCapacities[2] > 0 ? String(screenCapacities[2]) : '',
    3: screenCapacities[3] > 0 ? String(screenCapacities[3]) : '',
  });

  const save = () => {
    SCREENS.forEach(({ num }) => {
      const v = parseInt(values[num]);
      setScreenCapacity(num, isNaN(v) ? 0 : v);
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-700">
          <h2 className="text-white font-bold text-base">Screen Capacities</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-gray-400 text-xs">
            Set the seating capacity for each screen. A progress bar will appear on show blocks as tickets sell.
          </p>
          {SCREENS.map(({ num, label }) => (
            <div key={num} className="flex items-center gap-3">
              <label className="text-white text-sm w-20 flex-shrink-0">{label}</label>
              <div className="flex items-center gap-1 bg-gray-800 rounded px-3 py-1.5 flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={values[num]}
                  onChange={(e) => setValues((v) => ({ ...v, [num]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && save()}
                  className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600"
                />
                <span className="text-gray-500 text-xs flex-shrink-0">seats</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={save}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors font-medium"
          >
            <Check size={12} />
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-gray-400 hover:text-white text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
