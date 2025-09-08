import Layout from "../../components/layout";
import { getAuth } from "@clerk/nextjs/server";

export async function getServerSideProps(context) {
  const { userId: clerkId } = getAuth(context.req);

  if (!clerkId) {
    return { redirect: { destination: "/sign-in?redirect_url=/profile", permanent: false } };
  }

  const proto = context.req.headers["x-forwarded-proto"] || "http";
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;

  // Fetch user by ClerkID for accuracy and speed
  const usersRes = await fetch(`${base}/api/users?clerkId=${encodeURIComponent(clerkId)}`);
  const usersJson = await usersRes.json();
  const user = usersJson?.user || null;
  if (!user) return { redirect: { destination: "/sign-up", permanent: false } };

  // Fetch RSVPs for this user by canonical UserID (e.g., USR_xxx)
  const rsvpRes = await fetch(`${base}/api/rsvp?userId=${encodeURIComponent(user.id)}`);
  const rsvpJson = await rsvpRes.json();
  const rsvps = rsvpJson?.rsvps || [];

  // Fetch events to enrich RSVP rows
  const evRes = await fetch(`${base}/api/events`);
  const evJson = await evRes.json();
  const events = evJson?.events || [];
  const eventsById = Object.fromEntries(events.map((e) => [e.public_id || e.id, e]));

  // Normalize RSVP rows
  const rows = rsvps.map((r) => {
    // Always use text EventID stored in RSVPs
    const eventId = typeof r?.fields?.["EventID"] === 'string' ? r.fields["EventID"] : null;
    const ev = eventId ? eventsById[eventId] : null;
    return {
      id: r.id,
      eventId: eventId,
      status: r?.fields?.Status || "Unknown",
      eventName: ev?.title || "Untitled",
      eventDate: ev?.start_at || null,
    };
  });

  return { props: { user, rows } };
}

const card = {
  maxWidth: "900px",
  margin: "2rem auto",
  padding: "1.5rem",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
};

export default function ProfilePage({ user, rows }) {
  const [toast, setToast] = useState(null);
  const [cons, setCons] = useState({ accepted: [], pending: [] });
  const [loadingCons, setLoadingCons] = useState(false);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2400);
  };
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCons(true);
        const acc = await fetch('/api/connections?status=Accepted').then(r=>r.json());
        const pen = await fetch('/api/connections?status=Pending').then(r=>r.json());
        setCons({ accepted: acc?.connections || [], pending: pen?.connections || [] });
      } catch (_) {
      } finally {
        setLoadingCons(false);
      }
    };
    load();
  }, []);

  const actOn = async (id, action) => {
    try {
      const res = await fetch('/api/connections', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action })});
      if (!res.ok) throw new Error('Failed to update connection');
      const acc = await fetch('/api/connections?status=Accepted').then(r=>r.json());
      const pen = await fetch('/api/connections?status=Pending').then(r=>r.json());
      setCons({ accepted: acc?.connections || [], pending: pen?.connections || [] });
    } catch (e) {
      showToast(e.message || 'Update failed', 'error');
    }
  };

  return (
    <Layout>
      <div style={card}>
        <h1 style={{ color: "#6e5084", marginBottom: "1rem" }}>My Profile</h1>
        {/* All fields required on sign-up; no completion banner needed */}

        {/* Key Information */}
        <section style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <Info label="Full Name" value={user.name || "N/A"} />
            <Info label="Email" value={user.email || "N/A"} />
            <Info label="Location" value={user.location || "N/A"} />
            <Info label="Interests" value={(user.interests || []).join(", ") || "N/A"} />
            <Info label="Type" value={user.type || "N/A"} />
            <Info label="How Heard About" value={user.heard_about || "N/A"} />
            <Info label="Member Since" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"} />
          </div>
        </section>
        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ color: '#6e5084', marginBottom: '0.75rem' }}>Connections</h2>
          {loadingCons ? (
            <p>Loading connections…</p>
          ) : (
            <div style={{ display:'grid', gap:'1rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.5rem', color:'#5a3c91' }}>Accepted</h3>
                {cons.accepted.length === 0 ? (
                  <p style={{ margin:0 }}>No connections yet.</p>
                ) : (
                  <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                    {cons.accepted.map(c => (
                      <li key={c.id} style={{ background:'#f8f6fc', border:'1px solid #e7e2f0', borderRadius:8, padding:'0.6rem 0.8rem' }}>
                        <strong>{c.other?.name || 'User'}</strong>
                        <span style={{ color:'#666' }}> {c.other?.email ? `· ${c.other.email}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 style={{ marginBottom: '0.5rem', color:'#5a3c91' }}>Requests</h3>
                {cons.pending.length === 0 ? (
                  <p style={{ margin:0 }}>No pending requests.</p>
                ) : (
                  <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                    {cons.pending.map(c => (
                      <li key={c.id} style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'0.6rem 0.8rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span>
                          <strong>{c.other?.name || 'User'}</strong>
                          <span style={{ color:'#92400e' }}>  · Pending</span>
                        </span>
                        <span style={{ display:'flex', gap:'0.5rem' }}>
                          <button onClick={() => actOn(c.id,'accept')} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:6, padding:'0.35rem 0.6rem', cursor:'pointer' }}>Accept</button>
                          <button onClick={() => actOn(c.id,'decline')} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:6, padding:'0.35rem 0.6rem', cursor:'pointer' }}>Decline</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>

        {/* RSVPs Table */}
        <section>
          <h2 style={{ color: "#6e5084", marginBottom: "0.75rem" }}>My RSVPs</h2>
          {rows.length === 0 ? (
            <p style={{ margin: 0 }}>No RSVPs yet.</p>
          ) : (
            <RSVPTable rows={rows} userId={user.record_id} onToast={showToast} />)
          }
        </section>
      </div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </Layout>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ flex: "1 1 250px", background: "#f8f6fc", padding: "0.75rem 1rem", borderRadius: 8 }}>
      <div style={{ color: "#6e5084", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#333" }}>{value}</div>
    </div>
  );
}

import { useState, useEffect } from "react";

function RSVPTable({ rows, userId, onToast }) {
  const [data, setData] = useState(rows);
  const [saving, setSaving] = useState(null); // eventId being saved
  const statuses = ["Going", "Interested", "Not Going"]; // tweak as needed

  const onChange = (eventId, value) => {
    setData((prev) => prev.map((r) => (r.eventId === eventId ? { ...r, status: value } : r)));
  };

  const onSave = async (eventId) => {
    const row = data.find((r) => r.eventId === eventId);
    if (!row) return;
    setSaving(eventId);
    try {
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, eventId, status: row.status }),
      });
      if (!res.ok) throw new Error("Failed to update RSVP");
      onToast && onToast("RSVP saved ✅", "success");
    } catch (e) {
      onToast && onToast(e.message || "Failed to update RSVP", "error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, overflow: "hidden" }}>
        <thead>
          <tr style={{ textAlign: "left", background: "#f1ecfb", color: "#4f3a76" }}>
            <th style={{ padding: "0.75rem" }}>Event</th>
            <th style={{ padding: "0.75rem" }}>Date</th>
            <th style={{ padding: "0.75rem" }}>Status</th>
            <th style={{ padding: "0.75rem" }}></th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, idx) => (
            <tr key={r.eventId} style={{ background: idx % 2 ? "#faf7ff" : "#fff", borderTop: "1px solid #eee" }}>
              <td style={{ padding: "0.75rem" }}>{r.eventName}</td>
              <td style={{ padding: "0.75rem" }}>{r.eventDate ? new Date(r.eventDate).toLocaleString("en-AU") : "TBA"}</td>
              <td style={{ padding: "0.75rem", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                  background: r.status === 'Going' ? '#6e5084' : r.status === 'Interested' ? '#f59e0b' : '#9ca3af'
                }} />
                <select
                  value={r.status}
                  onChange={(e) => onChange(r.eventId, e.target.value)}
                  style={{ padding: "0.35rem 0.5rem", borderRadius: 6, border: "1px solid #d9d6e3", background: '#fff' }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "0.75rem" }}>
                <button
                  onClick={() => onSave(r.eventId)}
                  disabled={saving === r.eventId}
                  style={{
                    background: "linear-gradient(90deg, #6e5084, #6e5065)",
                    color: "#fff",
                    padding: "0.45rem 0.9rem",
                    borderRadius: 8,
                    fontWeight: 600,
                    border: "none",
                    cursor: saving === r.eventId ? 'not-allowed' : 'pointer',
                    opacity: saving === r.eventId ? 0.8 : 1,
                  }}
                >
                  {saving === r.eventId ? "Saving..." : "Save"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Toast({ message, type = 'success', onClose }) {
  const bg = type === 'error' ? '#ef4444' : '#22c55e';
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', right: 16, bottom: 16, zIndex: 1000,
        background: bg, color: '#fff', padding: '0.75rem 1rem',
        borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        cursor: 'pointer',
      }}
    >
      {message}
    </div>
  );
}
