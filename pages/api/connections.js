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

async function resolveUserRecordId({ clerkId, recordId, userIdText }) {
  // Direct record id
  if (recordId) {
    try {
      const rec = await base(USERS_TABLE).find(String(recordId));
      if (rec?.id) return rec.id;
    } catch {}
  }
  // Clerk id
  if (clerkId) {
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
  }
  // UserID text
  if (userIdText) {
    for (const f of ['UserID', 'User ID', 'User Id']) {
      try {
        const page = await base(USERS_TABLE)
          .select({ maxRecords: 1, filterByFormula: `{${f}}='${userIdText}'` })
          .firstPage();
        if (page && page.length) return page[0].id;
      } catch (e) {
        if (e?.statusCode !== 422) throw e;
      }
    }
  }
  return null;
}

async function getUserSummary(recId) {
  try {
    const rec = await base(USERS_TABLE).find(recId);
    const f = rec.fields || {};
    return {
      record_id: rec.id,
      name: f['Full Name'] || f['Name'] || '',
      email: f['Email'] || '',
      gender: String(f['Gender'] || f['gender'] || f['Sex'] || '').trim().toLowerCase(),
      clerk_id: f['ClerkID'] || f['Clerk ID'] || '',
      user_id: f['UserID'] || f['User ID'] || '',
      location: f['Location'] || f['City'] || '',
      postcode: f['Postcode'] || f['Postal Code'] || f['ZIP'] || f['Zip'] || f['ZIP Code'] || '',
      interests: Array.isArray(f['Interests']) ? f['Interests'] : [],
      image_url: (() => {
        const cand = ['Photo', 'Profile Photo', 'Avatar', 'Image', 'ProfileImage', 'Picture'];
        for (const k of cand) {
          const v = f[k];
          if (Array.isArray(v) && v.length && v[0]?.url) return v[0].url;
        }
        return '';
      })(),
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    if (!base) return res.status(500).json({ error: 'Airtable not configured' });
    const { userId: authedClerkId } = getAuth(req);

    if (req.method === 'GET') {
      const { clerkId = authedClerkId, status } = req.query || {};
      if (!clerkId) return res.status(401).json({ error: 'Not authenticated' });
      const me = await resolveUserRecordId({ clerkId });
      if (!me) return res.status(404).json({ error: 'Current user not found' });

      // Airtable formulas cannot reliably search linked record IDs. Fetch by status, then filter in code.
      const selector = base(CONNECTIONS_TABLE).select(
        status ? { filterByFormula: `{Status}='${status}'` } : {}
      );
      const allRows = await selector.all();
      const rows = allRows.filter((r) => {
        const f = r.fields || {};
        const req = Array.isArray(f['Requester']) ? f['Requester'] : [];
        const rec = Array.isArray(f['Recipient']) ? f['Recipient'] : [];
        return req.includes(me) || rec.includes(me);
      });

      const edges = [];
      for (const r of rows) {
        const f = r.fields || {};
        const requester = Array.isArray(f['Requester']) ? f['Requester'][0] : null;
        const recipient = Array.isArray(f['Recipient']) ? f['Recipient'][0] : null;
        const otherId = requester === me ? recipient : requester;
        const other = otherId ? await getUserSummary(otherId) : null;
        edges.push({
          id: r.id,
          status: f['Status'] || 'Pending',
          requester,
          recipient,
          other,
          created_at: f['Created At'] || null,
          updated_at: f['Updated At'] || null,
        });
      }

      // Optionally attach RSVP activity for connected users
      try {
        const otherUserIds = Array.from(new Set(edges.map(e => e.other?.user_id).filter(Boolean)));
        if (otherUserIds.length > 0) {
          // Load RSVPs for these users (Going/Interested)
          const orUsers = otherUserIds.map(uid => `{UserID}='${uid}'`).join(',');
          const statusOR = `OR(LOWER({Status})='going', LOWER({Status})='interested', {Status}='Going', {Status}='Interested')`;
          const rsvps = await base(RSVP_TABLE).select({ filterByFormula: `AND(OR(${orUsers}), ${statusOR})` }).all();
          const mapByUser = new Map(); // userId -> [{eventId,status}]
          for (const r of rsvps) {
            const f = r.fields || {};
            const uid = f['UserID'] || f['User ID'] || null;
            const eid = f['Event ID'] || f['EventID'] || f['Event Id'] || null;
            const st = f['Status'] || '';
            if (!uid || !eid) continue;
            if (!mapByUser.has(uid)) mapByUser.set(uid, []);
            mapByUser.get(uid).push({ eventId: String(eid), status: st });
          }
          // Load events to enrich titles/dates
          const proto = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host;
          const baseUrl = `${proto}://${host}`;
          const eResp = await fetch(`${baseUrl}/api/events`).catch(() => null);
          const eJson = await eResp?.json();
          const events = Array.isArray(eJson?.events) ? eJson.events : [];
          const eventsById = Object.fromEntries(events.map((e) => [e.public_id || e.id, e]));
          // Attach up to 3 upcoming RSVPs per user
          const nowTs = Date.now();
          for (const edge of edges) {
            const uid = edge.other?.user_id;
            const raw = uid ? mapByUser.get(uid) || [] : [];
            const enriched = raw
              .map(r => {
                const ev = eventsById[r.eventId];
                return ev ? { eventId: r.eventId, title: ev.title, start_at: ev.start_at, status: r.status } : null;
              })
              .filter(Boolean)
              .sort((a, b) => new Date(a.start_at || 0) - new Date(b.start_at || 0))
              .filter(x => new Date(x.start_at || 0).getTime() >= nowTs)
              .slice(0, 3);
            edge.other_rsvps = enriched;
          }
        }
      } catch {
        // ignore activity attachment failures
      }

      return res.status(200).json({ connections: edges });
    }

  if (req.method === 'POST') {
    const { toClerkId, toUserId, toRecordId } = req.body || {};
    const fromClerk = authedClerkId || req.body?.fromClerkId;
    if (!fromClerk) return res.status(401).json({ error: 'Not authenticated' });
    const fromRid = await resolveUserRecordId({ clerkId: fromClerk });
    if (!fromRid) return res.status(404).json({ error: 'Current user not found' });

    const toRid = await resolveUserRecordId({ clerkId: toClerkId, userIdText: toUserId, recordId: toRecordId });
    if (!toRid) return res.status(404).json({ error: 'Target user not found' });
    if (toRid === fromRid) return res.status(400).json({ error: 'Cannot connect to yourself' });

    // Enforce gender segregation for new connections when both sides have gender
    const [fromUser, toUser] = await Promise.all([getUserSummary(fromRid), getUserSummary(toRid)]);
    const g1 = String(fromUser?.gender || '').toLowerCase();
    const g2 = String(toUser?.gender || '').toLowerCase();
    if ((g1 === 'female' || g1 === 'male') && (g2 === 'female' || g2 === 'male') && g1 !== g2) {
      return res.status(403).json({ error: 'Cross-gender connections are restricted' });
    }

      // Check existing edges (both directions). Fetch and filter in code to match linked record IDs.
      const exRows = await base(CONNECTIONS_TABLE).select().all();
      const existing = exRows.find((r) => {
        const f = r.fields || {};
        const req = Array.isArray(f['Requester']) ? f['Requester'] : [];
        const rec = Array.isArray(f['Recipient']) ? f['Recipient'] : [];
        return (
          (req.includes(fromRid) && rec.includes(toRid)) ||
          (req.includes(toRid) && rec.includes(fromRid))
        );
      });
      if (existing) {
        const f = existing.fields || {};
        return res.status(200).json({ id: existing.id, status: f['Status'] || 'Pending' });
      }

      // Create connection; be tolerant of Airtable field types (e.g., Created time cannot be set)
      let rec;
      try {
        rec = await base(CONNECTIONS_TABLE).create({
          Requester: [fromRid],
          Recipient: [toRid],
          Status: 'Pending',
          'Created At': new Date().toISOString(),
        });
      } catch (e) {
        // Retry without Created At if the field is not writable
        rec = await base(CONNECTIONS_TABLE).create({
          Requester: [fromRid],
          Recipient: [toRid],
          Status: 'Pending',
        });
      }
      return res.status(201).json({ id: rec.id, status: rec.fields['Status'] || 'Pending' });
    }

    if (req.method === 'PATCH') {
      const { id, action } = req.body || {};
      if (!id || !action) return res.status(400).json({ error: 'Missing id or action' });
      const update = {};
      if (action === 'accept') update['Status'] = 'Accepted';
      else if (action === 'decline') update['Status'] = 'Declined';
      else if (action === 'block') update['Status'] = 'Blocked';
      else if (action === 'withdraw') update['Status'] = 'Declined';
      else return res.status(400).json({ error: 'Invalid action' });
      // Try to set Updated At; if field is not writable, retry without it
      let rec;
      try {
        update['Updated At'] = new Date().toISOString();
        rec = await base(CONNECTIONS_TABLE).update(id, update);
      } catch (e) {
        rec = await base(CONNECTIONS_TABLE).update(id, { Status: update['Status'] });
      }
      return res.status(200).json({ id: rec.id, status: rec.fields['Status'] });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e) {
    console.error('Connections API error', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
