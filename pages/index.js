// pages/index.js

import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/layout';
import { getAuth } from '@clerk/nextjs/server';
import Collapsible from '../components/Collapsible';
import SEO from '../components/seo';

export async function getServerSideProps(context) {
  const proto = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;
  const { userId } = getAuth(context.req);
  const res = await fetch(`${base}/api/events`).catch(() => null);
  const data = await res?.json();
  let events = data?.events ?? [];
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

export default function Home({ events, base }) {
  // Derive simple hero stats and a small preview list
  const now = Date.now();
  const in7 = now + 7 * 24 * 60 * 60 * 1000;
  const eventsThisWeek = (events || []).filter(e => {
    const t = e?.start_at ? new Date(e.start_at).getTime() : null;
    return t && t >= now && t <= in7;
  }).length;
  const cities = new Set((events || []).map(e => e.city_region).filter(Boolean));
  const mini = (events || []).slice(0, 3);
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
      {/* Modern hero */}
      <section className="hero-band full-bleed" data-reveal>
        <div className="hero-band-inner">
          <div>
            <h1 className="hero-band-title">
              Find your people. <br /> Share your salam.
            </h1>
            <p className="hero-band-sub">Discover Muslim-friendly events near you — join in, RSVP, and build meaningful connections.</p>
            <form className="hero-search" action="/events" method="get">
              <input className="hero-input" type="search" name="q" placeholder="Search events, e.g. picnic, sisters, workshop…" />
              <button className="hero-submit" type="submit">Search</button>
            </form>
            {/* Stats pills removed per request */}
            <div className="hero-band-ctas">
              <Link href="/events" style={{ textDecoration: 'none' }}><span className="home-cta-primary">Browse events</span></Link>
              <Link href="/host" style={{ textDecoration: 'none' }}><span className="home-cta-secondary">Become a host</span></Link>
            </div>
          </div>
          <div>
            <div className="hero-preview">
              {mini.map((e) => (
                <div key={e.id} className="hero-card-mini">
                  <div className="mini-title">{e.title}</div>
                  <div className="mini-meta">
                    {(e.start_at ? new Date(e.start_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }) : 'TBA')}
                    {e.city_region ? ` · ${e.city_region}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Say Salams (floating cards) */}
      <section className="why-ribbon full-bleed" data-reveal>
        <div className="why-ribbon-inner why-float">
          <h2 className="why-ribbon-title"></h2>
          <div className="why-float-grid">
            <div className="why-float-card hover-pop">
              <div className="why-float-icn">🌟</div>
              <p className="why-float-text"><strong>Connect with friends</strong> — build your circle, strengthen bonds, and share in gatherings rooted in faith.</p>
            </div>
            <div className="why-float-card hover-pop">
              <div className="why-float-icn">🎉</div>
              <p className="why-float-text"><strong>Belong to something bigger</strong> — see who&apos;s going, join in, and never feel like you&apos;re attending alone.</p>
            </div>
            <div className="why-float-card hover-pop">
              <div className="why-float-icn">📍</div>
              <p className="why-float-text"><strong>Discover what&apos;s near you</strong> — find Muslim-friendly events, classes, and opportunities to connect in your local area.</p>
            </div>
            <div className="why-float-card hover-pop">
              <div className="why-float-icn">🕌</div>
              <p className="why-float-text"><strong>Strengthen our ummah</strong> — every event is more than a meetup; it&apos;s a step toward unity, peace, and spreading barakah.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Removed top categories chip row as requested */}

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
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#9b8bbd', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</h3>
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


      
      {/* How to Become a Host Section */}
      <section
        style={{
          background: '#f6f4fa',
          color: '#9b8bbd',
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

      
    </Layout>
  );
}
