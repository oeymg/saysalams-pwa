import Airtable from 'airtable';

const base = process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_USERS_BASE_ID
  ? new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base(process.env.AIRTABLE_USERS_BASE_ID)
  : null;

export default async function handler(req, res) {
  if (!base) {
    return res.status(500).json({ error: 'Airtable not configured' });
  }

  try {
    if (req.method === 'GET') {
      const { clerkId, id } = req.query || {};
      const table = process.env.AIRTABLE_USERS_TABLE || 'Users';

      // Helper to safely fetch a field by trying multiple labels
      const pick = (fields, candidates, fallback = '') => {
        for (const key of candidates) {
          if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') return fields[key];
        }
        return fallback;
      };

      const normalizeInterests = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.map((v) => (typeof v === 'string' ? v : String(v))).filter(Boolean);
        if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
        return [];
      };

      // Helper to map a record to our shape
      const mapUser = (r) => {
        const f = r.fields || {};
        const name = pick(f, ['Full Name', 'Name', 'Full name']);
        const email = pick(f, ['Email', 'Email Address', 'E-mail']);
        const type = pick(f, ['Type', 'User Type']);
        const location = pick(f, ['Location', 'City', 'Suburb', 'Region']);
        const interests = normalizeInterests(pick(f, ['Interests', 'Interests ', 'Interests (Comma)', 'Interest']));
        const heard = pick(f, ['How Heard About', 'How did you hear about us?', 'How did you hear about Say Salams?', 'Heard About']);
        const created = pick(f, ['Created At', 'Created time', 'Created']);
        const clerk = pick(f, ['ClerkID', 'Clerk ID']);
        const id = f['UserID'] || f['User ID'] || r.id;
        return {
          id,
          record_id: r.id,
          name: name || '',
          email: email || '',
          type: type || '',
          location: location || '',
          interests,
          heard_about: heard || '',
          created_at: created || null,
          clerk_id: clerk || '',
        };
      };

      if (clerkId) {
        const attempts = [
          // Exact match (fast path)
          `OR({ClerkID} = '${clerkId}', {Clerk ID} = '${clerkId}')`,
          // Case-insensitive
          `OR(LOWER({ClerkID}) = LOWER('${clerkId}'), LOWER({Clerk ID}) = LOWER('${clerkId}'))`,
          // Contains (handles stray extra chars)
          `OR(FIND('${clerkId}', {ClerkID}) > 0, FIND('${clerkId}', {Clerk ID}) > 0)`,
        ];
        let recs = [];
        for (const f of attempts) {
          try {
            const page = await base(table)
              .select({ maxRecords: 1, filterByFormula: f })
              .firstPage();
            if (page && page.length) { recs = page; break; }
          } catch (_) { /* ignore missing field errors */ }
        }
        let user = recs && recs[0] ? mapUser(recs[0]) : null;

        // Fallback: scan all records for a field whose name normalizes to "clerkid"
        // Normalization removes spaces and non-alphanumerics, lowercased
        if (!user) {
          try {
            const all = await base(table).select().all();
            const norm = (s) => String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
            const target = norm(clerkId);
            for (const r of all) {
              const keys = Object.keys(r.fields || {});
              const clerkKey = keys.find((k) => norm(k) === 'clerkid');
              if (clerkKey) {
                const val = norm(r.fields[clerkKey]);
                if (val === target || (val && target && val.includes(target))) {
                  user = mapUser(r);
                  break;
                }
              }
            }
          } catch (_) { /* ignore */ }
        }

        return res.status(200).json({ user });
      }

      if (id) {
        const recs = await base(table)
          .select({
            maxRecords: 1,
            filterByFormula: `OR({UserID} = '${id}', RECORD_ID() = '${id}')`,
          })
          .firstPage();
        const user = recs && recs[0] ? mapUser(recs[0]) : null;
        return res.status(200).json({ user });
      }

      // Fetch all users
      const records = await base(table).select().all();
      const users = records.map(mapUser);
      return res.status(200).json({ users });
    }

    if (req.method === 'POST') {
      const { name, email, type, location, interests, heard_about, clerkId } = req.body;

      const userId = `USR_${Date.now()}`;

      const record = await base(process.env.AIRTABLE_USERS_TABLE || 'Users').create({
        'UserID': userId,
        'Full Name': name,
        'Email': email,
        'Type': type,
        'Location': location,
        'Interests': interests,
        'How Heard About': heard_about,
        'Created At': new Date().toISOString(),
        'ClerkID': clerkId,
      });

      return res.status(201).json({ id: record.fields['UserID'], clerk_id: record.fields['ClerkID'] || '' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
