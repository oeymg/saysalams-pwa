// pages/host.js

export default function Host() {
  return (
    <div style={{ background: '#f6f4fa', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ color: '#6e5084', fontSize: '2.5rem', marginBottom: '1.5rem' }}>
          Host an Event with Say Salams
        </h1>

        <p style={{ marginBottom: '2rem', color: '#444', lineHeight: '1.6' }}>
          You can set up an event with Say Salams anytime, anywhere. Whether you’re an
          individual, an organisation, or a business, we welcome you to bring your ideas
          and connect with the Muslim community through meaningful events.
        </p>

        <h2 style={{ color: '#5a3c91', marginBottom: '1rem' }}>Who can be a host?</h2>
        <ul style={{ marginBottom: '2rem', lineHeight: '1.6', color: '#333' }}>
          <li>
            <strong>Individuals:</strong> If you'd like to host a games night, an educational
            class (like cooking, engraving, arts &amp; crafts), or anything fun and engaging.
          </li>
          <li>
            <strong>Organisations:</strong> Mosques, youth groups, and educational institutes
            can host larger gatherings, workshops, and community events.
          </li>
          <li>
            <strong>Businesses:</strong> Use your premises to host events like exclusive
            discounts, free trials, networking nights, or launch parties.
          </li>
        </ul>

        <h2 style={{ color: '#5a3c91', marginBottom: '1rem' }}>How it works</h2>
        <ol style={{ lineHeight: '1.6', color: '#333' }}>
          <li>Simply fill out our hosting form, which provides us with all the relevant information.</li>
          <li>Receive an approval (usually by email).</li>
          <li>Your event gets advertised to the Say Salams network!</li>
        </ol>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a
            href="https://airtable.com/embed/appTagC9VpvWx3nGF/pagNTMHiWpoKO2GLo/form"
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'linear-gradient(90deg, #6e5084, #6e5065)',
              color: '#fff',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Become a Host
          </a>
        </div>
      </div>
    </div>
  );
}