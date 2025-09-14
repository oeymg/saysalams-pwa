import Airtable from 'airtable';
import { getAuth } from '@clerk/nextjs/server';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const CONNECTIONS_TABLE = process.env.AIRTABLE_CONNECTIONS_TABLE || 'Connections';
const RSVP_TABLE = process.env.AIRTABLE_RSVP_TABLE || 'RSVPs';

const base = (AIRTABLE_TOKEN && AIRTABLE_BASE_ID)
  ? new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID)
  : null;

async function resolveUserRecordId(clerkId) {
  for (const f of ['ClerkID', 'Clerk ID']) {
    try {
      const page = await base(USERS_TABLE)
        .select({ maxRecords: 1, filterByFormula: `{${f}}='${clerkId}'` })
        .firstPage();
      if (page && page.length) return page[0].id;
    } catch (e) {
      if (e?.statusCode !== 422) throw e;
    }
  }
  return null;
}

async function listConnectionUserIds(me) {
  // Fetch accepted connections, then filter by linked record IDs in code
  const all = await base(CONNECTIONS_TABLE).select({ filterByFormula: `{Status}='Accepted'` }).all();
  const ids = new Set();
  for (const r of all) {
    const f = r.fields || {};
    const reqArr = Array.isArray(f['Requester']) ? f['Requester'] : [];
    const recArr = Array.isArray(f['Recipient']) ? f['Recipient'] : [];
    if (!(reqArr.includes(me) || recArr.includes(me))) continue;
    const requester = reqArr[0] || null;
    const recipient = recArr[0] || null;
    const other = requester === me ? recipient : requester;
    if (other) ids.add(other);
  }
  return Array.from(ids);
}

async function getUserIdText(recId) {
  try {
    const rec = await base(USERS_TABLE).find(recId);
    return rec.fields['UserID'] || rec.fields['User ID'] || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    if (!base) return res.status(200).json({ events: [] });
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return res.status(401).json({ error: 'Not authenticated' });
    const me = await resolveUserRecordId(clerkId);
    if (!me) return res.status(404).json({ error: 'Current user not found' });

    const { windowDays = 60 } = req.query || {};
    const connections = await listConnectionUserIds(me);
    if (connections.length === 0) return res.status(200).json({ events: [] });

    // Map connections to their UserID text
    const userIdTexts = (await Promise.all(connections.map(getUserIdText))).filter(Boolean);
    if (userIdTexts.length === 0) return res.status(200).json({ events: [] });

    // Build RSVP filter: userIdTexts OR + status Going/Interested
    const usersOR = userIdTexts.map((v) => `{UserID}='${v}'`).join(',');
    const statusOR = `OR({Status}='Going', {Status}='Interested')`;
    const filter = `AND(OR(${usersOR}), ${statusOR})`;
    const rsvps = await base(RSVP_TABLE).select({ filterByFormula: filter }).all();

    // Group by Event ID
    const byEvent = new Map();
    for (const r of rsvps) {
      const f = r.fields || {};
      const eid = f['Event ID'];
      if (!eid) continue;
      if (!byEvent.has(eid)) byEvent.set(eid, { eventId: eid, going: 0, interested: 0 });
      const row = byEvent.get(eid);
      if (f['Status'] === 'Going') row.going += 1;
      if (f['Status'] === 'Interested') row.interested += 1;
    }

    // Join event details from /api/events
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${proto}://${host}`;
    const resp = await fetch(`${baseUrl}/api/events`);
    const data = await resp.json();
    const events = data?.events || [];
    const eventsById = Object.fromEntries(events.map((e) => [e.public_id || e.id, e]));

    const feed = [];
    for (const [, agg] of byEvent) {
      const ev = eventsById[agg.eventId];
      if (!ev) continue;
      feed.push({ ...ev, connections_going: agg.going, connections_interested: agg.interested });
    }

    // Sort by date asc
    feed.sort((a, b) => new Date(a.start_at || 0) - new Date(b.start_at || 0));

    return res.status(200).json({ events: feed });
  } catch (e) {
    console.error('Feed API error', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
