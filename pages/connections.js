import Layout from '../components/layout';
import { getAuth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export async function getServerSideProps(context) {
  const { userId: clerkId } = getAuth(context.req);
  if (!clerkId) {
    return { redirect: { destination: '/sign-in?next=/connections', permanent: false } };
  }

  const proto = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;

  // Ensure the user has an app profile in Airtable
  const userRes = await fetch(`${base}/api/users?clerkId=${encodeURIComponent(clerkId)}`).catch(() => null);
  const userJson = await userRes?.json();
  const me = userJson?.user || null;
  if (!me) {
    return { redirect: { destination: '/sign-up?next=/connections', permanent: false } };
  }

  return { props: { me } };
}

export default function ConnectionsPage({ me }) {
  const [accepted, setAccepted] = useState([]);
  const [pending, setPending] = useState([]);
  const [people, setPeople] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (showToast._t) window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [acc, pen, users, rec] = await Promise.all([
          fetch('/api/connections?status=Accepted').then(r => r.json()).catch(() => ({})),
          fetch('/api/connections?status=Pending').then(r => r.json()).catch(() => ({})),
          fetch('/api/users').then(r => r.json()).catch(() => ({})),
          fetch('/api/recommendations?limit=12').then(r => r.json()).catch(() => ({})),
        ]);
        setAccepted(acc?.connections || []);
        setPending(pen?.connections || []);
        const all = (users?.users || []).filter(u => u.record_id !== me.record_id);
        setPeople(all);
        setRecs(rec?.recommendations || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [me?.record_id]);

  const myIds = useMemo(() => new Set([me?.record_id]), [me?.record_id]);
  const pendingIds = new Set(pending.flatMap(c => [c.requester, c.recipient]).filter(Boolean));
  const acceptedIds = new Set(accepted.flatMap(c => [c.requester, c.recipient]).filter(Boolean));

  const discover = useMemo(() => {
    // Hide users I already have a connection with (pending or accepted)
    return (people || []).filter(u => !pendingIds.has(u.record_id) && !acceptedIds.has(u.record_id) && !myIds.has(u.record_id));
  }, [people, pendingIds, acceptedIds, myIds]);

  const request = async (to) => {
    try {
      const res = await fetch('/api/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toRecordId: to }) });
      if (!res.ok) throw new Error('Failed to send request');
      showToast('Request sent ✅');
      const pen = await fetch('/api/connections?status=Pending').then(r => r.json());
      setPending(pen?.connections || []);
    } catch (e) {
      showToast(e.message || 'Failed to send request', 'error');
    }
  };

  const actOn = async (id, action) => {
    try {
      const res = await fetch('/api/connections', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
      if (!res.ok) throw new Error('Failed to update request');
      showToast('Updated ✅');
      const [acc, pen] = await Promise.all([
        fetch('/api/connections?status=Accepted').then(r => r.json()),
        fetch('/api/connections?status=Pending').then(r => r.json()),
      ]);
      setAccepted(acc?.connections || []);
      setPending(pen?.connections || []);
    } catch (e) {
      showToast(e.message || 'Failed to update request', 'error');
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
        <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ color: '#6e5084', margin: 0 }}>My Connections</h1>
          <Link href="/profile" style={{ color: '#6e5084', textDecoration: 'underline' }}>View profile</Link>
        </header>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Left: My Network + Requests */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              <section style={secStyle}>
                <h2 style={h2}>My Network</h2>
                {accepted.length === 0 ? (
                  <p style={{ margin: 0 }}>No connections yet.</p>
                ) : (
                  <ul style={list}>
                    {accepted.map((c) => (
                      <li key={c.id} style={pill('#f8f6fc', '#e7e2f0')}>
                        <div>
                          <strong>{c.other?.name || 'User'}</strong>
                          <div style={{ color: '#666', fontSize: '0.9rem' }}>{c.other?.email || ''}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section style={secStyle}>
                <h2 style={h2}>Requests</h2>
                {pending.length === 0 ? (
                  <p style={{ margin: 0 }}>No pending requests.</p>
                ) : (
                  <ul style={list}>
                    {pending.map((c) => (
                      <li key={c.id} style={{ ...pill('#fff7ed', '#fed7aa'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{c.other?.name || 'User'}</strong>
                          <div style={{ color: '#92400e', fontSize: '0.9rem' }}>Pending</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => actOn(c.id, 'accept')} style={btn('#16a34a')}>Accept</button>
                          <button onClick={() => actOn(c.id, 'decline')} style={btn('#ef4444')}>Decline</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Right: Recommendations + Discover fallback */}
            <section style={secStyle}>
              <h2 style={h2}>Recommended For You</h2>
              {Array.isArray(recs) && recs.length > 0 ? (
                <ul style={list}>
                  {recs.map((r) => (
                    <li key={r.user.record_id} style={{ ...pill('#eefcf3', '#bbf7d0'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{r.user.name || 'User'}</strong>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>{r.user.location || ''}</div>
                        <div style={{ marginTop: 6 }}>
                          {(r.reasons || []).map((t) => (
                            <span key={t} style={{ background: '#dcfce7', color: '#065f46', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', marginRight: 6 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => request(r.user.record_id)} style={btn('#16a34a')}>Connect</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <h3 style={{ color: '#5a3c91', marginTop: '0.25rem' }}>Discover People</h3>
                  {discover.length === 0 ? (
                    <p style={{ margin: 0 }}>No suggestions right now.</p>
                  ) : (
                    <ul style={list}>
                      {discover.map((u) => (
                        <li key={u.record_id} style={{ ...pill('#f1ecfb', '#e0d8f3'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{u.name || 'User'}</strong>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>{u.location || ''}</div>
                            {Array.isArray(u.interests) && u.interests.length > 0 && (
                              <div style={{ marginTop: 6 }}>
                                {u.interests.slice(0, 3).map((t) => (
                                  <span key={t} style={{ background: '#ede8f7', color: '#5a3c91', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', marginRight: 6 }}>{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => request(u.record_id)} style={btn('#6e5084')}>Connect</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          </div>
        )}

        {toast && (
          <div onClick={() => setToast(null)} style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000, background: toast.type === 'error' ? '#ef4444' : '#22c55e', color: '#fff', padding: '0.75rem 1rem', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', cursor: 'pointer' }}>{toast.message}</div>
        )}
      </div>
    </Layout>
  );
}

const secStyle = {
  background: '#fff',
  borderRadius: 12,
  padding: '1rem',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
};
const h2 = { color: '#6e5084', margin: '0 0 0.75rem 0' };
const list = { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' };
const pill = (bg, border) => ({ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '0.6rem 0.8rem' });
const btn = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.7rem', cursor: 'pointer', fontWeight: 600 });
