import { format, addDays } from 'date-fns';
import { Unlock } from 'lucide-react';

interface Props {
  mode: 'all' | 'selected';
  weekStart: string;
  selectedCount: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function OpenSessionsModal({ mode, weekStart, selectedCount, onConfirm, onClose }: Props) {
  const fri = format(new Date(weekStart), 'd MMM');
  const thu = format(addDays(new Date(weekStart), 6), 'd MMM yyyy');

  const message = mode === 'all'
    ? `Open all sessions between ${fri} – ${thu}?`
    : `Open ${selectedCount} selected session${selectedCount !== 1 ? 's' : ''}?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm border border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Unlock size={18} className="text-green-400" />
          <h2 className="text-white font-bold text-base">Open Sessions</h2>
        </div>
        <p className="text-gray-300 text-sm">{message}</p>
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            No
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors font-medium"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
