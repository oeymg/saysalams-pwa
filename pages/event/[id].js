// pages/event/[id].js

import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import Layout from '../../components/layout';

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
  const { user, isSignedIn } = useUser();
  const [saving, setSaving] = useState(false);

  if (!ev) {
    return (
      <Layout>
        <div className="container" style={{ padding: '2rem' }}>
          <p>Event not found.</p>
        </div>
      </Layout>
    );
  }

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(showToast?._t);
    showToast._t = window.setTimeout(() => setToast(null), 2400);
  };

  const handleRSVP = async () => {
    if (!isSignedIn) {
      showToast('Please sign in to RSVP.', 'error');
      return;
    }
    try {
      setSaving(true);
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          eventId: ev.public_id,
          status: 'Going',
        }),
      });
      if (response.ok) {
        showToast('RSVP saved! 👍', 'success');
      } else {
        showToast('Failed to save RSVP.', 'error');
      }
    } catch (error) {
      showToast('Failed to save RSVP.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
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
        {ev.summary && (
          <>
            <h2 style={{ marginBottom: '0.5rem', color: '#5a3c91' }}>Event Summary</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '2rem', color: '#333' }}>
              {typeof ev.summary === 'string' ? ev.summary : (ev.summary?.value || '')}
            </p>
          </>
        )}

        {/* Full Description */}
        {ev.description && (
          <>
            <h2 style={{ marginBottom: '0.5rem', color: '#5a3c91' }}>About This Event</h2>
            <p style={{ lineHeight: '1.7', marginBottom: '2rem', color: '#333' }}>
              {ev.description}
            </p>
          </>
        )}

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

          <button
            onClick={handleRSVP}
            style={{
              background: '#ede8f7',
              color: '#5a3c91',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
            }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'RSVP'}
          </button>

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

        {/* Details list */}
        <div style={{ marginTop: '2rem', display: 'grid', gap: '0.5rem' }}>
          {(ev.cost || ev.audience) && (
            <div style={{ background: '#f6f0ff', padding: '0.75rem 1rem', borderRadius: 8 }}>
              {ev.cost && (
                <div style={{ color: '#4f3a76' }}><strong>Cost:</strong> {ev.cost}</div>
              )}
              {ev.audience && (
                <div style={{ color: '#4f3a76' }}><strong>Audience:</strong> {ev.audience}</div>
              )}
            </div>
          )}
          {ev.halal_notes && (
            <div style={{ background: '#eefcf3', padding: '0.75rem 1rem', borderRadius: 8, color: '#065f46' }}>
              <strong>Halal Notes:</strong> {ev.halal_notes}
            </div>
          )}
        </div>
      </div>
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
