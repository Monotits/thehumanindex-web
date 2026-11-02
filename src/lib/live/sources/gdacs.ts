/**
 * Active disasters — GDACS (Global Disaster Alert and Coordination System,
 * UN OCHA + European Commission JRC).
 *
 * Orange/Red alerts for earthquakes, tropical cyclones, floods, volcanoes,
 * droughts and wildfires over the last 30 days. Every tracked country gets
 * a score: no alert = 50 (normal), otherwise the strongest alert decayed by
 * age (see scoreDisasterEvents).
 */

import type { LiveAdapter, LiveObservation } from '../types';
import { scoreDisasterEvents } from '../scoring';
import { fetchJson, ISO3_TO_ISO2 } from '../http';

const WINDOW_DAYS = 30;

interface GdacsFeature {
  properties: {
    eventtype: string;
    eventid: number;
    name?: string;
    alertlevel: 'Green' | 'Orange' | 'Red';
    iso3?: string;
    fromdate: string;
    todate: string;
    affectedcountries?: { iso3?: string; countryname?: string }[];
  };
}

export const gdacsAdapter: LiveAdapter = {
  id: 'gdacs',
  signals: ['active_disasters'],

  async fetch({ countryCodes, timeoutMs, now }) {
    const started = Date.now();
    const end = now ?? new Date();
    const from = new Date(end.getTime() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
    const to = end.toISOString().slice(0, 10);
    const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;VO;DR;WF&fromdate=${from}&todate=${to}&alertlevel=Orange;Red`;

    try {
      const j = await fetchJson<{ features?: GdacsFeature[] }>(url, timeoutMs);
      const byCountry = new Map<string, { alertLevel: 'Green' | 'Orange' | 'Red'; date: string; label: string }[]>();
      for (const f of j.features ?? []) {
        const p = f.properties;
        const iso3s = new Set<string>([...(p.affectedcountries ?? []).map(a => a.iso3 ?? ''), p.iso3 ?? ''].filter(Boolean));
        for (const i3 of iso3s) {
          const cc = ISO3_TO_ISO2[i3];
          if (!cc) continue;
          if (!byCountry.has(cc)) byCountry.set(cc, []);
          byCountry.get(cc)!.push({ alertLevel: p.alertlevel, date: p.todate || p.fromdate, label: `${p.eventtype} ${p.name ?? p.eventid}` });
        }
      }
      const observations: LiveObservation[] = countryCodes.map(cc => {
        const events = byCountry.get(cc) ?? [];
        const s = scoreDisasterEvents(events, { windowDays: WINDOW_DAYS, now: end });
        return {
          countryCode: cc, signalId: 'active_disasters', rawValue: s.rawValue, stressScore: s.stressScore,
          referenceDate: s.referenceDate ?? to, historyN: null, adapterId: this.id,
          payload: { events: events.slice(0, 5).map(e => ({ label: e.label, alert: e.alertLevel, date: e.date.slice(0, 10) })) },
        };
      });
      return {
        observations,
        health: { adapter: this.id, status: 'ok', observations: observations.length, durationMs: Date.now() - started, error: null },
      };
    } catch (e) {
      return {
        observations: [],
        health: { adapter: this.id, status: 'failed', observations: 0, durationMs: Date.now() - started, error: (e as Error).message },
      };
    }
  },
};
