import { useState } from 'react';
import { X, FileDown } from 'lucide-react';
import { useStore } from '../../store';
import { exportSessionsReport } from '../../utils/exportPdf';

interface Props {
  onClose: () => void;
}

export function SessionsReportModal({ onClose }: Props) {
  const weekStart = useStore((s) => s.weekStart);
  const films = useStore((s) => s.films);
  const shows = useStore((s) => s.shows);
  const storedName = useStore((s) => s.cinemaName);
  const storedAddress = useStore((s) => s.cinemaAddress);
  const setCinemaName = useStore((s) => s.setCinemaName);
  const setCinemaAddress = useStore((s) => s.setCinemaAddress);

  const [name, setName] = useState(storedName);
  const [address, setAddress] = useState(storedAddress);

  const handleExport = () => {
    setCinemaName(name);
    setCinemaAddress(address);
    exportSessionsReport(weekStart, films, shows, name, address);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-5 w-96 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileDown size={16} className="text-green-400" />
            <h2 className="text-white font-semibold">Sessions Report PDF</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-gray-400 text-xs mb-4">
          Generates a "Weekly Sessions by Film" report matching your cinema management system's layout.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Cinema name</label>
            <input
              type="text"
              placeholder="e.g. Playhouse Louth"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">
              Address <span className="text-gray-600 font-normal">(one line per row)</span>
            </label>
            <textarea
              placeholder={"Playhouse Cinema Louth\nCannon Street\nLouth\nLN11 9NL"}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={4}
              className="w-full bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 bg-green-700 hover:bg-green-600 text-white text-sm rounded py-2 transition-colors flex items-center justify-center gap-1.5"
          >
            <FileDown size={13} />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
