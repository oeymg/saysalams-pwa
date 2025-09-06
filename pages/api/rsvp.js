import Airtable from 'airtable';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_USERS_BASE_ID = process.env.AIRTABLE_USERS_BASE_ID;
const AIRTABLE_RSVP_BASE_ID = process.env.AIRTABLE_RSVP_BASE_ID || AIRTABLE_USERS_BASE_ID;
const USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const RSVP_TABLE = process.env.AIRTABLE_RSVP_TABLE || 'RSVPs';
const RSVP_USERS_TABLE = process.env.AIRTABLE_RSVP_USERS_TABLE || USERS_TABLE; // Users table name inside the RSVP base
const RSVP_USER_FIELDS = (process.env.AIRTABLE_RSVP_USER_FIELDS || 'User,Users,Attendee,Attendees,Participant,Participants,Member,Members,Profile,Profiles,User Link,User Record').split(',').map(s => s.trim()).filter(Boolean);

if (!AIRTABLE_TOKEN || !AIRTABLE_USERS_BASE_ID) {
  throw new Error('Missing Airtable environment variables');
}

const usersBase = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_USERS_BASE_ID);
const rsvpBase = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_RSVP_BASE_ID);

// Resolve an Airtable User record ID, preferring the RSVP base so linked IDs match that base
async function resolveAirtableUserRecordId(userId) {
  // Try ClerkID match in RSVP base Users table
  if (String(userId).startsWith('user_')) {
    try {
      const page = await rsvpBase(RSVP_USERS_TABLE)
        .select({ maxRecords: 1, filterByFormula: `OR({ClerkID}='${userId}', {Clerk ID}='${userId}')` })
        .firstPage();
      if (page && page.length) return page[0].id;
    } catch (_) {}
  }
  // Try direct record lookup in RSVP base Users table
  try {
    const rec = await rsvpBase(RSVP_USERS_TABLE).find(String(userId));
    if (rec?.id) return rec.id;
  } catch (_) {}
  // Fallback: resolve in Users base
  if (String(userId).startsWith('user_')) {
    try {
      const page = await usersBase(USERS_TABLE)
        .select({ maxRecords: 1, filterByFormula: `OR({ClerkID}='${userId}', {Clerk ID}='${userId}')` })
        .firstPage();
      if (page && page.length) return page[0].id;
    } catch (_) {}
  }
  try {
    const rec = await usersBase(USERS_TABLE).find(String(userId));
    if (rec?.id) return rec.id;
  } catch (_) {}
  try {
    const page = await usersBase(USERS_TABLE)
      .select({ maxRecords: 1, filterByFormula: `OR({UserID}='${userId}', {User ID}='${userId}')` })
      .firstPage();
    if (page && page.length) return page[0].id;
  } catch (_) {}
  return null;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { userId, eventId, inspect } = req.query;

      // Debug utility: resolve a user id into Airtable record ids in both bases
      if (inspect === 'resolve' && userId) {
        let rsvpRid = null;
        let usersRid = null;
        // RSVP base resolution
        try {
          if (String(userId).startsWith('user_')) {
            const page = await rsvpBase(RSVP_USERS_TABLE)
              .select({ maxRecords: 1, filterByFormula: `OR({ClerkID}='${userId}', {Clerk ID}='${userId}')` })
              .firstPage();
            rsvpRid = page?.[0]?.id || null;
          }
          if (!rsvpRid) {
            try { const rec = await rsvpBase(RSVP_USERS_TABLE).find(String(userId)); rsvpRid = rec?.id || null; } catch (_) {}
          }
        } catch (_) {}
        // Users base resolution
        try {
          if (String(userId).startsWith('user_')) {
            const page = await usersBase(USERS_TABLE)
              .select({ maxRecords: 1, filterByFormula: `OR({ClerkID}='${userId}', {Clerk ID}='${userId}')` })
              .firstPage();
            usersRid = page?.[0]?.id || null;
          }
          if (!usersRid) {
            try { const rec = await usersBase(USERS_TABLE).find(String(userId)); usersRid = rec?.id || null; } catch (_) {}
          }
        } catch (_) {}
        return res.status(200).json({
          input: userId,
          rsvpBase: AIRTABLE_RSVP_BASE_ID,
          rsvpUsersTable: RSVP_USERS_TABLE,
          ridInRsvpBase: rsvpRid,
          usersBase: AIRTABLE_USERS_BASE_ID,
          usersTable: USERS_TABLE,
          ridInUsersBase: usersRid,
        });
      }

      // Debug utility: list detected field names and likely user fields
      if (inspect === 'fields') {
        const sample = await rsvpBase(RSVP_TABLE).select({ maxRecords: 20 }).firstPage();
        const fieldSet = new Set();
        const linkedGuesses = new Set();
        const textGuesses = new Set();
        for (const r of sample) {
          const f = r.fields || {};
          Object.keys(f).forEach((k) => fieldSet.add(k));
          Object.entries(f).forEach(([k, v]) => {
            if (Array.isArray(v) && v.length && typeof v[0] === 'string' && v[0].startsWith('rec')) {
              linkedGuesses.add(k);
            }
            if (typeof v === 'string' && /clerk|user/i.test(k)) {
              textGuesses.add(k);
            }
          });
        }
        return res.status(200).json({
          table: RSVP_TABLE,
          configuredLinkedCandidates: RSVP_USER_FIELDS,
          detectedFields: Array.from(fieldSet),
          probableLinkedUserFields: Array.from(linkedGuesses),
          probableTextUserFields: Array.from(textGuesses),
        });
      }
      // For linked records, compare by searching the recId within ARRAYJOIN across candidate fields
      const byLinked = userId ? `OR(${RSVP_USER_FIELDS.map(f => `FIND('${userId}', ARRAYJOIN({${f}}))`).join(', ')})` : '';
      // If caller passed a Clerk user id, also allow matching a text ClerkID column in RSVPs
      const byClerkText = userId && String(userId).startsWith('user_') ? `OR({ClerkID} = '${userId}', {Clerk ID} = '${userId}')` : '';
      const byUser = userId ? (byClerkText ? `OR(${byLinked}, ${byClerkText})` : byLinked) : '';
      const byEvent = eventId ? `{Event ID} = '${eventId}'` : '';
      let filterByFormula = '';
      if (byUser && byEvent) filterByFormula = `AND(${byUser}, ${byEvent})`;
      else if (byUser) filterByFormula = byUser;
      else if (byEvent) filterByFormula = byEvent;

      const records = [];
      await rsvpBase(RSVP_TABLE)
        .select({
          filterByFormula: filterByFormula || undefined,
        })
        .eachPage((fetched, fetchNextPage) => {
          records.push(...fetched.map(r => ({
            id: r.id,
            fields: r.fields,
          })));
          fetchNextPage();
        });
      return res.status(200).json({ rsvps: records });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to fetch RSVPs' });
    }
  }
  if (req.method === 'PATCH') {
    try {
      const { userId, eventId, status } = req.body || {};
      if (!userId || !eventId || !status) {
        return res.status(400).json({ error: 'Missing userId, eventId or status' });
      }
      // Resolve Airtable user record id from ClerkID/record id, preferring RSVP base
      const airtableUserId = await resolveAirtableUserRecordId(userId);
      if (!airtableUserId) return res.status(404).json({ error: 'User not found in Airtable' });
      // Find existing RSVP for this user + event across possible linked field names
      const orLinked = RSVP_USER_FIELDS
        .map((f) => `FIND('${airtableUserId}', ARRAYJOIN({${f}}))`)
        .join(', ');
      const found = await rsvpBase(RSVP_TABLE)
        .select({
          filterByFormula: `AND(OR(${orLinked}), {Event ID} = '${eventId}')`,
          maxRecords: 1,
        })
        .firstPage();

      if (found && found.length > 0) {
        const updated = await rsvpBase(RSVP_TABLE).update(found[0].id, {
          'Status': status,
          'Updated At': new Date().toISOString(),
        });
        return res.status(200).json({ id: updated.id, fields: updated.fields });
      }
      // If none found, create new (robust to different field names)
      const tryCreate = async () => {
        for (const field of RSVP_USER_FIELDS) {
          try {
            // Try with array of recordIds
            const rec = await rsvpBase(RSVP_TABLE).create({
              [field]: [airtableUserId],
              'Event ID': eventId,
              'Status': status,
              'Created At': new Date().toISOString(),
            });
            return rec;
          } catch (e1) {
            if (e1?.statusCode && e1.statusCode !== 422) throw e1;
            try {
              // Try with array of objects: [{ id: recId }]
              const rec2 = await rsvpBase(RSVP_TABLE).create({
                [field]: [{ id: airtableUserId }],
                'Event ID': eventId,
                'Status': status,
                'Created At': new Date().toISOString(),
              });
              return rec2;
            } catch (e2) {
              if (e2?.statusCode && e2.statusCode !== 422) throw e2;
            }
          }
        }
        // Fallback to text id field if present
        const u = await usersBase(USERS_TABLE).find(airtableUserId);
        const userNumericId = u?.fields?.['UserID'] || u?.fields?.['User ID'] || null;
        if (userNumericId) {
          const candidateText = ['UserID','User Id','User ID','Airtable UserID','Airtable User ID'];
          for (const field of candidateText) {
            try {
              const rec = await rsvpBase(RSVP_TABLE).create({
                [field]: userNumericId,
                'Event ID': eventId,
                'Status': status,
                'Created At': new Date().toISOString(),
              });
              return rec;
            } catch (e) {
              if (e?.statusCode !== 422) throw e;
            }
          }
        }
        // Fallback to storing ClerkID directly if RSVP table has such a field
        const candidateClerk = ['ClerkID','Clerk ID'];
        for (const field of candidateClerk) {
          try {
            const rec = await rsvpBase(RSVP_TABLE).create({
              [field]: userId,
              'Event ID': eventId,
              'Status': status,
              'Created At': new Date().toISOString(),
            });
            return rec;
          } catch (e) {
            if (e?.statusCode !== 422) throw e;
          }
        }
        throw new Error('No acceptable User field found on RSVP table');
      };
      const created = await tryCreate();
      return res.status(201).json({ id: created.id, fields: created.fields });
    } catch (err) {
      console.error('RSVP PATCH error', {
        message: err?.message,
        statusCode: err?.statusCode,
        usersBase: AIRTABLE_USERS_BASE_ID,
        rsvpBase: AIRTABLE_RSVP_BASE_ID,
        table: RSVP_TABLE,
      });
      return res.status(500).json({ error: err.message || 'Failed to update RSVP' });
    }
  }
  if (req.method === 'POST') {
    try {
      console.log("RSVP POST body:", req.body);
      const { userId, eventId, status } = req.body;
      if (!userId || !eventId) {
        return res.status(400).json({ error: 'Missing userId or eventId' });
      }
      // Resolve in RSVP base first so linked ids match that base
      const rid = await resolveAirtableUserRecordId(userId);
      if (!rid) return res.status(404).json({ error: 'User not found in Airtable' });
      const userRecord = { id: rid, fields: {} };
      const rsvpId = `RSVP_${Date.now()}`;
      // Create robustly across possible schema differences
      const tryCreate = async () => {
        for (const field of RSVP_USER_FIELDS) {
          try {
            // Try with array of recordIds
            const rec = await rsvpBase(RSVP_TABLE).create({
              [field]: [userRecord.id],
              'Event ID': eventId,
              'Status': status || 'Going',
              'Created At': new Date().toISOString(),
              'RSVP_ID': rsvpId,
            });
            return rec;
          } catch (e1) {
            if (e1?.statusCode && e1.statusCode !== 422) throw e1;
            try {
              // Try with array of objects
              const rec2 = await rsvpBase(RSVP_TABLE).create({
                [field]: [{ id: userRecord.id }],
                'Event ID': eventId,
                'Status': status || 'Going',
                'Created At': new Date().toISOString(),
                'RSVP_ID': rsvpId,
              });
              return rec2;
            } catch (e2) {
              if (e2?.statusCode && e2.statusCode !== 422) throw e2;
            }
          }
        }
        const userNumericId = userRecord.fields?.['UserID'] || userRecord.fields?.['User ID'] || null;
        if (userNumericId) {
          const candidateText = ['UserID','User Id','User ID','Airtable UserID','Airtable User ID'];
          for (const field of candidateText) {
            try {
              const rec = await rsvpBase(RSVP_TABLE).create({
                [field]: userNumericId,
                'Event ID': eventId,
                'Status': status || 'Going',
                'Created At': new Date().toISOString(),
                'RSVP_ID': rsvpId,
              });
              return rec;
            } catch (e) {
              if (e?.statusCode !== 422) throw e;
            }
          }
        }
        const candidateClerk = ['ClerkID','Clerk ID'];
        for (const field of candidateClerk) {
          try {
            const rec = await rsvpBase(RSVP_TABLE).create({
              [field]: userId,
              'Event ID': eventId,
              'Status': status || 'Going',
              'Created At': new Date().toISOString(),
              'RSVP_ID': rsvpId,
            });
            return rec;
          } catch (e) {
            if (e?.statusCode !== 422) throw e;
          }
        }
        throw new Error('No acceptable User field found on RSVP table');
      };
      const record = await tryCreate();
      return res.status(201).json({ id: record.id, fields: record.fields });
    } catch (err) {
      console.error("RSVP POST error:", {
        message: err?.message,
        statusCode: err?.statusCode,
        usersBase: AIRTABLE_USERS_BASE_ID,
        usersTable: USERS_TABLE,
        rsvpBase: AIRTABLE_RSVP_BASE_ID,
        rsvpTable: RSVP_TABLE,
      });
      return res.status(500).json({ error: err.message || 'Failed to create RSVP' });
    }
  }
  res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
