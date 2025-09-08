import Airtable from 'airtable';
import { getAuth } from '@clerk/nextjs/server';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const CONNECTIONS_TABLE = process.env.AIRTABLE_CONNECTIONS_TABLE || 'Connections';

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  throw new Error('Missing Airtable environment variables');
}

const base = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

async function resolveUserRecordId({ clerkId, recordId, userIdText }) {
  // Direct record id
  if (recordId) {
    try {
      const rec = await base(USERS_TABLE).find(String(recordId));
      if (rec?.id) return rec.id;
    } catch (_) {}
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
      clerk_id: f['ClerkID'] || f['Clerk ID'] || '',
      user_id: f['UserID'] || f['User ID'] || '',
      location: f['Location'] || f['City'] || '',
      interests: Array.isArray(f['Interests']) ? f['Interests'] : [],
    };
  } catch (_) {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const { userId: authedClerkId } = getAuth(req);

    if (req.method === 'GET') {
      const { clerkId = authedClerkId, status } = req.query || {};
      if (!clerkId) return res.status(401).json({ error: 'Not authenticated' });
      const me = await resolveUserRecordId({ clerkId });
      if (!me) return res.status(404).json({ error: 'Current user not found' });

      const parts = [];
      // Connections where I am requester or recipient
      parts.push(`FIND('${me}', ARRAYJOIN({Requester}))`);
      parts.push(`FIND('${me}', ARRAYJOIN({Recipient}))`);
      let filter = `OR(${parts.join(',')})`;
      if (status) filter = `AND(${filter}, {Status}='${status}')`;

      const rows = await base(CONNECTIONS_TABLE)
        .select({ filterByFormula: filter })
        .all();

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

      // Check existing edges (both directions)
      const existing = await base(CONNECTIONS_TABLE)
        .select({
          maxRecords: 1,
          filterByFormula: `OR(AND(FIND('${fromRid}', ARRAYJOIN({Requester})), FIND('${toRid}', ARRAYJOIN({Recipient}))), AND(FIND('${toRid}', ARRAYJOIN({Requester})), FIND('${fromRid}', ARRAYJOIN({Recipient}))))`,
        })
        .firstPage();
      if (existing && existing.length) {
        const f = existing[0].fields || {};
        return res.status(200).json({ id: existing[0].id, status: f['Status'] || 'Pending' });
      }

      const rec = await base(CONNECTIONS_TABLE).create({
        Requester: [fromRid],
        Recipient: [toRid],
        Status: 'Pending',
        'Created At': new Date().toISOString(),
      });
      return res.status(201).json({ id: rec.id, status: rec.fields['Status'] || 'Pending' });
    }

    if (req.method === 'PATCH') {
      const { id, action } = req.body || {};
      if (!id || !action) return res.status(400).json({ error: 'Missing id or action' });
      const update = {};
      if (action === 'accept') update['Status'] = 'Accepted';
      else if (action === 'decline') update['Status'] = 'Declined';
      else if (action === 'block') update['Status'] = 'Blocked';
      else return res.status(400).json({ error: 'Invalid action' });
      update['Updated At'] = new Date().toISOString();
      const rec = await base(CONNECTIONS_TABLE).update(id, update);
      return res.status(200).json({ id: rec.id, status: rec.fields['Status'] });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e) {
    console.error('Connections API error', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}

