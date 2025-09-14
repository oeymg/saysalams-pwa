import Airtable from 'airtable';

const {
  AIRTABLE_TOKEN,
  AIRTABLE_BASE_ID,
  AIRTABLE_TABLE = 'Events',
  AIRTABLE_VIEW = 'Published',
  AIRTABLE_RSVP_TABLE = 'RSVPs',
  AIRTABLE_OCCURRENCES_TABLE = 'Occurrences',
} = process.env;

const base =
  AIRTABLE_TOKEN && AIRTABLE_BASE_ID
    ? new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID)
    : null;

export default async function handler(req, res) {
  try {
    if (!base) {
      // Fail soft: return empty list so the site can render without envs
      return res.status(200).json({ events: [] });
    }
    let records;
    try {
      records = await base(AIRTABLE_TABLE).select({ view: AIRTABLE_VIEW }).all();
    } catch (e) {
      // Fallback when the view doesn't exist or is misnamed
      if (e?.statusCode === 422) {
        records = await base(AIRTABLE_TABLE).select().all();
      } else {
        throw e;
      }
    }

    const rows = records.map((r) => {
      const f = r.fields || {};
      const eventId = f['EventID'] || r.id;
      return {
        record_id: r.id,
        id: eventId,
        public_id: eventId,
        title: f['Title'] || f['Event Name'] || 'Untitled',
        start_at: f['Event Date'] || null,
        duration: f['Duration'] || null,
        venue: f['Location'] || null,
        city_region: f['City/Region'] || f['City'] || null,
        description: f['Event Description'] || null,
        summary: f['Summary'] || null,
        image_url:
          Array.isArray(f['Event Photo']) && f['Event Photo'][0]?.url
            ? `${f['Event Photo'][0].url}?w=800&h=400&fit=crop`
            : null,
        tickets_url: f['Event Link'] || null,
        cost: f['Cost'] || null,
        audience: Array.isArray(f['Audience'])
          ? f['Audience']
          : (typeof f['Audience'] === 'string' ? f['Audience'].split(',').map(s => s.trim()).filter(Boolean) : []),
        category: Array.isArray(f['Category'])
          ? f['Category']
          : (typeof f['Category'] === 'string' ? f['Category'].split(',').map(s => s.trim()).filter(Boolean) : []),
        repeat: f['Repeat'] || 'None',
        repeat_interval: f['Repeat Interval'] || null,
        by_day: Array.isArray(f['By Day']) ? f['By Day'] : [],
        repeat_until: f['Repeat Until'] || null,
        is_recurring: !!(f['Repeat'] && String(f['Repeat']).toLowerCase() !== 'none'),
        approval_status: f['Approval Status'] || null,
        organiser: Array.isArray(f['Organiser']) ? f['Organiser'][0] : null,
        organiser_name: f['Organiser Name'] || null,
        going_count: 0,
        next_occurrence: null,
        next_going_count: 0,
      };
    });

    rows.sort(
      (a, b) => new Date(a.start_at || 0) - new Date(b.start_at || 0)
    );

    // Compute next occurrence per event and count 'Going' per next occurrence.
    try {
      if (rows.length > 0) {
        const now = Date.now();
        const byEventRecordId = new Map(records.map((r) => [r.id, (r.fields?.['EventID'] || r.id)]));
        const eventsByPublicId = new Map(rows.map((e) => [e.public_id, e]));

        // Load occurrences once
        const occs = await base(AIRTABLE_OCCURRENCES_TABLE).select().all();
        const occsByEvent = new Map(); // eventPublicId -> [occ]

        for (const o of occs) {
          const f = o.fields || {};
          const occId = f['OccurrenceID'] || f['OccurenceID'] || o.id;
          const start = f['Start'] || f['Date'] || null;
          const startAt = start ? new Date(start).getTime() : null;
          const seriesLink = Array.isArray(f['Series']) ? f['Series'][0] : (Array.isArray(f['Event']) ? f['Event'][0] : null);
          let eventPublicId = f['Event ID'] || f['EventID'] || null;
          if (!eventPublicId && seriesLink && byEventRecordId.has(seriesLink)) {
            eventPublicId = byEventRecordId.get(seriesLink);
          }
          if (!eventPublicId) continue;
          const arr = occsByEvent.get(eventPublicId) || [];
          arr.push({ occurrence_id: occId, start_at: start, start_ts: startAt });
          occsByEvent.set(eventPublicId, arr);
        }

        // Determine next occurrence per event
        const selectedOccs = new Map(); // eventPublicId -> occurrence_id
        for (const [eventId, list] of occsByEvent.entries()) {
          if (!Array.isArray(list) || list.length === 0) continue;
          // Prefer upcoming occurrences
          const upcoming = list.filter(o => o.start_ts && o.start_ts >= now).sort((a, b) => a.start_ts - b.start_ts);
          const chosen = (upcoming[0] || list.sort((a, b) => (a.start_ts || 0) - (b.start_ts || 0))[0]);
          selectedOccs.set(eventId, chosen);
          const ev = eventsByPublicId.get(eventId);
          if (ev) ev.next_occurrence = { occurrence_id: chosen.occurrence_id, start_at: chosen.start_at };
        }

        // Count RSVPs per selected occurrence
        const occIds = Array.from(selectedOccs.values()).map(o => o.occurrence_id);
        if (occIds.length > 0) {
          const statusOR = `OR(LOWER({Status})='going', {Status}='Going')`;
          const trySelect = async (formula) => {
            try {
              const recs = await base(AIRTABLE_RSVP_TABLE).select({ filterByFormula: formula }).all();
              return recs;
            } catch (e) {
              if (e?.statusCode === 422) return null; // field mismatch, try next
              throw e;
            }
          };
          const variants = ['Occurrence ID', 'OccurrenceID', 'OccurenceID'];
          let got = null;
          for (const field of variants) {
            const orExpr = occIds.map((id) => `{${field}}='${id}'`).join(',');
            const formula = `AND(OR(${orExpr}), ${statusOR})`;
            const recs = await trySelect(formula);
            if (recs) { got = { field, recs }; break; }
          }
          const countByOcc = new Map();
          if (got) {
            for (const r of got.recs) {
              const f = r.fields || {};
              const oid = f[got.field] || f['Occurrence ID'] || f['OccurrenceID'] || f['OccurenceID'];
              if (!oid) continue;
              countByOcc.set(oid, (countByOcc.get(oid) || 0) + 1);
            }
          }
          for (const [eventId, occ] of selectedOccs.entries()) {
            const ev = eventsByPublicId.get(eventId);
            if (!ev) continue;
            ev.next_going_count = countByOcc.get(occ.occurrence_id) || 0;
          }
        }

        // As a fallback, also compute total-going per event if next occurrence not present
        const ids = rows.map((e) => e.public_id).filter(Boolean);
        const trySelectTotal = async (formula) => {
          try {
            const recs = await base(AIRTABLE_RSVP_TABLE).select({ filterByFormula: formula }).all();
            return recs;
          } catch (e) {
            if (e?.statusCode === 422) return null;
            throw e;
          }
        };
        const statusOR2 = `OR(LOWER({Status})='going', {Status}='Going')`;
        let gotTotal = null;
        for (const field of ['EventID', 'Event ID', 'Event Id']) {
          const orExpr = ids.map((id) => `{${field}}='${id}'`).join(',');
          const formula = `AND(OR(${orExpr}), ${statusOR2})`;
          const recs = await trySelectTotal(formula);
          if (recs) { gotTotal = { field, recs }; break; }
        }
        if (gotTotal) {
          const map = new Map();
          for (const r of gotTotal.recs) {
            const f = r.fields || {};
            const eid = f[gotTotal.field];
            if (!eid) continue;
            map.set(eid, (map.get(eid) || 0) + 1);
          }
          for (const ev of rows) {
            ev.going_count = map.get(ev.public_id) || 0;
          }
        }
      }
    } catch {
      // Fail soft: keep counts at 0
    }

    res.status(200).json({ events: rows });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
