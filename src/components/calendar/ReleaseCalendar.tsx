import type { ReleaseRow } from '@/lib/calendar/releases';

const fmtMonth = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtDay = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Table: what we hold, what comes next, roughly when. */
export function ReleaseCalendar({ rows }: { rows: ReleaseRow[] }) {
  const sorted = [...rows].sort((a, b) => {
    const rank = (r: ReleaseRow) => (r.status === 'due' ? 0 : r.status === 'upcoming' ? 1 : r.status === 'continuous' ? 2 : 3);
    return rank(a) - rank(b) || (a.expectedAt ?? '').localeCompare(b.expectedAt ?? '');
  });
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-foreground-subtle border-b border-border">
            <th className="py-2 pr-4 font-medium">Data</th>
            <th className="py-2 pr-4 font-medium">Publisher</th>
            <th className="py-2 pr-4 font-medium">Latest held</th>
            <th className="py-2 pr-4 font-medium">Next</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.id} className="border-b border-border align-top">
              <td className="py-3 pr-4">
                <div className="font-medium">{r.name}</div>
                {r.note && <div className="text-xs text-foreground-subtle mt-0.5">{r.note}</div>}
              </td>
              <td className="py-3 pr-4">
                <a href={r.calendarUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-foreground-subtle/40 underline-offset-2 hover:text-foreground">{r.publisher}</a>
              </td>
              <td className="py-3 pr-4 tabular-nums whitespace-nowrap">
                {r.latestPeriod ? (r.cadence === 'monthly' ? fmtMonth(r.latestPeriod) : fmtDay(r.latestPeriod)) : '—'}
              </td>
              <td className="py-3 pr-4 tabular-nums">
                {r.status === 'upcoming' && <>{fmtMonth(r.nextPeriod!)} data, expected ~{fmtDay(r.expectedAt!)}</>}
                {r.status === 'due' && <span className="band-text-elevated">{fmtMonth(r.nextPeriod!)} data due (est. {fmtDay(r.expectedAt!)})</span>}
                {r.status === 'continuous' && <span className="text-foreground-muted">{r.cadence === 'event' ? 'Continuous' : r.cadence === 'daily' ? 'Daily' : 'Weekly'}</span>}
                {r.status === 'unscheduled' && <span className="text-foreground-muted">No fixed date</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-foreground-subtle">
        Expected dates are estimates from each publisher&apos;s usual lag; follow the publisher link for the official calendar.
      </p>
    </div>
  );
}
