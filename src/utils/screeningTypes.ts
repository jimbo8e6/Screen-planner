import type { ScreeningType } from '../types';

export const SCREENING_TYPES: Record<
  ScreeningType,
  { label: string; short: string; color: string }
> = {
  'film-club':    { label: 'Louth Film Club',   short: 'FC', color: '#B91C1C' },
  'cine-circle':  { label: 'Louth Cine Circle', short: 'CC', color: '#6D28D9' },
  'toddlervision':{ label: 'Toddlervision',     short: 'TV', color: '#047857' },
  'penguins':     { label: 'Penguins',          short: 'P',  color: '#1D4ED8' },
  'senior':       { label: 'Senior Screen',      short: 'SR', color: '#B45309' },
};
