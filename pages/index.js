// pages/index.js

import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/layout';
import Collapsible from '../components/Collapsible';
import SEO from '../components/seo';

export async function getServerSideProps(context) {
  const proto = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/events`).catch(() => null);
  const data = await res?.json();
  return { props: { events: data?.events ?? [], base } };
}

export default function Home({ events, base }) {
  return (
    <Layout>
      <SEO
        url={base}
        title="Say Salams — Discover Muslim Events Near You"
        description="Say Salams brings Muslims together through events, connections, and community. Discover what's on, RSVP, and spread peace."
        image="/icons/longlogo.png"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Say Salams',
            url: base,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${base}/events?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Say Salams',
            url: base,
            logo: `${base}/icons/logo.png`,
          },
        ]}
      />
      {/* Why Say Salams Section */}
      <section
        style={{
          background: '#6e5084',
          color: '#fff',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          marginBottom: '2.5rem',
        }}
        data-reveal
      >
        <h2
          style={{
            fontSize: '3rem',
            marginBottom: '0.75rem',
            fontWeight: 900,
            letterSpacing: '0.5px',
            background: 'linear-gradient(90deg, #ffffff, #e6d7ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Why Say Salams?
        </h2>
        <p style={{ maxWidth: '760px', margin: '0 auto 0.75rem auto', lineHeight: '1.75', fontSize: '1.05rem' }}>
          Saying <strong>Assalamu alaykum</strong> is more than a greeting — it&apos;s a prayer of peace.
        </p>
        <p
          style={{
            maxWidth: '840px',
            margin: '0 auto 0.75rem auto',
            lineHeight: '1.8',
            fontWeight: 700,
            fontSize: '1.15rem',
          }}
        >
          Say Salams is where Muslims come together — to discover events, build friendships, and share barakah.
        </p>
        <p style={{ maxWidth: '760px', margin: '0 auto 0.75rem auto', lineHeight: '1.7' }}>
          <strong>Every Salam spreads peace. Every connection strengthens our Ummah.</strong>
        </p>
        <p style={{ fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>✨ Peace begins with you.</p>
      </section>

      {/* Events Section */}
      <section
        style={{ maxWidth: '1100px', margin: '0 auto 4rem', padding: '0 1rem', flex: 1 }}
        data-reveal
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

        <div className="events-grid">
          {events.map((ev, idx) => (
            <article
              key={ev.id}
              style={{
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                border: '1px solid #eee',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                transitionDelay: `${idx * 60}ms`,
              }}
              className="hover-pop reveal"
            >
              {ev.image_url && (
                <Image
                  src={ev.image_url}
                  alt={ev.title}
                  width={600}
                  height={220}
                  data-mobile-img="card"
                  style={{ objectFit: 'cover', height: 'auto', width: '100%' }}
                />
              )}
              <div style={{ flex: 1, padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#6e5084', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</h3>
                  {ev.is_recurring && (
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                      Recurring
                    </span>
                  )}
                </div>
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
                  {ev.city_region ? ` · ${ev.city_region}` : ''}
                </p>
                <div style={{ marginBottom: '0.5rem' }}>
                  {(ev.category || []).slice(0, 3).map(t => (
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
                  👍 {typeof ev.next_going_count === 'number' ? ev.next_going_count : (ev.going_count ?? 0)} going
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
                        fontWeight: 700,
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
                      fontWeight: 700,
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
          gap: '1rem',
          padding: '1.2rem',
          background: '#6e5084',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.16)',
          color: '#fff',
          marginBottom: '2rem',
        }}
        className="hover-pop"
        data-reveal
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
              fontSize: '2rem',
              fontWeight: '700',
              margin: 0,
              letterSpacing: '0.5px',
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
            fontSize: '1rem',
            lineHeight: '1.6',
            color: '#fff',
          }}
        >
          <p style={{ marginBottom: '0.6rem' }}>
            🌟 <strong>Connect with friends</strong> — build your circle, strengthen bonds, and share in gatherings rooted in faith.
          </p>
          <p style={{ marginBottom: '0.6rem' }}>
            🎉 <strong>Belong to something bigger</strong> — see who&apos;s going, join in, and never feel like you&apos;re attending alone.
          </p>
          <p style={{ marginBottom: '0.6rem' }}>
            📍 <strong>Discover what&apos;s near you</strong> — find Muslim-friendly events, classes, and opportunities to connect in your local area.
          </p>
          <p style={{ marginBottom: '0.6rem' }}>
            🕌 <strong>Strengthen our ummah</strong> — every event is more than a meetup; it&apos;s a step toward unity, peace, and spreading barakah.
          </p>
        </div>

        {/* CTA: Go to sign-up flow (handles Clerk + Airtable) */}
        <div style={{ flexBasis: '100%', textAlign: 'center' }}>
          <Link
            href="/sign-up"
            style={{
              background: '#f6f4fa',
              color: '#6e5084',
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '1.05rem',
              display: 'inline-block',
              marginTop: '0.5rem',
              border: '1px solid #d9d6e3',
              boxShadow: '0 4px 12px rgba(110, 80, 132, 0.15)'
            }}
          >
            Join Say Salams
          </Link>
        </div>
      </section>

      {/* How to Become a Host Section */}
      <section
        style={{
          background: '#f6f4fa',
          color: '#6e5084',
          padding: '2rem 1rem',
          textAlign: 'left',
          marginBottom: '2rem',
          maxWidth: '1100px',
          marginLeft: 'auto',
          marginRight: 'auto',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          border: '2px solid #f6f4fa',
        }}
        className="hover-pop"
        data-reveal
      >
        <h2 style={{ fontSize: '2.8rem', marginBottom: '2rem', fontWeight: '800', color: '#6e5084', textAlign: 'center' }}>
          Want to Host an Event with Say Salams?
        </h2>

        <div className="host-collapsible" style={{ marginBottom: '1.5rem' }}>
          <Collapsible title="Here’s who can">
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6', margin: 0 }}>
              <li><strong>Individuals</strong> — Host game nights, study circles, or creative workshops (arts &amp; crafts, cooking, calligraphy).</li>
              <li><strong>Organisations</strong> — Mosques, youth groups, and community associations running events that uplift and connect.</li>
              <li><strong>Businesses</strong> — Use your space to run networking nights, offer exclusive discounts, or showcase Muslim-friendly services.</li>
            </ul>
          </Collapsible>
        </div>

        <div className="host-collapsible" style={{ marginBottom: '1.5rem' }}>
          <Collapsible title="Here’s why you should">
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6', margin: 0 }}>
              <li><strong>Amplify your reach</strong> — We&apos;ll market your event across the Say Salams network, helping you find the right audience.</li>
              <li><strong>Bring barakah</strong> — Hosting isn&apos;t just about events, it&apos;s about creating spaces of peace, knowledge, and joy for the community.</li>
              <li><strong>Build credibility</strong> — Position yourself or your organisation as a trusted part of the Muslim community.</li>
            </ul>
          </Collapsible>
        </div>

        <div className="host-collapsible" style={{ marginBottom: '2rem' }}>
          <Collapsible title="Here’s how it works">
            <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6', margin: 0 }}>
              <li><strong>Fill out the &apos;Become a Host&apos; Form</strong> — tell us about yourself, your organisation, or business.</li>
              <li><strong>Become an approved host</strong> — join the Say Salams network of trusted organisers.</li>
              <li><strong>Submit your event</strong> — share it through our events form and join the Say Salams host community.</li>
            </ol>
          </Collapsible>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link
            href="/host"
            style={{
              background: '#6e5084',
              color: '#fff',
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '1.2rem',
              textAlign: 'center',
            }}
          >
            Become a Host
          </Link>
        </div>
      </section>

      {/* Bottom CTA Section (moved to the very bottom) */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto 3rem',
          padding: '1.75rem',
          border: '1px solid #eee',
          borderRadius: '12px',
          background: '#f6f4fa',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
        }}
        className="hover-pop"
        data-reveal
      >
        <h3 style={{ color: '#6e5084', margin: '0 0 0.75rem 0', fontSize: '1.6rem' }}>Ready to get involved?</h3>
        <p style={{ color: '#555', margin: '0 0 1rem 0' }}>
          Browse the latest events or become a host and bring people together.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            href="/events"
            style={{
              background: '#f6f4fa',
              color: '#6e5084',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              border: '1px solid #ded7ef'
            }}
          >
            Browse Events
          </Link>
          <Link
            href="/host"
            style={{
              background: '#6e5084',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Become a Host
          </Link>
        </div>
      </section>
    </Layout>
  );
}
