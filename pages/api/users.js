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
      // Fetch all users
      const records = await base(process.env.AIRTABLE_USERS_TABLE || 'Users').select().all();
      const users = records.map(r => ({
        id: r.id,
        name: r.fields['Full Name'] || '',
        email: r.fields['Email'] || '',
        type: r.fields['Type'] || '',
        location: r.fields['Location'] || '',
        interests: r.fields['Interests'] || [],
        heard_about: r.fields['How Heard About'] || '',
        created_at: r.fields['Created At'] || null,
      }));
      return res.status(200).json({ users });
    }

    if (req.method === 'POST') {
      const { name, email, type, location, interests, heard_about } = req.body;

      const record = await base(process.env.AIRTABLE_USERS_TABLE || 'Users').create({
        'Full Name': name,
        'Email': email,
        'Type': type,
        'Location': location,
        'Interests': interests,
        'How Heard About': heard_about,
        'Created At': new Date().toISOString(),
      });

      return res.status(201).json({ id: record.id });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}