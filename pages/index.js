export async function getServerSideProps(context) {
  const proto = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/events`);
  const data = await res.json();
  return { props: { events: data.events || [] } };
}

export default function Home({ events }) {
  return (
    <div className="container">
      <h1>Say Salams</h1>
      <p className="meta">Discover Muslim-friendly events near you</p>
      <div className="grid">
        {events.map(ev => (
          <article className="card" key={ev.id}>
            {ev.image_url ? <img src={ev.image_url} alt={ev.title} /> : null}
            <div className="pad">
              <h3>{ev.title}</h3>
              <p className="meta">
                {ev.start_at ? new Date(ev.start_at).toLocaleString() : 'TBA'}
                {ev.suburb ? ` · ${ev.suburb}` : ''}{ev.city ? `, ${ev.city}` : ''}
              </p>
              <div className="row" style={{margin:'8px 0'}}>
                {(ev.tags || []).slice(0,3).map(t => <span className="badge" key={t}>{t}</span>)}
              </div>
              <p className="meta"><span className="count">👍 {ev.going_count ?? 0}</span> going</p>
              <div className="row">
                {ev.tickets_url && <a className="btn" href={ev.tickets_url} target="_blank" rel="noreferrer">Tickets</a>}
                <a className="btn" href={`/event/${encodeURIComponent(ev.public_id)}`}>Details</a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}