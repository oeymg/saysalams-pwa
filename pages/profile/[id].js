


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

export default function ProfilePage({ user, rsvps }) {
  if (!user) {
    return (
      <div style={containerStyle}>
        <h2>User not found</h2>
        <p>Sorry, we couldn&apos;t find that user profile.</p>
      </div>
    );
  }
  return (
    <div style={containerStyle}>
      <h1 style={{marginBottom: "1rem"}}>Profile</h1>
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
