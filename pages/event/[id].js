// pages/event/[id].js

import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import Layout from '../../components/layout';
import SEO from '../../components/seo';
import { getAuth } from '@clerk/nextjs/server';

export async function getServerSideProps(context) {
  const id = context.params.id;
  const proto = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;
  const { userId } = getAuth(context.req);
  const res = await fetch(`${base}/api/events`);
  const data = await res.json();
  const ev = (data.events || []).find(e => e.public_id === id) || null;
  // Fetch occurrences for this event
  let occurrences = [];
  try {
    const occRes = await fetch(`${base}/api/occurrences?eventId=${encodeURIComponent(id)}`);
    const occJson = await occRes.json();
    occurrences = occJson?.occurrences || [];
    // Show at most the next 4 upcoming occurrences (fallback to earliest past ones if fewer upcoming)
    try {
      const now = Date.now();
      const sorted = (occurrences || []).slice().sort((a, b) => new Date(a.start_at || 0) - new Date(b.start_at || 0));
      const upcoming = sorted.filter(o => o.start_at && new Date(o.start_at).getTime() >= now);
      let limited = upcoming.slice(0, 4);
      if (limited.length < 4) {
        const past = sorted.filter(o => !o.start_at || new Date(o.start_at).getTime() < now).slice(0, 4 - limited.length);
        limited = limited.concat(past);
      }
      occurrences = limited;
    } catch (_) {}
  } catch (_) {}

  // Fetch per-occurrence going counts
  let occurrenceCounts = {};
  try {
    const counts = await Promise.all(
      (occurrences || []).map(async (o) => {
        try {
          const rr = await fetch(`${base}/api/rsvp?occurrenceId=${encodeURIComponent(o.occurrence_id)}`);
          const rj = await rr.json();
          const rsvps = rj?.rsvps || [];
          const going = rsvps.filter(r => (r.fields?.Status || '').toLowerCase() === 'going').length;
          return [o.occurrence_id, going];
        } catch (_) {
          return [o.occurrence_id, 0];
        }
      })
    );
    counts.forEach(([oid, c]) => { occurrenceCounts[oid] = c; });
  } catch (_) {}

  // Compute similar events by overlapping category and/or same city/region
  let similar = [];
  try {
    const all = Array.isArray(data.events) ? data.events : [];
    if (ev) {
      const catSet = new Set((ev.category || []).map((c) => String(c).toLowerCase()));
      const city = (ev.city_region || '').toLowerCase();
      const scored = [];
      for (const e of all) {
        if (!e || e.public_id === ev.public_id) continue;
        const eCats = new Set((e.category || []).map((c) => String(c).toLowerCase()));
        let overlap = 0;
        catSet.forEach((c) => { if (eCats.has(c)) overlap++; });
        const sameCity = city && (String(e.city_region || '').toLowerCase() === city);
        if (overlap > 0 || sameCity) {
          const startTs = e.start_at ? new Date(e.start_at).getTime() : Number.MAX_SAFE_INTEGER;
          const score = overlap * 10 + (sameCity ? 3 : 0) - startTs / 1e13; // prefer overlap + same city, then sooner date
          scored.push({ e, score });
        }
      }
      scored.sort((a, b) => b.score - a.score);
      similar = scored.slice(0, 6).map((x) => x.e);
    }
  } catch (_) {}

  // Gender-based filtering for similar list as well
  try {
    if (userId) {
      const meRes = await fetch(`${base}/api/users?clerkId=${encodeURIComponent(userId)}`);
      const meJson = await meRes.json();
      const myGender = String(meJson?.user?.gender || '').toLowerCase();
      if (myGender === 'female' || myGender === 'male') {
        const isSisters = (e) => Array.isArray(e?.audience) && e.audience.some((a) => /(sister|women|lad(y|ies))/i.test(String(a)));
        const isBrothers = (e) => Array.isArray(e?.audience) && e.audience.some((a) => /(brother|men|gents?)/i.test(String(a)));
        similar = (similar || []).filter((e) => {
          if (myGender === 'female' && isBrothers(e)) return false;
          if (myGender === 'male' && isSisters(e)) return false;
          return true;
        });
      }
    }
  } catch (_) {}

  try {
    if (userId && ev && Array.isArray(ev.audience)) {
      const myRes = await fetch(`${base}/api/users?clerkId=${encodeURIComponent(userId)}`);
      const me = await myRes.json();
      const g = String(me?.user?.gender || '').toLowerCase();
      const isSisters = ev.audience.some((a) => /(sister|women|lad(y|ies))/i.test(String(a)));
      const isBrothers = ev.audience.some((a) => /(brother|men|gents?)/i.test(String(a)));
      if ((g === 'male' && isSisters) || (g === 'female' && isBrothers)) {
        return { redirect: { destination: '/events', permanent: false } };
      }
    }
  } catch (_) {}

  // Merge friends-going counts for this event from /api/feed (if signed in)
  let friends = { going: 0, interested: 0 };
  try {
    if (userId && ev) {
      const feedRes = await fetch(`${base}/api/feed`, { headers: { cookie: context.req.headers.cookie || '' } });
      if (feedRes.ok) {
        const feedJson = await feedRes.json();
        const row = (feedJson?.events || []).find((e) => String(e.public_id || e.id) === String(ev.public_id));
        if (row) friends = { going: Number(row.connections_going || 0), interested: Number(row.connections_interested || 0) };
      }
    }
  } catch (_) {}

  return { props: { ev, occurrences, occurrenceCounts, base, id, similar, friends } };
}

export default function EventPage({ ev, occurrences = [], occurrenceCounts = {}, base, id, similar = [], friends = { going: 0, interested: 0 } }) {
  const { user, isSignedIn } = useUser();
  const [savingMap, setSavingMap] = useState({}); // by occurrenceId
  const [counts, setCounts] = useState(occurrenceCounts);
  const [savingSeries, setSavingSeries] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (showToast._t) window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2400);
  };

  const handleSeriesRSVP = async () => {
    if (!isSignedIn) {
      showToast('Please sign in to RSVP.', 'error');
      return;
    }
    try {
      setSavingSeries(true);
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, eventId: ev.public_id, status: 'Going' }),
      });
      if (response.ok) {
        showToast('RSVP saved! 👍', 'success');
      } else {
        showToast('Failed to save RSVP.', 'error');
      }
    } catch (_) {
      showToast('Failed to save RSVP.', 'error');
    } finally {
      setSavingSeries(false);
    }
  };

  if (!ev) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem' }}>
          <p>Event not found.</p>
        </div>
      </Layout>
    );
  }

  const handleRSVP = async (occurrenceId) => {
    if (!isSignedIn) {
      showToast('Please sign in to RSVP.', 'error');
      return;
    }
    try {
      setSavingMap((m) => ({ ...m, [occurrenceId]: true }));
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          eventId: ev.public_id,
          occurrenceId,
          status: 'Going',
        }),
      });
      if (response.ok) {
        setCounts((c) => ({ ...c, [occurrenceId]: (c[occurrenceId] || 0) + 1 }));
        showToast('RSVP saved! 👍', 'success');
      } else {
        showToast('Failed to save RSVP.', 'error');
      }
    } catch (error) {
      showToast('Failed to save RSVP.', 'error');
    } finally {
      setSavingMap((m) => ({ ...m, [occurrenceId]: false }));
    }
  };

  return (
    <Layout>
      <SEO
        url={`${base}/event/${encodeURIComponent(id)}`}
        title={`${ev.title} — Say Salams`}
        description={(typeof ev.summary === 'string' ? ev.summary : (ev.summary?.value || '')).slice(0, 280) || 'View event details on Say Salams.'}
        image={ev.image_url || '/icons/logo.png'}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: ev.title,
          description: typeof ev.summary === 'string' ? ev.summary : (ev.summary?.value || ''),
          image: ev.image_url ? [ev.image_url] : [`${base}/icons/logo.png`],
          url: `${base}/event/${encodeURIComponent(id)}`,
          startDate: ev.start_at || undefined,
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          eventStatus: 'https://schema.org/EventScheduled',
          location: (ev.venue || ev.city_region) ? {
            '@type': 'Place',
            name: ev.venue || 'Venue',
            address: {
              '@type': 'PostalAddress',
              addressLocality: ev.city_region || undefined,
            },
          } : undefined,
          offers: ev.tickets_url ? {
            '@type': 'Offer',
            url: ev.tickets_url,
            availability: 'https://schema.org/InStock',
            price: ev.cost || undefined,
          } : undefined,
          organizer: ev.organiser_name ? {
            '@type': 'Organization',
            name: ev.organiser_name,
          } : undefined,
        }}
      />
      <div className="container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        {/* Event image */}
        {ev.image_url && (
          <Image
            src={ev.image_url}
            alt={ev.title}
            width={900}
            height={400}
            quality={90}
            sizes="(max-width: 900px) 100vw, 900px"
            data-mobile-img="event-hero"
            style={{
              width: '100%',
              height: '300px',
              borderRadius: '12px',
              marginBottom: '1rem',
              objectFit: 'cover',
            }}
            data-reveal
          />
        )}

        {/* Title + badges + tickets */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }} data-reveal>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h1 style={{ color: '#6e5084', marginBottom: '0.5rem' }}>{ev.title}</h1>
            {ev.is_recurring && (
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 }}>
                Recurring
              </span>
            )}
          </div>
          {ev.tickets_url && (
            <a
              href={ev.tickets_url}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#6e5084',
                color: '#fff',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Tickets
            </a>
          )}
        </div>

        {/* Meta info */}
        <p style={{ color: '#555', marginBottom: '0.5rem' }} data-reveal>
          {ev.start_at ? new Date(ev.start_at).toLocaleString('en-AU') : 'TBA'}
          {ev.venue ? ` · ${ev.venue}` : ''}
          {ev.city_region ? ` · ${ev.city_region}` : ''}
        </p>
        {(friends.going > 0 || friends.interested > 0) && (
          <div style={{ marginBottom: '1rem' }} data-reveal>
            <span className="chip" style={{ background:'#dcfce7', color:'#065f46' }}>
              {friends.going > 0 ? `${friends.going} friend${friends.going===1?'':'s'} going` : `${friends.interested} friend${friends.interested===1?'':'s'} interested`}
            </span>
          </div>
        )}

        {/* Tags */}
        {(ev.category || []).length > 0 && (
          <p style={{ marginBottom: '0.75rem' }} data-reveal>
            {ev.category.map((t) => (
              <span
                key={t}
                style={{
                  background: '#9b8bbd', // light pink chip
                  color: '#f6f4fa',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  marginRight: '0.3rem',
                }}
              >
                {t}
              </span>
            ))}
          </p>
        )}

        {/* Event Summary moved below tags */}
        {ev.summary && (
          <div style={{ marginBottom: '1.25rem' }} data-reveal>
            <h2 style={{ marginBottom: '0.5rem', color: '#6e5084' }}>Event Summary</h2>
            <p style={{ lineHeight: '1.6', color: '#333' }}>
              {typeof ev.summary === 'string' ? ev.summary : (ev.summary?.value || '')}
            </p>
          </div>
        )}

        {/* Halal Notes (if exists) */}
        {ev.halal_notes && (
          <p style={{ color: '#777', fontStyle: 'italic', marginBottom: '1rem' }}>
            {ev.halal_notes}
          </p>
        )}

        {/* Occurrences list */}
        {occurrences && occurrences.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }} data-reveal>
            <h2 style={{ margin: '1rem 0 0.5rem', color: '#6e5084' }}>Upcoming in this Event</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {occurrences.map((o, idx) => (
                <div key={o.occurrence_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f6f4fa', border: '1px solid #eee', borderRadius: 8, padding: '0.6rem 0.8rem', transitionDelay: `${idx * 60}ms` }} className="reveal">
                  <div>
                    <div style={{ fontWeight: 600, color: '#4f3a76' }}>
                      {o.start_at ? new Date(o.start_at).toLocaleString('en-AU') : 'TBA'}
                    </div>
                    <div style={{ color: '#555', fontSize: '0.9rem' }}>
                      {(o.venue || ev.venue) ? (o.venue || ev.venue) : ''}
                      {o.city_region ? ` · ${o.city_region}` : (ev.city_region ? ` · ${ev.city_region}` : '')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#444', fontSize: '0.9rem' }}>👍 {counts[o.occurrence_id] || 0}</div>
                    <button
                      onClick={() => handleRSVP(o.occurrence_id)}
                      style={{
                        background: '#6e5084',
                        color: '#f6f4fa',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      disabled={!!savingMap[o.occurrence_id]}
                    >
                      {savingMap[o.occurrence_id] ? 'Saving...' : 'RSVP'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback: series-level RSVP when no occurrences */}
        {(!occurrences || occurrences.length === 0) && (
          <div style={{ marginBottom: '1.5rem' }} data-reveal>
            <h2 style={{ margin: '1rem 0 0.5rem', color: '#6e5084' }}>RSVP</h2>
            <p style={{ color: '#666', marginBottom: '0.75rem' }}>
              No upcoming occurrences listed yet. RSVP to the event series.
            </p>
            <button
              onClick={handleSeriesRSVP}
              style={{
                background: '#6e5084',
                color: '#f6f4fa',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
              }}
              disabled={savingSeries}
            >
              {savingSeries ? 'Saving...' : 'RSVP'}
            </button>
          </div>
        )}

        {/* Summary already shown above */}

        {/* Full Description removed as requested */}

        {/* Action buttons removed (Tickets moved next to title) */}

        {/* Details list */}
        <div style={{ marginTop: '2rem', display: 'grid', gap: '0.5rem' }}>
          {ev.cost && (
            <div style={{ background: '#f6f0ff', padding: '0.75rem 1rem', borderRadius: 8 }}>
              <div style={{ color: '#4f3a76' }}><strong>Cost:</strong> {ev.cost}</div>
            </div>
          )}
          {ev.halal_notes && (
            <div style={{ background: '#eefcf3', padding: '0.75rem 1rem', borderRadius: 8, color: '#065f46' }}>
              <strong>Halal Notes:</strong> {ev.halal_notes}
            </div>
          )}
        </div>
      </div>
      {/* Similar events */}
      {Array.isArray(similar) && similar.length > 0 && (
        <div className="container" style={{ padding: '0 1rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ color: '#6e5084', margin: '1.5rem 0 1rem' }}>Discover other events like this</h2>
          <div className="events-grid">
            {similar.map((s) => (
              <article
                key={s.public_id}
                className="hover-pop"
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
                {s.image_url && (
                  <Image
                    src={s.image_url}
                    alt={s.title}
                    width={600}
                    height={220}
                    style={{ objectFit: 'cover', height: 'auto', width: '100%' }}
                  />
                )}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.4rem', color: '#9b8bbd', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</h3>
                  <p style={{ margin: '0 0 0.5rem', color: '#555' }}>
                    {s.start_at ? new Date(s.start_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric' }) : 'TBA'}
                    {s.city_region ? ` · ${s.city_region}` : ''}
                  </p>
                  <div style={{ marginBottom: '0.5rem' }}>
                    {(s.category || []).slice(0, 2).map((t) => (
                      <span key={t} style={{ background: '#ede8f7', color: '#5a3c91', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.8rem', marginRight: '0.3rem' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <p style={{ margin: 0, color: '#666' }}>👍 {(typeof s.next_going_count === 'number' ? s.next_going_count : (s.going_count ?? 0))} going</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
                    <a
                      href={`/event/${encodeURIComponent(s.public_id)}`}
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
                      View
                    </a>
                    {s.tickets_url && (
                      <a
                        href={s.tickets_url}
                        target="_blank"
                        rel="noreferrer"
                      style={{ background: '#6e5084', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}
                      >
                        Tickets
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
      {toast && (
        <div
          onClick={() => setToast(null)}
          style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000, background: toast.type === 'error' ? '#ef4444' : '#22c55e', color: '#fff', padding: '0.75rem 1rem', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', cursor: 'pointer' }}
        >
          {toast.message}
        </div>
      )}
    </Layout>
  );
}
