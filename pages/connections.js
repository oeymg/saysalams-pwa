import Layout from '../components/layout';
import { getAuth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

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
  const [quick, setQuick] = useState(null); // { user, edge, mine, status }

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
  const findPendingEdge = (rid) => pending.find(c => c.other?.record_id === rid) || null;

  const findAcceptedEdge = (rid) => accepted.find(c => c.other?.record_id === rid) || null;

  const openQuick = (user) => {
    if (!user) return;
    const p = findPendingEdge(user.record_id);
    const a = findAcceptedEdge(user.record_id);
    const mine = p && p.requester === me?.record_id;
    const status = a ? 'accepted' : (p ? (mine ? 'pending-out' : 'pending-in') : 'none');
    setQuick({ user, edge: p || a || null, mine, status });
  };
  const closeQuick = () => setQuick(null);

  const incoming = useMemo(
    () => pending.filter(c => c.recipient === me?.record_id),
    [pending, me?.record_id]
  );
  const sent = useMemo(
    () => pending.filter(c => c.requester === me?.record_id),
    [pending, me?.record_id]
  );

  const discover = useMemo(() => {
    // Hide users I already have an accepted connection with; allow pending for withdraw UI
    let base = (people || []).filter(u => !acceptedIds.has(u.record_id) && !myIds.has(u.record_id));
    // Gender segregation: only show same-gender users if my gender is known
    const myGender = String(me?.gender || '').toLowerCase();
    if (myGender === 'female' || myGender === 'male') {
      base = base.filter(u => String(u?.gender || '').toLowerCase() === myGender);
    }
    return base;
  }, [people, pendingIds, acceptedIds, myIds, me?.gender]);

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
        <header className="connections-header" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ color: '#6e5084', margin: 0 }}>My Connections</h1>
          <Link href="/profile" style={{ color: '#6e5084', textDecoration: 'underline' }}>View profile</Link>
        </header>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="connections-grid">
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
                          <strong style={{ cursor:'pointer' }} onClick={() => openQuick(c.other)}>{c.other?.name || 'User'}</strong>
                          <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            {[c.other?.postcode, c.other?.location].filter(Boolean).join(' · ')}
                          </div>
                          {Array.isArray(c.other?.interests) && c.other.interests.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {c.other.interests.slice(0, 3).map((t) => (
                                <span key={t} style={{ background: '#ede8f7', color: '#5a3c91', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', marginRight: 6 }}>{t}</span>
                              ))}
                            </div>
                          )}
                          {Array.isArray(c.other_rsvps) && c.other_rsvps.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {c.other_rsvps.map((r) => (
                                <a key={`${c.id}-${r.eventId}`} href={`/event/${encodeURIComponent(r.eventId)}`} style={{ textDecoration: 'none' }}>
                                  <span className="chip" style={{ display: 'inline-block' }}>
                                    {r.title} · {r.start_at ? new Date(r.start_at).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }) : ''}
                                  </span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section style={secStyle}>
                <h2 style={h2}>Requests Received</h2>
                {incoming.length === 0 ? (
                  <p style={{ margin: 0 }}>No incoming requests.</p>
                ) : (
                  <ul style={list}>
                    {incoming.map((c) => (
                      <li key={c.id} className="conn-item" style={{ ...pill('#fff7ed', '#fed7aa') }}>
                        <div>
                          <strong style={{ cursor:'pointer' }} onClick={() => openQuick(c.other)}>{c.other?.name || 'User'}</strong>
                          <div style={{ color: '#92400e', fontSize: '0.9rem' }}>Pending</div>
                          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            {[c.other?.postcode, c.other?.location].filter(Boolean).join(' · ')}
                          </div>
                          {Array.isArray(c.other?.interests) && c.other.interests.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {c.other.interests.slice(0, 3).map((t) => (
                                <span key={t} style={{ background: '#fff1e6', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', marginRight: 6 }}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="conn-actions">
                          <button onClick={() => actOn(c.id, 'accept')} style={btn('#16a34a')}>Accept</button>
                          <button onClick={() => actOn(c.id, 'decline')} style={btn('#ef4444')}>Decline</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section style={secStyle}>
                <h2 style={h2}>Requests Sent</h2>
                {sent.length === 0 ? (
                  <p style={{ margin: 0 }}>No sent requests.</p>
                ) : (
                  <ul style={list}>
                    {sent.map((c) => (
                      <li key={c.id} className="conn-item" style={{ ...pill('#f8f6fc', '#e7e2f0') }}>
                        <div>
                          <strong style={{ cursor:'pointer' }} onClick={() => openQuick(c.other)}>{c.other?.name || 'User'}</strong>
                          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Awaiting response</div>
                          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            {[c.other?.postcode, c.other?.location].filter(Boolean).join(' · ')}
                          </div>
                          {Array.isArray(c.other?.interests) && c.other.interests.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {c.other.interests.slice(0, 3).map((t) => (
                                <span key={t} style={{ background: '#ede8f7', color: '#5a3c91', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', marginRight: 6 }}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="conn-actions">
                          <button onClick={() => actOn(c.id, 'withdraw')} style={btn('#ef4444')}>Withdraw</button>
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
                  {recs.map((r) => {
                    const edge = findPendingEdge(r.user.record_id);
                    const mine = edge && edge.requester === me?.record_id;
                    return (
                      <li key={r.user.record_id} className="conn-item" style={{ ...pill('#eefcf3', '#bbf7d0') }}>
                        <div>
                          <strong style={{ cursor:'pointer' }} onClick={() => openQuick(r.user)}>{r.user.name || 'User'}</strong>
                          <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            {[r.user.postcode, r.user.location].filter(Boolean).join(' · ')}
                          </div>
                          <div style={{ marginTop: 6 }}>
                            {(r.reasons || []).map((t) => (
                              <span key={t} style={{ background: '#dcfce7', color: '#065f46', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', marginRight: 6 }}>{t}</span>
                            ))}
                          </div>
                        </div>
                        {edge ? (
                          mine ? (
                            <div className="conn-actions">
                              <span className="chip" style={{ background:'#dcfce7', color:'#065f46' }}>Pending</span>
                              <button onClick={() => actOn(edge.id, 'withdraw')} style={btn('#ef4444')}>Withdraw</button>
                            </div>
                          ) : (
                            <Link href="/connections" className="chip" style={{ textDecoration:'none', background:'#fef9c3', color:'#92400e' }}>Review request</Link>
                          )
                        ) : (
                          <button onClick={() => request(r.user.record_id)} style={btn('#16a34a')}>Say Salams</button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <>
                  <h3 style={{ color: '#5a3c91', marginTop: '0.25rem' }}>Discover People</h3>
                  {discover.length === 0 ? (
                    <p style={{ margin: 0 }}>No suggestions right now.</p>
                  ) : (
                    <ul style={list}>
                      {discover.map((u) => {
                        const edge = findPendingEdge(u.record_id);
                        const mine = edge && edge.requester === me?.record_id;
                        return (
                          <li key={u.record_id} className="conn-item" style={{ ...pill('#f1ecfb', '#e0d8f3') }}>
                            <div>
                              <strong style={{ cursor:'pointer' }} onClick={() => openQuick(u)}>{u.name || 'User'}</strong>
                              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                                {[u.postcode, u.location].filter(Boolean).join(' · ')}
                              </div>
                              {Array.isArray(u.interests) && u.interests.length > 0 && (
                                <div style={{ marginTop: 6 }}>
                                  {u.interests.slice(0, 3).map((t) => (
                                    <span key={t} style={{ background: '#ede8f7', color: '#5a3c91', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', marginRight: 6 }}>{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {edge ? (
                              mine ? (
                                <div className="conn-actions">
                                  <span className="chip">Pending</span>
                                  <button onClick={() => actOn(edge.id, 'withdraw')} style={btn('#ef4444')}>Withdraw</button>
                                </div>
                              ) : (
                                <Link href="/connections" className="chip" style={{ textDecoration:'none' }}>Review request</Link>
                              )
                            ) : (
                              <button onClick={() => request(u.record_id)} style={btn('#6e5084')}>Say Salams</button>
                            )}
                          </li>
                        );
                      })}
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
      {quick && (
        <QuickProfile
          data={quick}
          onClose={() => setQuick(null)}
          onAction={(arg1, action) => {
            if (action === 'connect') return request(arg1);
            return actOn(arg1, action);
          }}
        />
      )}
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

// Lightweight quick profile overlay
function QuickProfile({ data, onClose, onAction }) {
  const [showPhoto, setShowPhoto] = useState(false);
  if (!data) return null;
  const { user, edge, mine, status } = data;
  const initials = (n) => {
    const parts = String(n || '').trim().split(/\s+/).slice(0,2);
    return parts.map(p=>p[0]?.toUpperCase()||'').join('');
  };
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div onClick={(e)=>e.stopPropagation()} style={{ background:'#fff', borderRadius:12, padding:'1rem', maxWidth:420, width:'100%', boxShadow:'0 10px 28px rgba(0,0,0,0.25)' }}>
        {/* Photo */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
          {user?.image_url ? (
            <div style={{ position:'relative', width:96, height:96 }}>
              <Image
                src={user.image_url}
                alt={user?.name || 'Profile photo'}
                fill
                sizes="96px"
                style={{ objectFit:'cover', borderRadius: '9999px', cursor:'pointer' }}
                onClick={() => setShowPhoto(true)}
              />
            </div>
          ) : (
            <div style={{ width:96, height:96, borderRadius:'9999px', background:'#e7e2f0', color:'#6e5084', display:'grid', placeItems:'center', fontWeight:800, fontSize:'1.4rem' }}>
              {initials(user?.name)}
            </div>
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <h3 style={{ margin:0, color:'#6e5084' }}>{user?.name || 'User'}</h3>
          <button onClick={onClose} style={{ background:'transparent', border:'none', fontSize:'1.2rem', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ color:'#666', marginBottom:8 }}>
          {[user?.postcode, user?.location].filter(Boolean).join(' · ')}
        </div>
        {Array.isArray(user?.interests) && user.interests.length > 0 && (
          <div style={{ marginBottom:12, display:'flex', gap:6, flexWrap:'wrap' }}>
            {user.interests.slice(0,6).map(t => (<span key={t} className="chip">{t}</span>))}
          </div>
        )}
        <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'space-between' }}>
          <Link href={`/profile/${encodeURIComponent(user.record_id)}`} style={{ color:'#6e5084', fontWeight:800, textDecoration:'none' }}>View Profile</Link>
          <div style={{ display:'flex', gap:6 }}>
            {status === 'accepted' ? (
              <span className="chip" style={{ background:'#e8faf0', color:'#166534' }}>Connected</span>
            ) : status === 'pending-out' ? (
              <>
                <span className="chip" style={{ background:'#fef3c7', color:'#92400e' }}>Pending</span>
                <button onClick={() => onAction(edge.id, 'withdraw')} style={btn('#ef4444')}>Withdraw</button>
              </>
            ) : status === 'pending-in' ? (
              <>
                <button onClick={() => onAction(edge.id, 'accept')} style={btn('#16a34a')}>Accept</button>
                <button onClick={() => onAction(edge.id, 'decline')} style={btn('#ef4444')}>Decline</button>
              </>
            ) : (
              <button onClick={() => onAction(user.record_id, 'connect')} style={btn('#6e5084')}>Say Salams</button>
            )}
          </div>
        </div>
        {showPhoto && (
          <div onClick={()=>setShowPhoto(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
            <div onClick={(e)=>e.stopPropagation()} style={{ position:'relative', maxWidth:'90vw', maxHeight:'85vh' }}>
              <button onClick={()=>setShowPhoto(false)} aria-label="Close" style={{ position:'absolute', top:-8, right:-8, background:'#000', color:'#fff', border:'none', borderRadius:'9999px', width:32, height:32, fontSize:'1.1rem', cursor:'pointer', lineHeight:1 }}>×</button>
              {user?.image_url ? (
                <img src={user.image_url} alt={user?.name || 'Profile photo'} style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:12, display:'block' }} />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
