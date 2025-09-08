


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

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function ProfilePage({ user, rsvps, recordId }) {
  if (!user) {
    return (
      <div style={containerStyle}>
        <h2>User not found</h2>
        <p>Sorry, we couldn&apos;t find that user profile.</p>
      </div>
    );
  }
  const { isSignedIn } = useUser();
  const [connStatus, setConnStatus] = useState('idle');

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
      setConnStatus((data?.status || 'Pending').toLowerCase());
    } catch (e) {
      alert(e.message || 'Failed to send request');
      setConnStatus('idle');
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{marginBottom: "1rem"}}>Profile</h1>
      <div style={{ marginBottom: '1rem' }}>
        {connStatus === 'accepted' ? (
          <span style={{ background:'#e8faf0', color:'#166534', padding:'0.4rem 0.7rem', borderRadius:8, fontWeight:600 }}>Connected</span>
        ) : connStatus === 'pending' ? (
          <span style={{ background:'#fef3c7', color:'#92400e', padding:'0.4rem 0.7rem', borderRadius:8, fontWeight:600 }}>Request sent</span>
        ) : (
          <button onClick={requestConnection} style={{ background:'#6e5084', color:'#fff', border:'none', borderRadius:8, padding:'0.5rem 1rem', fontWeight:600, cursor:'pointer' }}>
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
          <span style={labelStyle}>Email:</span>
          <span>{user.email || "N/A"}</span>
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
