import Airtable from 'airtable';

const {
  AIRTABLE_TOKEN,
  AIRTABLE_BASE_ID,
  AIRTABLE_TABLE = 'Events',
  AIRTABLE_VIEW = 'Published',
} = process.env;

const base =
  AIRTABLE_TOKEN && AIRTABLE_BASE_ID
    ? new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID)
    : null;

export default async function handler(req, res) {
  try {
    if (!base) throw new Error('Airtable not configured');
    const records = await base(AIRTABLE_TABLE)
      .select({ view: AIRTABLE_VIEW })
      .all();

    const rows = records.map((r) => {
      const f = r.fields || {};
      const eventId = f['EventID'] || r.id;
      return {
        id: eventId,
        public_id: eventId,
        title: f['Event Name'] || 'Untitled',
        start_at: f['Event Date'] || null,
        venue: f['Location'] || null,
        suburb: f['Suburb'] || null,
        city: f['City'] || null,
        description: f['Event Description'] || null,
        summary: f['Summary'] || null,
        image_url:
          Array.isArray(f['Event Photo']) && f['Event Photo'][0]?.url
            ? `${f['Event Photo'][0].url}?w=800&h=400&fit=crop`
            : null,
        tickets_url: f['Event Link'] || null,
        cost: f['Cost'] || null,
        audience: f['Audience'] || null,
        tags: Array.isArray(f['Tags']) ? f['Tags'] : (typeof f['Tags'] === 'string' ? f['Tags'].split(',').map(s => s.trim()).filter(Boolean) : []),
        halal_notes: f['Halal Notes'] || f['Halal'] || null,
        going_count: f['Going Count'] ?? 0,
      };
    });

    rows.sort(
      (a, b) => new Date(a.start_at || 0) - new Date(b.start_at || 0)
    );

    res.status(200).json({ events: rows });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
