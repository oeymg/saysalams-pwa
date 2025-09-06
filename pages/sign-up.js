import Layout from '../components/layout';
import { useUser } from '@clerk/nextjs';
import { getAuth } from '@clerk/nextjs/server';
import { useMemo } from 'react';

export async function getServerSideProps(context) {
  const { userId } = getAuth(context.req);
  const proto = context.req.headers['x-forwarded-proto'] || 'http';
  const host = context.req.headers.host;
  const base = `${proto}://${host}`;

  if (!userId) {
    return { redirect: { destination: '/sign-in?redirect_url=/sign-up', permanent: false } };
  }

  try {
    const res = await fetch(`${base}/api/users`);
    const json = await res.json();
    const users = json?.users || [];
    const found = users.find((u) => u.clerk_id === userId);
    if (found) {
      return { redirect: { destination: '/profile', permanent: false } };
    }
  } catch (_) {}

  return { props: {} };
}

export default function Signup() {
  const { isSignedIn, user } = useUser();

  const embedUrl = useMemo(() => {
    const base = 'https://airtable.com/embed/app5sdftDqu5gpJBg/pag4I3x7P9cdYi0pl/form';
    if (!isSignedIn || !user) return base;
    const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ');
    const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '';
    const params = new URLSearchParams();
    // Prefill keys must use the exact field labels from the Airtable form
    params.set('prefill_ClerkID', user.id);
    if (fullName) params.set('prefill_Full Name', fullName);
    if (email) params.set('prefill_Email', email);
    // Hide ClerkID field; keep name/email visible for edits
    params.set('hide_ClerkID', 'true');
    // Airtable options for better embed UX
    params.set('backgroundColor', 'purple');
    params.set('viewControls', 'on');
    return `${base}?${params.toString()}`;
  }, [isSignedIn, user]);

  return (
    <Layout>
      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: '#6e5084' }}>Become a Say Salams user today!</h1>
      </div>
      <section style={{ backgroundColor: '#f6f4fa', padding: '0rem', textAlign: 'center' }}>
        <p style={{ color: '#6e5084', fontWeight: 'bold', marginBottom: '0rem' }}></p>
      </section>
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2rem',
          padding: '0rem',
          maxWidth: '1200px',
          margin: '0rem auto',
        }}
      >
        <div
          style={{
            flex: 0.8,
            maxWidth: '480px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(110, 80, 132, 0.15)',
            padding: '2rem',
            color: '#555',
            lineHeight: '1.6',
            fontSize: '1.1rem',
          }}
        >
          <h2 style={{ color: '#6e5084', marginBottom: '1rem', textAlign: 'center', flexWrap: 'wrap', fontSize: '1.8rem' }}>Why Say Salams? 🌙✨</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            <strong>🕌 Say Salams strives to serve a vibrant community dedicated to personal growth, connections, and spreading salam. Experience the <em>barakah</em> that comes from strengthening the Ummah through meaningful connections and shared Islamic values.
              Join us in fostering a supportive network that uplifts and inspires. 🤲</strong>
          </p>
          <ul style={{ paddingLeft: '1.25rem', color: '#6e5084', fontWeight: '600', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#6e5084' }}>Community 🤝:</span> Connect with like-minded individuals who share your values and vision.
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: '#6e5084' }}>Events 🗓️:</span> Discover and participate in meaningful events that enrich your spiritual and social life.
            </li>
            <li>
              <span style={{ color: '#6e5084' }}>Barakah ✨:</span> Gain blessings through building sincere and supportive relationships within the Ummah.
            </li>
          </ul>
        </div>
        <div style={{ flex: 1.2, minWidth: '300px' }}>
          <iframe
            src={embedUrl}
            frameBorder="0"
            style={{ background: 'transparent', border: 'none', width: '100%', height: '900px' }}
            title="Sign Up Form"
            allowFullScreen
          />
        </div>
      </section>
    </Layout>
  );
}
