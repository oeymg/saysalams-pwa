import Airtable from 'airtable';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const EVENTS_TABLE = process.env.AIRTABLE_TABLE || 'Events';
const OCCURRENCES_TABLE = process.env.AIRTABLE_OCCURRENCES_TABLE || 'Occurrences';

const base = (AIRTABLE_TOKEN && AIRTABLE_BASE_ID)
  ? new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID)
  : null;

async function getSeriesEventId(seriesRecId) {
  try {
    const rec = await base(EVENTS_TABLE).find(seriesRecId);
    return rec?.fields?.['EventID'] || rec?.fields?.['Event Id'] || rec?.fields?.['Event ID'] || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    if (!base) return res.status(200).json({ occurrences: [] });
    const { eventId } = req.query || {};
    const wantId = (eventId || '').trim();
    const isRecordId = wantId && wantId.startsWith('rec');

    // Fetch occurrences (limit to a reasonable number in production)
    const occs = await base(OCCURRENCES_TABLE).select().all();

    const rows = [];
    for (const r of occs) {
      const f = r.fields || {};
      const seriesLink = Array.isArray(f['Series']) ? f['Series'][0] : (Array.isArray(f['Event']) ? f['Event'][0] : null);
      let seriesEventId = f['Event ID'] || f['EventID'] || null;
      if (!seriesEventId && seriesLink) {
        seriesEventId = await getSeriesEventId(seriesLink);
      }

      const mapped = {
        record_id: r.id,
        occurrence_id: f['OccurrenceID'] || f['OccurenceID'] || r.id,
        start_at: f['Start'] || f['Date'] || null,
        end_at: f['End'] || null,
        status: f['Status'] || 'Scheduled',
        event_public_id: seriesEventId,
        series_record_id: seriesLink,
        venue: f['Location'] || null,
        city_region: f['City/Region'] || null,
      };

      if (!wantId) {
        rows.push(mapped);
      } else if (seriesEventId && seriesEventId === wantId) {
        rows.push(mapped);
      } else if (isRecordId && seriesLink && seriesLink === wantId) {
        // Allow matching by the Events record id when slug is a rec... id
        rows.push(mapped);
      }
    }

    // De-duplicate by (event_public_id, start_at) to defend against automation duplicates
    const seen = new Set();
    const deduped = [];
    for (const o of rows) {
      const key = `${o.event_public_id || o.series_record_id || 'noevent'}__${o.start_at || 'nostart'}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(o);
    }

    // Sort by start
    deduped.sort((a, b) => new Date(a.start_at || 0) - new Date(b.start_at || 0));

    return res.status(200).json({ occurrences: deduped });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to fetch occurrences' });
  }
}
