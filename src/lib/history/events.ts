/**
 * Chart annotations for the historical series. Only widely documented
 * events, kept short. Global events apply to every country.
 */

export interface HistoryEvent { year: number; label: string }

const GLOBAL: HistoryEvent[] = [
  { year: 2008, label: 'Global financial crisis' },
  { year: 2020, label: 'COVID-19' },
];

const BY_COUNTRY: Record<string, HistoryEvent[]> = {
  TR: [{ year: 2001, label: 'Banking crisis' }, { year: 2018, label: 'Currency crisis' }],
  AR: [{ year: 2001, label: 'Default & peso crisis' }, { year: 2018, label: 'Peso crisis' }],
  GB: [{ year: 2016, label: 'Brexit vote' }],
  JP: [{ year: 2011, label: 'Tōhoku earthquake' }],
  IN: [{ year: 2016, label: 'Demonetisation' }],
  BR: [{ year: 2015, label: 'Recession' }],
};

export function eventsFor(code: string): HistoryEvent[] {
  return [...GLOBAL, ...(BY_COUNTRY[code.toUpperCase()] ?? [])].sort((a, b) => a.year - b.year);
}
