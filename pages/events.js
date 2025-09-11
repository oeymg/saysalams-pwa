// pages/events.js

import Layout from '../components/layout.js';
import SEO from '../components/seo';
import Image from 'next/image';
import { getAuth } from '@clerk/nextjs/server';

export async function getServerSideProps(context) {
  const proto = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/events`).catch(() => null);
  const data = await res?.json();
  let events = data?.events ?? [];
  const { userId } = getAuth(context.req);
  if (userId) {
    try {
      const meRes = await fetch(`${base}/api/users?clerkId=${encodeURIComponent(userId)}`);
      const meJson = await meRes.json();
      const myGender = String(meJson?.user?.gender || '').toLowerCase();
      if (myGender === 'female' || myGender === 'male') {
        const isSisters = (ev) => Array.isArray(ev?.audience) && ev.audience.some((a) => /(sister|women|lad(y|ies))/i.test(String(a)));
        const isBrothers = (ev) => Array.isArray(ev?.audience) && ev.audience.some((a) => /(brother|men|gents?)/i.test(String(a)));
        events = events.filter((ev) => {
          if (myGender === 'female' && isBrothers(ev)) return false;
          if (myGender === 'male' && isSisters(ev)) return false;
          return true;
        });
      }
    } catch (_) {}
  }
  return { props: { events, base } };
}

export default function EventsPage({ events, base }) {
  return (
    <Layout>
      <SEO
        url={`${base}/events`}
        title="Upcoming Muslim Events — Say Salams"
        description="Browse upcoming Muslim events near you. Discover classes, socials, workshops, and more — connect with community on Say Salams."
      />
      <section
        className="stack-mobile"
        style={{
          display: 'flex',
          gap: '3rem',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2rem',
          boxSizing: 'border-box',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: '#9b8bbd',
            color: '#fff',
            padding: '1.5rem',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '100%',
            minHeight: '300px',
            height: '250px',
          }}
        >
          <ul style={{ fontSize: '1.2rem', lineHeight: '1.5', marginTop: '1rem', paddingLeft: '1.2rem' }}>
            <li>🌙 <strong>Find your people:</strong> Whether you&apos;re new to the city or looking to strengthen your ties, discover Muslims nearby who share your interests.</li>
            <li>🎉 <strong>Celebrate together:</strong> From Eid nights to family picnics, join events that bring joy and belonging.</li>
            <li>📖 <strong>Learn and grow:</strong> Attend classes, workshops, and talks that enrich your faith, skills, and personal growth.</li>
            <li>🕌 <strong>Support our hosts:</strong> Mosques, organisations, and Muslim-owned businesses who put time, effort, and heart into serving the community.</li>
          </ul>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            minHeight: '300px',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: '100%',
              height: '300px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(110, 80, 132, 0.3)',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
                  color: '#9b8bbd',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              textAlign: 'center',
              padding: '1rem',
              flex: 1,
            }}
          >
            Carousel of Featured Events (Coming Soon)
          </div>
        </div>
      </section>

      {/* Events Listing */}
      <section
        className="container"
        style={{ maxWidth: '1100px', margin: '0 auto 4rem auto', padding: '0 1rem' }}
      >
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '2rem',
            color: '#5a3c91',
          }}
        >
          Upcoming Events
        </h2>

        {events.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>
            No events yet — check back soon insha’Allah ✨
          </p>
        )}

        <div className="events-grid">
          {events.map((ev) => (
            <article
              key={ev.id}
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #eee',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(110, 80, 132, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
            >
              {ev.image_url && (
                <Image
                  src={ev.image_url}
                  alt={ev.title}
                  width={400}
                  height={180}
                  data-mobile-img="card"
                  style={{ objectFit: 'cover', width: '100%', height: '200px' }}
                />
              )}
              <div style={{ flex: 1, padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#9b8bbd', fontWeight: 'bold' }}>{ev.title}</h3>
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
                <p style={{ marginBottom: '0.8rem', color: '#666' }}>
                  👍 {(typeof ev.next_going_count === 'number' ? ev.next_going_count : (ev.going_count ?? 0))} going
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {ev.tickets_url && (
                    <a
                      href={ev.tickets_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#6e5084',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
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
                      color: '#9b8bbd',
                      padding: '0.5rem 1rem',
                      borderRadius: '12px',
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
    </Layout>
  );
}
