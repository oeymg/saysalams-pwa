import Airtable from 'airtable';

const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE = 'Events', AIRTABLE_VIEW = 'Published' } = process.env;

const base = AIRTABLE_TOKEN && AIRTABLE_BASE_ID
  ? new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID)
  : null;

export default async function handler(req, res) {
  try {
    if (!base) throw new Error('Airtable not configured');
    const records = await base(AIRTABLE_TABLE).select({ view: AIRTABLE_VIEW }).all();

    const rows = records.map(r => {
      const f = r.fields || {};
      return {
        id: r.id,
        public_id: f['Event ID'] || f['public_id'] || r.id,
        title: f['Title'] || f['Name'] || 'Untitled',
        start_at: f['Start At'] || f['Start Date'] || null,
        end_at: f['End At'] || f['End Date'] || null,
        city: f['City'] || null,
        suburb: f['Suburb'] || null,
        venue: f['Venue'] || f['Venue Name'] || null,
        image_url: Array.isArray(f['Image']) && f['Image'][0]?.url ? f['Image'][0].url : (f['image_url'] || null),
        tickets_url: f['Tickets URL'] || f['tickets_url'] || null,
        halal_notes: f['Halal Notes'] || null,
        tags: f['Tags'] || [],
        going_count: f['Going Count'] ?? 0, // optional rollup in Airtable
      };
    });

    rows.sort((a,b) => (new Date(a.start_at || 0) - new Date(b.start_at || 0)));

    res.status(200).json({ events: rows });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
}