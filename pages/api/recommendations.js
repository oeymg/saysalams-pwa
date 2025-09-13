import Airtable from 'airtable';
import { getAuth } from '@clerk/nextjs/server';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const RSVP_TABLE = process.env.AIRTABLE_RSVP_TABLE || 'RSVPs';
const CONNECTIONS_TABLE = process.env.AIRTABLE_CONNECTIONS_TABLE || 'Connections';

const base = (AIRTABLE_TOKEN && AIRTABLE_BASE_ID)
  ? new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID)
  : null;

const normalizeText = (s) => String(s || '').trim();
const normalizeCity = (s) => normalizeText(s).toLowerCase();
const toSet = (arr) => new Set((Array.isArray(arr) ? arr : []).map((x) => String(x).trim().toLowerCase()).filter(Boolean));

function jaccard(aSet, bSet) {
  if (!aSet || !bSet || aSet.size === 0 || bSet.size === 0) return 0;
  let inter = 0;
  for (const v of aSet) if (bSet.has(v)) inter++;
  const union = aSet.size + bSet.size - inter;
  if (union <= 0) return 0;
  return inter / union;
}

function mapUser(r) {
  const f = r.fields || {};
  const name = f['Full Name'] || f['Name'] || '';
  const email = f['Email'] || '';
  const type = f['Type'] || f['User Type'] || '';
  const location = f['Location'] || f['City'] || '';
  const postcode = f['Postcode'] || f['Postal Code'] || f['ZIP'] || f['Zip'] || f['ZIP Code'] || '';
  const interests = Array.isArray(f['Interests'])
    ? f['Interests']
    : (typeof f['Interests'] === 'string' ? f['Interests'].split(',').map(s => s.trim()).filter(Boolean) : []);
  const clerk = f['ClerkID'] || f['Clerk ID'] || '';
  const idText = f['UserID'] || f['User ID'] || r.id;
  const gender = String(f['Gender'] || f['gender'] || f['Sex'] || '').trim().toLowerCase();
  return {
    record_id: r.id,
    id_text: idText,
    name,
    email,
    type,
    location,
    postcode,
    interests,
    clerk_id: clerk,
    gender,
  };
}

export default async function handler(req, res) {
  try {
    if (!base) return res.status(200).json({ recommendations: [] });
    const { userId: authedClerkId } = getAuth(req);
    if (!authedClerkId) return res.status(401).json({ error: 'Not authenticated' });

    const limit = Math.max(1, Math.min(50, Number(req.query?.limit || 12)));

    // Load all users (small bases). For larger bases, narrow to same city first.
    const users = await base(USERS_TABLE).select().all();
    const mapped = users.map(mapUser);
    const me = mapped.find((u) => u.clerk_id === authedClerkId);
    if (!me) return res.status(404).json({ error: 'Profile not found' });

    // Build RSVP sets per user text id
    const rsvps = await base(RSVP_TABLE).select().all();
    const userToEvents = new Map(); // id_text -> Set(eventId)
    for (const r of rsvps) {
      const f = r.fields || {};
      const uid = f['UserID'] || f['User ID'] || null;
      const eid = f['Event ID'] || f['EventID'] || f['Event Id'] || null;
      const status = (f['Status'] || '').toLowerCase();
      if (!uid || !eid) continue;
      if (!userToEvents.has(uid)) userToEvents.set(uid, new Set());
      // Optionally weigh Going higher; for now, include all statuses equally
      userToEvents.get(uid).add(String(eid));
    }

    // Exclude already connected/pending
    const myRecordId = me.record_id;
    const cons = await base(CONNECTIONS_TABLE).select().all();
    const connectedIds = new Set();
    for (const r of cons) {
      const f = r.fields || {};
      const reqArr = Array.isArray(f['Requester']) ? f['Requester'] : [];
      const recArr = Array.isArray(f['Recipient']) ? f['Recipient'] : [];
      if (!(reqArr.includes(myRecordId) || recArr.includes(myRecordId))) continue;
      const requester = reqArr[0] || null;
      const recipient = recArr[0] || null;
      const other = requester === myRecordId ? recipient : requester;
      if (other) connectedIds.add(other);
    }

    const myInterests = toSet(me.interests);
    const myCity = normalizeCity(me.location);
    const myEvents = userToEvents.get(me.id_text) || new Set();

    const scored = [];
    for (const u of mapped) {
      if (!u || u.record_id === myRecordId) continue;
      if (connectedIds.has(u.record_id)) continue;
      // Gender segregation: only suggest same-gender users if known
      const myGender = String(me.gender || '').toLowerCase();
      const uGender = String(u.gender || '').toLowerCase();
      if ((myGender === 'female' || myGender === 'male') && myGender !== uGender) continue;

      const inter = jaccard(myInterests, toSet(u.interests));
      const locSame = !!(myCity && normalizeCity(u.location) && (normalizeCity(u.location) === myCity || normalizeCity(u.location).includes(myCity) || myCity.includes(normalizeCity(u.location))));
      const evs = jaccard(myEvents, userToEvents.get(u.id_text) || new Set());

      const score = 0.5 * inter + 0.3 * evs + 0.2 * (locSame ? 1 : 0);
      if (score <= 0) continue; // skip weak suggestions

      const reasons = [];
      if (inter > 0) reasons.push(`${Math.round(inter * 100)}% shared interests`);
      if (evs > 0) reasons.push(`${Math.round(evs * 100)}% event overlap`);
      if (locSame) reasons.push('near you');

      scored.push({ user: u, score, reasons });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);
    return res.status(200).json({ recommendations: top });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Failed to build recommendations' });
  }
}
