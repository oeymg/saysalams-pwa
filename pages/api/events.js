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
