


import React from "react";

export async function getServerSideProps(context) {
  const { id } = context.query;
  // Fetch user info
  const userRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/users?id=${id}`);
  const userData = await userRes.json();
  // Fetch RSVPs
  const rsvpRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rsvp?userId=${id}`);
  const rsvpData = await rsvpRes.json();
  return {
    props: {
      user: userData?.user || null,
      rsvps: rsvpData?.rsvps || [],
      recordId: id || null,
    },
  };
}

const containerStyle = {
  maxWidth: "600px",
  margin: "2rem auto",
  padding: "2rem",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  fontFamily: "inherit",
};

const sectionStyle = {
  marginBottom: "2rem",
};

const labelStyle = {
  fontWeight: "bold",
  color: "#333",
  marginRight: "0.5rem",
};

const rsvpListStyle = {
  listStyle: "none",
  padding: 0,
};

const rsvpItemStyle = {
  padding: "0.75rem 1rem",
  marginBottom: "0.75rem",
  borderRadius: "8px",
  background: "#f3f3f3",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function ProfilePage({ user, rsvps, recordId }) {
  // Hooks must be called unconditionally at the top level
  const { isSignedIn, user: clerkUser } = useUser();
  const [connStatus, setConnStatus] = useState('idle');
  const [edge, setEdge] = useState(null); // current connection edge (if any)
  const [meRid, setMeRid] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!isSignedIn) return;
      try {
        // Get my Airtable record id
        const me = await fetch(`/api/users?clerkId=${encodeURIComponent(clerkUser?.id || '')}`).then(r=>r.json()).catch(()=>null);
        const my = me?.user || null;
        if (my?.record_id) setMeRid(my.record_id);
        // Load pending + accepted edges
        const [pen, acc] = await Promise.all([
          fetch('/api/connections?status=Pending').then(r=>r.json()).catch(()=>({})),
          fetch('/api/connections?status=Accepted').then(r=>r.json()).catch(()=>({})),
        ]);
        const pendingEdge = (pen?.connections || []).find(c => c?.other?.record_id === recordId) || null;
        if (pendingEdge) {
          setEdge(pendingEdge);
          const amRequester = pendingEdge.requester && my?.record_id && (pendingEdge.requester === my.record_id);
          setConnStatus(amRequester ? 'pending-out' : 'pending-in');
          return;
        }
        const acceptedEdge = (acc?.connections || []).find(c => c?.other?.record_id === recordId) || null;
        if (acceptedEdge) {
          setEdge(acceptedEdge);
          setConnStatus('accepted');
          return;
        }
        setConnStatus('none');
      } catch (_) {
        setConnStatus('none');
      }
    };
    load();
  }, [isSignedIn, recordId, clerkUser?.id]);

  if (!user) {
    return (
      <div style={containerStyle}>
        <h2>User not found</h2>
        <p>Sorry, we couldn&apos;t find that user profile.</p>
      </div>
    );
  }

  const requestConnection = async () => {
    if (!isSignedIn) {
      alert('Please sign in to connect.');
      return;
    }
    try {
      setConnStatus('loading');
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toRecordId: recordId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send request');
      setConnStatus('pending-out');
    } catch (e) {
      alert(e.message || 'Failed to send request');
      setConnStatus('idle');
    }
  };

  const actOn = async (action) => {
    if (!edge?.id) return;
    try {
      setConnStatus('loading');
      const res = await fetch('/api/connections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: edge.id, action }),
      });
      if (!res.ok) throw new Error('Failed to update');
      // Reload status
      const [pen, acc] = await Promise.all([
        fetch('/api/connections?status=Pending').then(r=>r.json()).catch(()=>({})),
        fetch('/api/connections?status=Accepted').then(r=>r.json()).catch(()=>({})),
      ]);
      const pendingEdge = (pen?.connections || []).find(c => c?.other?.record_id === recordId) || null;
      if (pendingEdge) {
        setEdge(pendingEdge);
        const amRequester = pendingEdge.requester && meRid && (pendingEdge.requester === meRid);
        setConnStatus(amRequester ? 'pending-out' : 'pending-in');
        return;
      }
      const acceptedEdge = (acc?.connections || []).find(c => c?.other?.record_id === recordId) || null;
      if (acceptedEdge) {
        setEdge(acceptedEdge);
        setConnStatus('accepted');
        return;
      }
      setEdge(null);
      setConnStatus('none');
    } catch (e) {
      alert(e.message || 'Update failed');
      setConnStatus('none');
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{marginBottom: "1rem"}}>Profile</h1>
      <div style={{ marginBottom: '1rem' }}>
        {connStatus === 'accepted' ? (
          <span style={{ background:'#e8faf0', color:'#166534', padding:'0.4rem 0.7rem', borderRadius:8, fontWeight:600 }}>Connected</span>
        ) : connStatus === 'pending-out' ? (
          <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
            <span style={{ background:'#fef3c7', color:'#92400e', padding:'0.4rem 0.7rem', borderRadius:8, fontWeight:600 }}>Request sent</span>
            <button onClick={() => actOn('withdraw')} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:8, padding:'0.4rem 0.7rem', fontWeight:600, cursor:'pointer' }}>Withdraw</button>
          </div>
        ) : connStatus === 'pending-in' ? (
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button onClick={() => actOn('accept')} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'0.4rem 0.7rem', fontWeight:600, cursor:'pointer' }}>Accept</button>
            <button onClick={() => actOn('decline')} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:8, padding:'0.4rem 0.7rem', fontWeight:600, cursor:'pointer' }}>Decline</button>
          </div>
        ) : (
          <button onClick={requestConnection} style={{ background:'#9b8bbd', color:'#fff', border:'none', borderRadius:8, padding:'0.5rem 1rem', fontWeight:600, cursor:'pointer' }}>
            Connect
          </button>
        )}
      </div>
      <section style={sectionStyle}>
        <div style={{marginBottom: "0.5rem"}}>
          <span style={labelStyle}>Name:</span>
          <span>{user.name || "N/A"}</span>
        </div>
        <div style={{marginBottom: "0.5rem"}}>
          <span style={labelStyle}>Postcode:</span>
          <span>{user.postcode || "N/A"}</span>
        </div>
        <div style={{marginBottom: "0.5rem"}}>
          <span style={labelStyle}>Location:</span>
          <span>{user.location || "N/A"}</span>
        </div>
        <div>
          <span style={labelStyle}>Interests:</span>
          <span>
            {Array.isArray(user.interests) && user.interests.length > 0
              ? user.interests.join(", ")
              : "N/A"}
          </span>
        </div>
      </section>
      <section>
        <h2 style={{marginBottom: "1rem"}}>My RSVPs</h2>
        {rsvps.length === 0 ? (
          <p>No RSVPs yet.</p>
        ) : (
          <ul style={rsvpListStyle}>
            {rsvps.map((rsvp) => (
              <li key={rsvp.id || rsvp.eventId} style={rsvpItemStyle}>
                <span>
                  <span style={labelStyle}>Event:</span>
                  {rsvp.eventName || "Untitled"}
                </span>
                <span>
                  <span style={labelStyle}>Status:</span>
                  {rsvp.status || "Unknown"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
