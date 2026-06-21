import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addDays } from 'date-fns';
import type { Film, Show, ScreenNumber } from '../types';
import { minutesToTimeString, showDurationMinutes } from './time';

const DAY_NAMES = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const SCREEN_SHORT: Record<ScreenNumber, string> = { 1: 'Sc1', 2: 'Sc2', 3: 'Sc3' };

export function exportSchedulePdf(
  weekStart: string,
  films: Film[],
  shows: Show[],
  cinemaName = 'Cinema Programme'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  const weekDate = new Date(weekStart);
  const weekEnd = addDays(weekDate, 6);
  const weekLabel = `${format(weekDate, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`;
  const dayDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekDate, i), 'yyyy-MM-dd')
  );

  // ── Header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Weekly Sessions by Film', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Week commencing ${format(weekDate, 'd MMMM yyyy')}`, 14, 20);
  doc.text(cinemaName, pageW - 14, 14, { align: 'right' });
  doc.text(weekLabel, pageW - 14, 20, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // ── Table data ──
  const activeFilms = films
    .filter((f) => shows.some((s) => s.filmId === f.id))
    .sort((a, b) => a.title.localeCompare(b.title));

  const head = [
    [
      { content: 'Film', styles: { halign: 'left' as const } },
      ...DAY_NAMES.map((day, i) => ({
        content: `${day}  ${format(addDays(weekDate, i), 'd MMM')}`,
        styles: { halign: 'center' as const },
      })),
    ],
  ];

  const body = activeFilms.map((film) => [
    { content: `${film.title}\n(${film.runtime} min)`, styles: { fontStyle: 'bold' as const } },
    ...dayDates.map((date) => {
      const dayShows = shows
        .filter((s) => s.filmId === film.id && s.date === date)
        .sort((a, b) => a.startMinute - b.startMinute);

      if (dayShows.length === 0) return { content: '' };

      const lines = dayShows.map((s) => {
        const end = s.startMinute + showDurationMinutes(film.runtime);
        return `${minutesToTimeString(s.startMinute)}–${minutesToTimeString(end)}  ${SCREEN_SHORT[s.screen]}`;
      });

      return { content: lines.join('\n') };
    }),
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 26,
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      valign: 'top',
      lineColor: [210, 215, 220],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [29, 54, 94],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', fillColor: [245, 247, 250] },
    },
    alternateRowStyles: { fillColor: [252, 253, 255] },
    tableLineColor: [180, 185, 195],
    tableLineWidth: 0.3,
  });

  // Footer
  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Generated ${format(new Date(), 'd MMM yyyy HH:mm')}`,
    14,
    Math.min(finalY, doc.internal.pageSize.getHeight() - 8)
  );

  // Share or download
  const filename = `schedule-${weekStart}.pdf`;
  const blob = doc.output('blob');

  if (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
  ) {
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: `Cinema Schedule ${weekLabel}` });
      return;
    }
  }

  // Fallback: trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
