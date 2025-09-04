// pages/index.js

import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/layout';

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
    <Layout>
      {/* Why Say Salams Section */}
      <section
        style={{
          background: '#6e5084',
          color: '#fff',
          padding: '0.1rem 0.1rem',
          textAlign: 'center',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Why Say Salams?</h2>
        <p style={{ maxWidth: '600px', margin: '0 auto 0.5rem auto', lineHeight: '1.6' }}>
          Saying <strong>Assalamu alaykum</strong> is more than a greeting — it&apos;s a prayer of peace.
        </p>
        <p style={{ maxWidth: '600px', margin: '0 auto 0.5rem auto', lineHeight: '1.6' }}>
          It builds connection, spreads peace &amp; unites our community.
        </p>
        <p style={{ maxWidth: '600px', margin: '0 auto 0.5rem auto', lineHeight: '1.6' }}>
          <strong>Say Salams.</strong>
        </p>
        <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>Because peace begins with you. ✨</p>
      </section>

      {/* Events Section */}
      <section
        style={{ maxWidth: '1100px', margin: '0 auto 4rem ', padding: '0rem 0rem auto', flex: 1 }}
      >
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '2.2rem',
            color: '#6e5084',
          }}
        >
          Our Upcoming Events
        </h2>

        {events.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>
            No events yet — check back soon insha&apos;Allah ✨
          </p>
        )}

        <div
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
                <Image
                  src={ev.image_url}
                  alt={ev.title}
                  width={400}
                  height={180}
                  style={{ objectFit: 'cover', borderRadius: '12px' }}
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
                  <Link
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
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* What You Can Expect with Say Salams Section */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2rem',
          padding: '2rem',
          background: '#6e5084',
          borderRadius: '12px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          color: '#fff',
          marginBottom: '3rem',
        }}
      >
        <div
          style={{
            flex: '1',
            minWidth: '300px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '3.2rem',
              fontWeight: '700',
              margin: 0,
              letterSpacing: '1px',
            }}
          >
            Why <strong>Say Salams</strong> Matters
          </h2>
        </div>
        <div
          style={{
            flex: '1',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontSize: '1.2rem',
            lineHeight: '1.8',
            color: '#fff',
          }}
        >
          <p style={{ marginBottom: '1rem' }}>
            🌟 <strong>Connect with friends</strong> — build your circle, strengthen bonds, and share in gatherings rooted in faith.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            🎉 <strong>Belong to something bigger</strong> — see who&apos;s going, join in, and never feel like you&apos;re attending alone.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            📍 <strong>Discover what&apos;s near you</strong> — find Muslim-friendly events, classes, and opportunities to connect in your local area.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            🕌 <strong>Strengthen our ummah</strong> — every event is more than a meetup; it&apos;s a step toward unity, peace, and spreading barakah.
          </p>
        </div>
      </section>

      {/* How to Become a Host Section */}
      <section
        style={{
          background: '#f6f4fa',
          color: '#5a3c91',
          padding: '2rem 1rem',
          textAlign: 'left',
          marginBottom: '2rem',
          maxWidth: '900px',
          marginLeft: 'auto',
          marginRight: 'auto',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          border: '2px solid #f6f4fa',
        }}
      >
        <h2 style={{ fontSize: '2.8rem', marginBottom: '2rem', fontWeight: '800', color: '#6e5084', textAlign: 'center' }}>
          Want to Host an Event with Say Salams?
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Here&apos;s who can:</h3>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Individuals</strong> — Host game nights, study circles, or creative workshops (arts &amp; crafts, cooking, calligraphy).</li>
            <li><strong>Organisations</strong> — Mosques, youth groups, and community associations running events that uplift and connect.</li>
            <li><strong>Businesses</strong> — Use your space to run networking nights, offer exclusive discounts, or showcase Muslim-friendly services.</li>
          </ul>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Here&apos;s why you should:</h3>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Amplify your reach</strong> — We&apos;ll market your event across the Say Salams network, helping you find the right audience.</li>
            <li><strong>Bring barakah</strong> — Hosting isn&apos;t just about events, it&apos;s about creating spaces of peace, knowledge, and joy for the community.</li>
            <li><strong>Build credibility</strong> — Position yourself or your organisation as a trusted part of the Muslim community.</li>
          </ul>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Here&apos;s how it works:</h3>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Fill out the &apos;Become a Host&apos; Form</strong> — tell us about yourself, your organisation, or business.</li>
            <li><strong>Become an approved host</strong> — join the Say Salams network of trusted organisers.</li>
            <li><strong>Submit your event</strong> — share it through our events form and join the Say Salams host community.</li>
          </ol>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link
            href="/host"
            style={{
              background: 'linear-gradient(90deg, #6e5084, #6e5065)',
              color: '#fff',
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '1.1rem',
              textAlign: 'center',
            }}
          >
            Become a Host
          </Link>
        </div>
      </section>
    </Layout>
  );
}