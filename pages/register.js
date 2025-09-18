import { SignUp } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/layout';

export default function RegisterPage() {
  const router = useRouter();

  const normalizePath = (val) => {
    if (!val) return '/profile';
    try {
      if (typeof val === 'string' && /^https?:\/\//i.test(val)) {
        const u = new URL(val);
        return u.pathname + (u.search || '');
      }
    } catch {}
    return String(val);
  };

  // Prefer explicit `next`, else try to unwrap redirect_url if it points to /sign-up?redirect=...
  const rawNext = router.query.next || router.query.dest || router.query.to || null;
  const fallback = router.query.redirect_url || router.query.redirect || router.query.redirectUrl || '/profile';

  let next = normalizePath(String(rawNext || ''));
  if (!rawNext) {
    const f = normalizePath(String(fallback));
    try {
      const u = new URL(f, 'https://dummy.local');
      if (u.pathname.startsWith('/sign-up')) {
        const inner = u.searchParams.get('redirect');
        next = normalizePath(inner || '/profile');
      } else {
        next = f;
      }
    } catch {
      next = f;
    }
  }

  // After Clerk account creation, complete in-app profile, then go to `next`
  const afterUrl = `/sign-up?next=${encodeURIComponent(next)}`;
  const signInHref = `/sign-in?next=${encodeURIComponent(next)}`;

  return (
    <Layout>
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg)',
        padding: '1.5rem 1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.25rem',
          margin: '0 auto',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => router.back()} aria-label="Go back" style={{ background:'var(--surface-2)', color:'var(--accent)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'0.4rem 0.7rem', fontWeight:700, cursor:'pointer' }}>← Back</button>
        </div>
        <div
          className="auth-card"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(17,17,17,0.08)',
            padding: '1.1rem',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.25rem',
            width: '100%',
            maxWidth: 420,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'none', borderRight: '1px solid var(--border-soft)', paddingRight: '1rem' }} className="signup-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src="/icons/logo.svg" alt="Say Salams" width={180} height={60} className="logo" style={{ objectFit: 'contain' }} sizes="180px" />
            </div>
            <h1 style={{ color: 'var(--accent)', margin: '1rem 0 0.25rem' }}>Create your account</h1>
            <p style={{ color: 'var(--accent)', margin: 0 }}>Community · Connections · Celebration</p>
            <ul style={{ marginTop: '1rem', color: 'var(--accent)', fontWeight: 600 }}>
              <li>Discover upcoming Muslim events</li>
              <li>Build your circle with intention</li>
              <li>Spread peace — Say Salams ✨</li>
            </ul>
            <p style={{ marginTop: 'auto', fontSize: '0.9rem', color: 'var(--muted-2)' }}>
              Already have an account?{' '}
              <Link href={signInHref} style={{ color: 'var(--accent)', fontWeight: 700 }}>Sign in</Link>
            </p>
          </div>
          <div style={{ display: 'grid', placeItems: 'center', padding: '0.75rem', width: '100%' }}>
            <div style={{ width: '100%', maxWidth: 360 }}>
              <SignUp
                routing="virtual"
                signInUrl={signInHref}
                // After Clerk sign-up, send users to our app sign-up page to finish profile
                redirectUrl={afterUrl}
                afterSignUpUrl={afterUrl}
                appearance={{ variables: { colorPrimary: '#111111', colorText: '#111111', colorBackground: 'white' } }}
              />
            </div>
          </div>
        </div>
        <style jsx>{`
          @media (min-width: 860px) {
            .signup-left { display: block; }
            .auth-card { grid-template-columns: 1fr 1fr; }
          }
        `}</style>
      </div>
    </div>
    </Layout>
  );
}
