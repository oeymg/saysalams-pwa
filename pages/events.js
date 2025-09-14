// pages/events.js

import Layout from '../components/layout.js';
import SEO from '../components/seo';
import Image from 'next/image';
import { getAuth } from '@clerk/nextjs/server';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';

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
      // Merge friend RSVP counts from /api/feed
      try {
        const feedRes = await fetch(`${base}/api/feed`, { headers: { cookie: context.req.headers.cookie || '' } });
        if (feedRes.ok) {
          const feedJson = await feedRes.json();
          const map = new Map();
          for (const e of feedJson?.events || []) {
            const id = e.public_id || e.id;
            map.set(String(id), {
              g: Number(e.connections_going || 0),
              i: Number(e.connections_interested || 0),
            });
          }
          events = events.map((ev) => {
            const id = String(ev.public_id || ev.id);
            const m = map.get(id);
            return m ? { ...ev, friends_going: m.g, friends_interested: m.i } : ev;
          });
        }
      } catch { /* ignore */ }
    } catch {}
  }
  return { props: { events, base } };
}

export default function EventsPage({ events, base }) {
  const router = useRouter();
  const initialQ = typeof router.query?.q === 'string' ? router.query.q : '';
  const [q, setQ] = useState(initialQ);
  const selected = typeof router.query?.tag === 'string' ? router.query.tag : '';
  const initialSort = typeof router.query?.sort === 'string' ? router.query.sort : 'date';
  const [sortBy, setSortBy] = useState(initialSort);

  const tokens = useMemo(() => {
    const set = new Set();
    for (const ev of events || []) {
      (Array.isArray(ev.category) ? ev.category : []).forEach(t => set.add(String(t)));
      (Array.isArray(ev.audience) ? ev.audience : []).forEach(t => set.add(String(t)));
    }
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const needles = (q || '').toLowerCase().split(/\s+/).filter(Boolean);
    const base = (events || []).filter((ev) => {
      const hay = [
        ev.title,
        ev.city_region,
        ...(Array.isArray(ev.category) ? ev.category : []),
        ...(Array.isArray(ev.audience) ? ev.audience : []),
      ].join(' ').toLowerCase();
      const okQ = needles.length === 0 || needles.every(n => hay.includes(n));
      const okTag = !selected || (Array.isArray(ev.category) && ev.category.includes(selected)) || (Array.isArray(ev.audience) && ev.audience.includes(selected));
      return okQ && okTag;
    });
    const arr = [...base];
    if (sortBy === 'popular') {
      arr.sort((a,b) => ((b.next_going_count ?? b.going_count ?? 0) - (a.next_going_count ?? a.going_count ?? 0)) || (new Date(a.start_at||0) - new Date(b.start_at||0)));
    } else {
      arr.sort((a,b) => new Date(a.start_at||0) - new Date(b.start_at||0));
    }
    return arr;
  }, [events, q, selected, sortBy]);

  const onSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (selected) params.set('tag', selected);
    if (sortBy) params.set('sort', sortBy);
    router.push(`/events${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const onSelectTag = (tag) => {
    const params = new URLSearchParams(router.query);
    if (tag && tag === selected) {
      params.delete('tag');
    } else if (tag) {
      params.set('tag', tag);
    }
    if (q) params.set('q', q); else params.delete('q');
    if (sortBy) params.set('sort', sortBy); else params.delete('sort');
    router.push(`/events${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const onChangeSort = (val) => {
    setSortBy(val);
    const params = new URLSearchParams(router.query);
    if (val) params.set('sort', val); else params.delete('sort');
    if (q) params.set('q', q); else params.delete('q');
    if (selected) params.set('tag', selected); else params.delete('tag');
    router.push(`/events${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <Layout>
      <SEO
        url={`${base}/events`}
        title="Upcoming Muslim Events — Say Salams"
        description="Browse upcoming Muslim events near you. Discover classes, socials, workshops, and more — connect with community on Say Salams."
      />
      <section className="full-bleed" style={{ padding: '1rem 0 0' }}>
        <div className="hero-band-inner" style={{ alignItems: 'stretch', gridTemplateColumns: '1fr' }}>
          <div style={{ display:'grid', gap:'0.5rem' }}>
            <h1 className="hero-band-title" style={{ marginBottom: 0 }}>Upcoming Events</h1>
            <p className="hero-band-sub" style={{ marginTop: 0 }}>Search and filter to find what suits you.</p>
            <form onSubmit={onSubmit} className="hero-search" action="/events" method="get">
              <input className="hero-input" type="search" name="q" placeholder="Search by title, city, category…" value={q} onChange={(e)=>setQ(e.target.value)} />
              <select value={sortBy} onChange={(e)=>onChangeSort(e.target.value)} style={{ background:'#fff', color:'#6e5084', border:'1px solid #e7e2f0', borderRadius:12, padding:'.6rem .8rem', fontWeight:700 }}>
                <option value="date">Sort: Date</option>
                <option value="popular">Sort: Popular</option>
              </select>
              <button className="hero-submit" type="submit">Search</button>
            </form>
            {tokens.length > 0 && (
              <div className="home-chip-row" style={{ marginTop: 6 }}>
                <button type="button" onClick={()=>onSelectTag('')} className="home-chip" style={{ borderColor: selected ? '#ded7ef' : '#6e5084', color: selected ? '#5a3c91' : '#6e5084', background: selected ? '#ede8f7' : '#fff' }}>All</button>
                {tokens.map(t => (
                  <button key={t} type="button" onClick={()=>onSelectTag(t)} className="home-chip" style={{ borderColor: selected===t ? '#6e5084' : '#ded7ef', background: selected===t ? '#ede8f7' : '#fff', color: '#5a3c91' }}>{t}</button>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </section>

      {/* Events Listing */}
      <section
        className="container"
        style={{ maxWidth: '1100px', margin: '0 auto 4rem auto', padding: '0 1rem' }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '1.25rem', fontSize: '2rem', color: '#5a3c91' }}>
          {filtered.length} event{filtered.length===1 ? '' : 's'} found
        </h2>

        {events.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>
            No events yet — check back soon insha’Allah ✨
          </p>
        )}

        <div className="events-grid">
          {filtered.map((ev) => (
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
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#9b8bbd', fontWeight: 800 }} className="clamp-1">{ev.title}</h3>
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
                {(Array.isArray(ev.category) && ev.category.length > 0) || (Array.isArray(ev.audience) && ev.audience.length > 0) ? (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: '0.6rem' }}>
                    {(ev.category || []).slice(0,2).map(t => (<span key={t} className="chip">{t}</span>))}
                    {(ev.audience || []).slice(0,1).map(t => (<span key={t} className="chip">{t}</span>))}
                  </div>
                ) : null}
                <div style={{ marginBottom: '0.8rem', color: '#666', display:'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>👍 {(typeof ev.next_going_count === 'number' ? ev.next_going_count : (ev.going_count ?? 0))} going</span>
                  {(ev.friends_going > 0 || ev.friends_interested > 0) && (
                    <span className="chip" style={{ background:'#dcfce7', color:'#065f46' }}>
                      {ev.friends_going > 0 ? `${ev.friends_going} friend${ev.friends_going===1?'':'s'} going` : `${ev.friends_interested} friend${ev.friends_interested===1?'':'s'} interested`}
                    </span>
                  )}
                </div>
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
