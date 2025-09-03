// pages/index.js

export async function getServerSideProps(context) {
  const proto = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/events`).catch(() => null);
  const data = await res?.json();
  return { props: { events: data?.events ?? [] } };
}

export default function Home({ events }) {
  return (
    <div
      style={{
        background: '#f6f4fa',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hero Header */}
      <header style={{ textAlign: 'center', padding: '1rem' }}>
        <img
          src="/icons/longlogo.png"
          alt="Say Salams logo"
          style={{ height: '120px', margin: '0 auto 0.0rem auto' }}
        />
        <h1 style={{ color: '#6a4caf', fontSize: '2.5rem', marginBottom: '0rem' }}>
        
        </h1>
        <p style={{ color: '#7d6db3', fontSize: '1.0rem' }}>
          Connections | Events | Community
        </p>
      </header>

      {/* Why Say Salams Section */}
      <section
        style={{
          background: '#6a4caf',
          color: '#fff',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Why Say Salams?</h2>
        <p style={{ maxWidth: '600px', margin: '0 auto 0.5rem auto', lineHeight: '1.6' }}>
          Saying <strong>Assalamu alaykum</strong> is more than a greeting — it’s a prayer of peace.
        </p>
        <p style={{ maxWidth: '600px', margin: '0 auto 0.5rem auto', lineHeight: '1.6' }}>
          It builds connection, spreads peace & unites our community.
        </p>
        <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>Because peace begins with you. ✨</p>
      </section>

      {/* Events Section */}
      <section
        style={{ maxWidth: '1100px', margin: '0 auto 4rem auto', padding: '0 1rem', flex: 1 }}
      >
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '2.2rem',
            color: '#5a3c91',
          }}
        >
          Our Upcoming Events
        </h2>

        {events.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>
            No events yet — check back soon insha’Allah ✨
          </p>
        )}

        {/* ✅ Proper grid for events */}
        <div
          className="events-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}
        >
          {events.map(ev => (
            <article
              key={ev.id}
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #eee',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {ev.image_url && (
                <img
                  src={ev.image_url}
                  alt={ev.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1, padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#6a4caf' }}>{ev.title}</h3>
                <p style={{ marginBottom: '0.5rem', color: '#555' }}>
                  {ev.start_at
                    ? new Date(ev.start_at).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })
                    : 'TBA'}
                  {ev.suburb ? ` · ${ev.suburb}` : ''}
                  {ev.city ? `, ${ev.city}` : ''}
                </p>
                <div style={{ marginBottom: '0.5rem' }}>
                  {(ev.tags || []).slice(0, 3).map(t => (
                    <span
                      key={t}
                      style={{
                        background: '#ede8f7',
                        color: '#5a3c91',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        marginRight: '0.3rem',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p style={{ marginBottom: '0.8rem', color: '#666' }}>
                  👍 {ev.going_count ?? 0} going
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {ev.tickets_url && (
                    <a
                      href={ev.tickets_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#6a4caf',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                      }}
                    >
                      Tickets
                    </a>
                  )}
                  <a
                    href={`/event/${encodeURIComponent(ev.public_id)}`}
                    style={{
                      background: '#ede8f7',
                      color: '#5a3c91',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                    }}
                  >
                    Details
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Hosting an Event Section */}
      <section
        style={{
          background: '#f6f4fa',
          padding: '2rem 1rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#5a3c91' }}>
          Hosting an Event?
        </h2>
        <p style={{ marginBottom: '2rem', color: '#555' }}>
          Let people Say Salams — share your event with the Muslim community ✨
        </p>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <iframe
            className="airtable-embed"
            src="https://airtable.com/embed/appTagC9VpvWx3nGF/pagdaYe9zcHdWqgpR/form"
            frameBorder="0"
            width="100%"
            height="800"
            style={{
              background: 'transparent',
              border: '1px solid #ccc',
              borderRadius: '12px',
            }}
            title="Say Salams Event Form"
          ></iframe>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: '#6a4caf',
          color: '#fff',
          textAlign: 'center',
          padding: '2rem 1rem',
          marginTop: '3rem',
        }}
      >
        <img
          src="/icons/logo.png"
          alt="Say Salams logo"
          style={{ height: '40px', margin: '0 auto 1rem auto' }}
        />
        <p style={{ margin: '0.3rem 0' }}>📍 Brisbane, QLD, 4000</p>
        <p style={{ margin: '0.3rem 0' }}>
          📧{' '}
          <a
            href="mailto:contact@saysalams.com"
            style={{ color: '#fff', textDecoration: 'underline' }}
          >
            contact@saysalams.com
          </a>
        </p>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
          © {new Date().getFullYear()} Say Salams. All rights reserved.
        </p>
      </footer>
    </div>
  );
}