// pages/event/[id].js

import Image from 'next/image';

export async function getServerSideProps(context) {
  const id = context.params.id;
  const proto = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/events`);
  const data = await res.json();
  const ev = (data.events || []).find(e => e.public_id === id) || null;
  return { props: { ev } };
}

export default function EventPage({ ev }) {
  if (!ev) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <p>Event not found.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Event image */}
      {ev.image_url && (
        <Image
          src={ev.image_url}
          alt={ev.title}
          width={900}
          height={400}
          style={{
            width: '100%',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            maxHeight: '400px',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Title */}
      <h1 style={{ color: '#6a4caf', marginBottom: '0.5rem' }}>{ev.title}</h1>

      {/* Meta info */}
      <p style={{ color: '#555', marginBottom: '1rem' }}>
        {ev.start_at ? new Date(ev.start_at).toLocaleString('en-AU') : 'TBA'}
        {ev.venue ? ` · ${ev.venue}` : ''}
        {ev.suburb ? ` · ${ev.suburb}` : ''}
        {ev.city ? `, ${ev.city}` : ''}
      </p>

      {/* Tags */}
      {(ev.tags || []).length > 0 && (
        <p style={{ marginBottom: '1rem' }}>
          {ev.tags.map((t) => (
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
        </p>
      )}

      {/* Halal Notes (if exists) */}
      {ev.halal_notes && (
        <p style={{ color: '#777', fontStyle: 'italic', marginBottom: '1rem' }}>
          {ev.halal_notes}
        </p>
      )}

      {/* Going count */}
      <p style={{ marginBottom: '1.5rem', color: '#444' }}>
        <strong>👍 {ev.going_count ?? 0}</strong> going
      </p>

      {/* AI Event Summary */}
      <h2 style={{ marginBottom: '0.5rem', color: '#5a3c91' }}>Event Summary</h2>
      <p style={{ lineHeight: '1.6', marginBottom: '2rem', color: '#333' }}>
        {(() => {
          console.log("Summary:", ev.summary);
          const summary = ev.summary;
          if (summary && typeof summary === 'string' && summary.trim().length > 0) {
            return summary;
          }
          return 'Details coming soon ✨';
        })()}
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {ev.tickets_url && (
          <a
            href={ev.tickets_url}
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#6a4caf',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Tickets
          </a>
        )}

        {/* Example RSVP (optional later) */}
        {/* <a
          href={`https://tally.so/r/YOUR_FORM_ID?event_id=${encodeURIComponent(ev.public_id)}&status=going`}
          target="_blank"
          rel="noreferrer"
          style={{
            background: '#ede8f7',
            color: '#5a3c91',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
          }}
        >
          I&apos;m Going
        </a> */}
      </div>
    </div>
  );
}