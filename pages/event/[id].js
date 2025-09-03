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
  if (!ev) return <div className="container"><p>Event not found.</p></div>;
  return (
    <div className="container">
      {ev.image_url ? <img src={ev.image_url} alt={ev.title} style={{width:'100%',borderRadius:12}}/> : null}
      <h1>{ev.title}</h1>
      <p className="meta">
        {ev.start_at ? new Date(ev.start_at).toLocaleString() : 'TBA'}
        {ev.venue ? ` · ${ev.venue}` : ''}
        {ev.suburb ? ` · ${ev.suburb}` : ''}{ev.city ? `, ${ev.city}` : ''}
      </p>
      {(ev.tags || []).length ? <p className="row">{ev.tags.map(t => <span className="badge" key={t}>{t}</span>)}</p> : null}
      {ev.halal_notes ? <p className="meta">{ev.halal_notes}</p> : null}
      <p className="meta"><strong>👍 {ev.going_count ?? 0}</strong> going</p>
      <div className="row" style={{marginTop:12}}>
        {ev.tickets_url && <a className="btn" href={ev.tickets_url} target="_blank" rel="noreferrer">Tickets</a>}
        {/* Optional RSVP via your Tally form */}
        {/* <a className="btn" href={`https://tally.so/r/YOUR_FORM_ID?event_id=${encodeURIComponent(ev.public_id)}&status=going`} target="_blank" rel="noreferrer">I’m Going</a> */}
      </div>
    </div>
  );
}