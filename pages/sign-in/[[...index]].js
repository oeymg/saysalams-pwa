import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../components/layout';

export default function SignInCatchAll() {
  const router = useRouter();

  const raw = router.query.next || router.query.redirect_url || router.query.redirect || router.query.redirectUrl || '/profile';

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

  // Final destination after auth
  const dest = normalizePath(raw);

  // If the destination itself is /sign-up?redirect=..., extract final target for our register link
  const deriveNext = (val) => {
    try {
      const u = new URL(val, 'https://dummy.local');
      if (u.pathname.startsWith('/sign-up')) {
        const inner = u.searchParams.get('next') || u.searchParams.get('redirect');
        if (inner) return normalizePath(inner);
        return '/profile';
      }
    } catch {}
    return normalizePath(val);
  };

  const next = deriveNext(dest);

  const redirectUrl = dest; // where Clerk sends users after sign-in
  const signUpHref = `/register?next=${encodeURIComponent(next)}`;

  return (
    <Layout>
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg)',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 980,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
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
            boxShadow: '0 10px 30px rgba(110, 80, 132, 0.15)',
            padding: '1.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'none', borderRight: '1px solid var(--border-soft)', paddingRight: '1rem' }} className="signin-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Image src="/logo.png" alt="Say Salams" width={180} height={60} className="logo" style={{ objectFit: 'contain' }} sizes="180px" />
            </div>
            <h1 style={{ color: 'var(--accent)', margin: '1rem 0 0.25rem' }}>Welcome back</h1>
            <p style={{ color: 'var(--accent)', margin: 0 }}>Community · Connections · Celebration</p>
            <ul style={{ marginTop: '1rem', color: 'var(--accent)', fontWeight: 600 }}>
              <li>Discover upcoming Muslim events</li>
              <li>Build your circle with intention</li>
              <li>Spread peace — Say Salams ✨</li>
            </ul>
            <p style={{ marginTop: 'auto', fontSize: '0.9rem', color: 'var(--muted-2)' }}>
              New here? <Link href={signUpHref} style={{ color: '#9b8bbd', fontWeight: 700 }}>Create an account</Link>
            </p>
          </div>
          <div style={{ display: 'grid', placeItems: 'center', padding: '1rem' }}>
            <SignIn
              path="/sign-in"
              routing="path"
              // Send users who choose "Sign up" to our Clerk SignUp page at /register
              signUpUrl={signUpHref}
              // Redirect signed-in users to their intended destination
              redirectUrl={redirectUrl}
              afterSignInUrl={redirectUrl}
              appearance={{ variables: { colorPrimary: '#6e5084', colorBackground: 'white' } }}
            />
          </div>
        </div>
        <style jsx>{`
          @media (min-width: 860px) {
            .signin-left { display: block; }
            .auth-card { grid-template-columns: 1fr 1fr; }
          }
        `}</style>
      </div>
    </div>
    </Layout>
  );
}
