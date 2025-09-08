import Airtable from 'airtable';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID; // unified base for Events/Users/RSVPs
const USERS_TABLE = process.env.AIRTABLE_USERS_TABLE || 'Users';
const RSVP_TABLE = process.env.AIRTABLE_RSVP_TABLE || 'RSVPs';
const EVENTS_TABLE = process.env.AIRTABLE_TABLE || 'Events';
const OCCURRENCES_TABLE = process.env.AIRTABLE_OCCURRENCES_TABLE || 'Occurrences';

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
  throw new Error('Missing Airtable environment variables');
}

const base = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

// Try a select with a formula; return first record or null.
async function selectOneSafe(table, formula) {
  try {
    const p = await base(table).select({ maxRecords: 1, filterByFormula: formula }).firstPage();
    return p && p[0] ? p[0] : null;
  } catch (e) {
    if (e?.statusCode === 422) return null; // unknown field names
    throw e;
  }
}

// Try multiple formulas until one works (no 422) and optionally matches.
async function findOneByAnyFormula(table, formulas) {
  for (const f of formulas) {
    const rec = await selectOneSafe(table, f);
    if (rec) return rec;
  }
  return null;
}

// Create RSVP with tolerant field names for Event and Occurrence IDs.
async function createRsvpTolerant(table, data) {
  const eventFieldCandidates = ['EventID', 'Event ID', 'Event Id'];
  const occFieldCandidates = ['Occurrence ID', 'OccurrenceID', 'OccurenceID'];

  // Build candidate payloads trying different field name variants
  const payloads = [];
  for (const efn of eventFieldCandidates) {
    const baseFields = { [efn]: data.eventId, 'UserID': data.userId, 'Status': data.status, 'Created At': data.createdAt };
    if (data.occurrenceId) {
      for (const ofn of occFieldCandidates) {
        payloads.push({ ...baseFields, [ofn]: data.occurrenceId });
      }
    } else {
      payloads.push(baseFields);
    }
  }

  let lastErr = null;
  for (const fields of payloads) {
    try {
      const rec = await base(table).create(fields);
      return rec;
    } catch (e) {
      if (e?.statusCode === 422) {
        lastErr = e; // try next variant
        continue;
      }
      throw e;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error('Failed to create RSVP with any known field variants');
}

// Resolve an Airtable User record ID, preferring the RSVP base so linked IDs match that base
async function resolveAirtableUserRecordId(userId) {
  if (String(userId).startsWith('rec')) {
    return userId;
  }
  // Helper: try matching by a single field name (skips 422 when field doesn't exist)
  const tryField = async (field, value) => {
    try {
      const page = await base(USERS_TABLE)
        .select({ maxRecords: 1, filterByFormula: `{${field}}='${value}'` })
        .firstPage();
      return page && page.length ? page[0].id : null;
    } catch (e) {
      if (e?.statusCode === 422) return null; // unknown field
      throw e;
    }
  };

  // Try ClerkID variants if a Clerk user id
  if (String(userId).startsWith('user_')) {
    for (const f of ['ClerkID', 'Clerk ID']) {
      const rid = await tryField(f, userId);
      if (rid) return rid;
    }
  }

  // Try direct record id
  try {
    const rec = await base(USERS_TABLE).find(String(userId));
    if (rec?.id) return rec.id;
  } catch (_) {}

  // Try UserID text variants
  for (const f of ['UserID', 'User ID']) {
    const rid = await tryField(f, userId);
    if (rid) return rid;
  }

  return null;
}

async function getUserNumericIdFromClerkId(clerkId) {
  if (!clerkId) return null;
  try {
    const page = await base(USERS_TABLE)
      .select({
        maxRecords: 1,
        filterByFormula: `OR({ClerkID}='${clerkId}', {Clerk ID}='${clerkId}')`,
      })
      .firstPage();
    const rec = page && page[0] ? page[0] : null;
    return rec?.fields?.['UserID'] || rec?.fields?.['User ID'] || null;
  } catch {
    return null;
  }
}

// Resolve an occurrence by public id (OccurrenceID) or Airtable rec id, and infer the series event public id
async function resolveOccurrenceAndEvent(occurrenceId) {
  if (!occurrenceId) return { occRecordId: null, eventPublicId: null };

  // try by record id
  const tryFindByRecordId = async (rid) => {
    try {
      const rec = await base(OCCURRENCES_TABLE).find(String(rid));
      return rec || null;
    } catch (_) {
      return null;
    }
  };

  // try by OccurrenceID text
  const tryFindByOccId = async (oid) => {
    try {
      const page = await base(OCCURRENCES_TABLE)
        .select({ maxRecords: 1, filterByFormula: `OR({OccurrenceID}='${oid}', {OccurenceID}='${oid}', {Occurrence ID}='${oid}')` })
        .firstPage();
      return page?.[0] || null;
    } catch (e) {
      if (e?.statusCode === 422) return null;
      throw e;
    }
  };

  let occRec = null;
  if (String(occurrenceId).startsWith('rec')) {
    occRec = await tryFindByRecordId(occurrenceId);
  }
  if (!occRec) {
    occRec = await tryFindByOccId(occurrenceId);
  }
  if (!occRec) return { occRecordId: null, eventPublicId: null };

  const f = occRec.fields || {};
  // Prefer explicit EventID on occurrence
  let eventPublicId = f['EventID'] || f['Event ID'] || null;
  // Else, follow Series/Event link to Events table to read EventID
  if (!eventPublicId) {
    const seriesLink = Array.isArray(f['Series']) ? f['Series'][0] : (Array.isArray(f['Event']) ? f['Event'][0] : null);
    if (seriesLink) {
      try {
        const evRec = await base(EVENTS_TABLE).find(seriesLink);
        const ef = evRec?.fields || {};
        eventPublicId = ef['EventID'] || ef['Event ID'] || ef['Event Id'] || null;
      } catch (_) {
        // ignore
      }
    }
  }

  return { occRecordId: occRec.id, eventPublicId };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { userId, eventId, occurrenceId, inspect } = req.query;

      // Debug utility: resolve a user id into Airtable record ids in both bases
      if (inspect === 'resolve' && userId) {
        let usersRid = null;
        const tryField = async (field, value) => {
          try {
            const page = await base(USERS_TABLE)
              .select({ maxRecords: 1, filterByFormula: `{${field}}='${value}'` })
              .firstPage();
            return page && page.length ? page[0].id : null;
          } catch (e) {
            if (e?.statusCode === 422) return null;
            throw e;
          }
        };
        if (String(userId).startsWith('user_')) {
          for (const f of ['ClerkID', 'Clerk ID']) {
            usersRid = await tryField(f, userId);
            if (usersRid) break;
          }
        }
        if (!usersRid) {
          try { const rec = await base(USERS_TABLE).find(String(userId)); usersRid = rec?.id || null; } catch (_) {}
        }
        if (!usersRid) {
          for (const f of ['UserID', 'User ID']) {
            usersRid = await tryField(f, userId);
            if (usersRid) break;
          }
        }
        return res.status(200).json({
          input: userId,
          baseId: AIRTABLE_BASE_ID,
          usersTable: USERS_TABLE,
          resolvedUserRecordId: usersRid,
        });
      }

      // Debug utility: list detected field names and likely user fields
      if (inspect === 'fields') {
        const sample = await base(RSVP_TABLE).select({ maxRecords: 20 }).firstPage();
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
          detectedFields: Array.from(fieldSet),
          probableLinkedUserFields: Array.from(linkedGuesses),
          probableTextUserFields: Array.from(textGuesses),
        });
      }

      // Build user filter supporting: UserID text with Clerk fallback
      let userFilter = '';
      if (userId) {
        let userNumeric = null;
        if (String(userId).startsWith('user_')) {
          userNumeric = await getUserNumericIdFromClerkId(userId);
          if (!userNumeric) userNumeric = userId;
        } else {
          userNumeric = userId;
        }
        userFilter = `{UserID}='${userNumeric}'`;
      }

      // Tolerant filtering: try possible field-name variants to avoid 422
      const candidates = [];
      if (occurrenceId) {
        const occOnly = [
          `{Occurrence ID}='${occurrenceId}'`,
          `{OccurrenceID}='${occurrenceId}'`,
          `{OccurenceID}='${occurrenceId}'`,
        ];
        if (userFilter) {
          occOnly.forEach(f => candidates.push(`AND(${userFilter}, ${f})`));
        } else {
          candidates.push(...occOnly);
        }
      } else if (eventId) {
        const evtOnly = [
          `{EventID}='${eventId}'`,
          `{Event ID}='${eventId}'`,
          `{Event Id}='${eventId}'`,
        ];
        if (userFilter) {
          evtOnly.forEach(f => candidates.push(`AND(${userFilter}, ${f})`));
        } else {
          candidates.push(...evtOnly);
        }
      } else if (userFilter) {
        candidates.push(userFilter);
      }

      let records = [];
      const trySelectAll = async (formula) => {
        try {
          const out = [];
          await base(RSVP_TABLE).select({ filterByFormula: formula }).eachPage((fetched, next) => {
            out.push(...fetched.map(r => ({ id: r.id, fields: r.fields })));
            next();
          });
          return out;
        } catch (e) {
          if (e?.statusCode === 422) return null; // try next variant
          throw e;
        }
      };

      if (candidates.length) {
        for (const f of candidates) {
          const out = await trySelectAll(f);
          if (out) { records = out; break; }
        }
      } else {
        // No filters: return all (bounded by Airtable default pagination)
        await base(RSVP_TABLE).select().eachPage((fetched, next) => {
          records.push(...fetched.map(r => ({ id: r.id, fields: r.fields })));
          next();
        });
      }

      return res.status(200).json({ rsvps: records });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to fetch RSVPs' });
    }
  }
  if (req.method === 'PATCH') {
    try {
      const { userId, eventId, occurrenceId, status } = req.body || {};
      if (!userId || !status || (!eventId && !occurrenceId)) {
        return res.status(400).json({ error: 'Missing userId, status and one of eventId or occurrenceId' });
      }

      // Resolve ClerkID → UserID (text). If none, fallback to using ClerkID string (consistent with GET).
      let userNumeric = null;
      if (String(userId).startsWith('user_')) {
        userNumeric = await getUserNumericIdFromClerkId(userId);
        if (!userNumeric) {
          // Fallback: store ClerkID in UserID text field so RSVP still works
          userNumeric = userId;
        }
      } else {
        userNumeric = userId;
      }

      // Resolve occurrence if provided, and ensure/derive eventId
      let derivedEventId = eventId || null;
      let occRecordId = null;
      if (occurrenceId) {
        const occ = await resolveOccurrenceAndEvent(occurrenceId);
        occRecordId = occ.occRecordId;
        if (!derivedEventId) derivedEventId = occ.eventPublicId;
        // Fallback: parse event id from occurrence key like EVENTID-YYYY-MM-DDTHH:MM
        if (!derivedEventId) {
          const m = String(occurrenceId).match(/^(.+?)-\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
          if (m && m[1]) {
            derivedEventId = m[1];
          }
        }
        if (!derivedEventId) return res.status(400).json({ error: 'Could not infer event id from occurrence' });
      }

      // Validate event exists by EventID text (single known field to avoid 422)
      const evtPage = await base(EVENTS_TABLE)
        .select({ maxRecords: 1, filterByFormula: `{EventID}='${derivedEventId}'` })
        .firstPage();
      const airtableEventId = evtPage?.[0]?.id || null;
      if (!airtableEventId) return res.status(404).json({ error: 'Event not found in Airtable' });

      // Find existing RSVP by UserID text and Event ID text
      let found = null;
      const tryFilter = async (formula) => {
        try {
          const p = await base(RSVP_TABLE).select({ maxRecords: 1, filterByFormula: formula }).firstPage();
          return p && p[0] ? p[0] : null;
        } catch (e) {
          if (e?.statusCode === 422) return null;
          throw e;
        }
      };

      const userFilter = `{UserID}='${userNumeric}'`;
      if (occurrenceId) {
        const occCandidates = [
          `AND(${userFilter}, {Occurrence ID}='${occurrenceId}')`,
          `AND(${userFilter}, {OccurrenceID}='${occurrenceId}')`,
          `AND(${userFilter}, {OccurenceID}='${occurrenceId}')`,
        ];
        found = await findOneByAnyFormula(RSVP_TABLE, occCandidates);
      } else {
        const evtCandidates = [
          `AND(${userFilter}, {EventID}='${derivedEventId}')`,
          `AND(${userFilter}, {Event ID}='${derivedEventId}')`,
          `AND(${userFilter}, {Event Id}='${derivedEventId}')`,
        ];
        found = await findOneByAnyFormula(RSVP_TABLE, evtCandidates);
      }

      if (found) {
        const updated = await base(RSVP_TABLE).update(found.id, {
          'Status': status,
          'Updated At': new Date().toISOString(),
        });
        return res.status(200).json({ id: updated.id, fields: updated.fields });
      }

      // Create new RSVP record with tolerant field names
      const created = await createRsvpTolerant(RSVP_TABLE, {
        eventId: derivedEventId,
        userId: userNumeric,
        status,
        occurrenceId: occurrenceId || null,
        createdAt: new Date().toISOString(),
      });
      return res.status(201).json({ id: created.id, fields: created.fields });
    } catch (err) {
      console.error('RSVP PATCH error', {
        message: err?.message,
        statusCode: err?.statusCode,
        baseId: AIRTABLE_BASE_ID,
        table: RSVP_TABLE,
      });
      return res.status(500).json({ error: err.message || 'Failed to update RSVP' });
    }
  }
  if (req.method === 'POST') {
    try {
      console.log("RSVP POST body:", req.body);
      const { userId, eventId, occurrenceId, status } = req.body;
      if (!userId || (!eventId && !occurrenceId)) {
        return res.status(400).json({ error: 'Missing userId and one of eventId or occurrenceId' });
      }

      // Resolve ClerkID → UserID (text). If none, fallback to ClerkID string (consistent with GET route behavior).
      let userNumeric = null;
      if (String(userId).startsWith('user_')) {
        userNumeric = await getUserNumericIdFromClerkId(userId);
        if (!userNumeric) {
          userNumeric = userId;
        }
      } else {
        userNumeric = userId;
      }

      // Resolve occurrence if provided and derive event id when missing
      let derivedEventId = eventId || null;
      let occRecordId = null;
      if (occurrenceId) {
        const occ = await resolveOccurrenceAndEvent(occurrenceId);
        occRecordId = occ.occRecordId;
        if (!derivedEventId) derivedEventId = occ.eventPublicId;
        // Fallback: parse event id from occurrence key like EVENTID-YYYY-MM-DDTHH:MM
        if (!derivedEventId) {
          const m = String(occurrenceId).match(/^(.+?)-\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
          if (m && m[1]) {
            derivedEventId = m[1];
          }
        }
        if (!derivedEventId) return res.status(400).json({ error: 'Could not infer event id from occurrence' });
      }

      const evtPage = await base(EVENTS_TABLE)
        .select({ maxRecords: 1, filterByFormula: `{EventID}='${derivedEventId}'` })
        .firstPage();
      const eid = evtPage?.[0]?.id || null;
      if (!eid) return res.status(404).json({ error: 'Event not found in Airtable' });

      // Upsert: check existing for (user,event) with UserID text and EventID text
      let existing = null;
      const tryFilter = async (formula) => {
        try {
          const p = await base(RSVP_TABLE).select({ maxRecords: 1, filterByFormula: formula }).firstPage();
          return p && p[0] ? p[0] : null;
        } catch (e) {
          if (e?.statusCode === 422) return null;
          throw e;
        }
      };
      const userFilter = `{UserID}='${userNumeric}'`;
      if (occurrenceId) {
        const occCandidates = [
          `AND(${userFilter}, {Occurrence ID}='${occurrenceId}')`,
          `AND(${userFilter}, {OccurrenceID}='${occurrenceId}')`,
          `AND(${userFilter}, {OccurenceID}='${occurrenceId}')`,
        ];
        existing = await findOneByAnyFormula(RSVP_TABLE, occCandidates);
      } else {
        const evtCandidates = [
          `AND(${userFilter}, {EventID}='${derivedEventId}')`,
          `AND(${userFilter}, {Event ID}='${derivedEventId}')`,
          `AND(${userFilter}, {Event Id}='${derivedEventId}')`,
        ];
        existing = await findOneByAnyFormula(RSVP_TABLE, evtCandidates);
      }

      if (existing) {
        const updated = await base(RSVP_TABLE).update(existing.id, {
          'Status': status || 'Going',
          'Updated At': new Date().toISOString(),
        });
        return res.status(200).json({ id: updated.id, fields: updated.fields });
      }

      console.log('RSVP POST resolve:', { clerkId: userId, resolvedUserID: userNumeric, eventId: derivedEventId, occurrenceId });
      const record = await createRsvpTolerant(RSVP_TABLE, {
        eventId: derivedEventId,
        userId: userNumeric,
        status: status || 'Going',
        occurrenceId: occurrenceId || null,
        createdAt: new Date().toISOString(),
      });
      return res.status(201).json({ id: record.id, fields: record.fields });
    } catch (err) {
      console.error("RSVP POST error:", {
        message: err?.message,
        statusCode: err?.statusCode,
        baseId: AIRTABLE_BASE_ID,
        usersTable: USERS_TABLE,
        rsvpTable: RSVP_TABLE,
      });
      return res.status(500).json({ error: err.message || 'Failed to create RSVP' });
    }
  }
  res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
