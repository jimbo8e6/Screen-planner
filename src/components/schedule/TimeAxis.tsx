interface Props {
  timelineStart: number; // minutes from midnight
  timelineEnd: number;
  zoom: number;
}

export function TimeAxis({ timelineStart, timelineEnd, zoom }: Props) {
  const hours: number[] = [];
  const startHour = Math.floor(timelineStart / 60);
  const endHour = Math.ceil(timelineEnd / 60);
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }

  return (
    <div className="flex">
      {/* Spacer for track label column */}
      <div className="w-28 flex-shrink-0 border-r border-gray-700" />

      {/* Time labels */}
      <div
        className="relative flex-1 h-8 border-b border-gray-700 bg-gray-900"
        style={{ minWidth: (timelineEnd - timelineStart) * zoom }}
      >
        {hours.map((h) => {
          const minute = h * 60;
          const left = (minute - timelineStart) * zoom;
          if (left < 0) return null;
          const label = `${String(h % 24).padStart(2, '0')}:00`;
          return (
            <div
              key={h}
              className="absolute flex flex-col items-start"
              style={{ left }}
            >
              <span className="text-gray-400 text-xs px-1 pt-1 whitespace-nowrap">
                {label}
              </span>
              <div className="w-px h-2 bg-gray-600 ml-0.5" />
            </div>
          );
        })}

        {/* Half-hour ticks */}
        {hours.map((h) => {
          const minute = h * 60 + 30;
          const left = (minute - timelineStart) * zoom;
          if (left < 0) return null;
          return (
            <div
              key={`${h}-30`}
              className="absolute bottom-0"
              style={{ left }}
            >
              <div className="w-px h-1.5 bg-gray-600" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
