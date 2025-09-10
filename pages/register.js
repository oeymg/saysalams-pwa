import { SignUp } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const incoming = router.query.redirect_url || router.query.redirect || router.query.redirectUrl || '/profile';
  const afterUrl = `/sign-up?redirect=${encodeURIComponent(String(incoming))}`;
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(String(incoming))}`;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(180deg, #f6f4fa, #ede8f7)',
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
        <div
          className="auth-card"
          style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(110, 80, 132, 0.15)',
            padding: '1.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'none', borderRight: '1px solid #f0eaff', paddingRight: '1rem' }} className="signup-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Image src="/icons/longlogo.png" alt="Say Salams" width={160} height={60} />
            </div>
            <h1 style={{ color: '#6e5084', margin: '1rem 0 0.25rem' }}>Create your account</h1>
            <p style={{ color: '#5a3c91', margin: 0 }}>Community · Connections · Celebration</p>
            <ul style={{ marginTop: '1rem', color: '#6e5084', fontWeight: 600 }}>
              <li>Discover upcoming Muslim events</li>
              <li>Build your circle with intention</li>
              <li>Spread peace — Say Salams ✨</li>
            </ul>
            <p style={{ marginTop: 'auto', fontSize: '0.9rem', color: '#888' }}>
              Already have an account?{' '}
              <Link href={signInHref} style={{ color: '#6e5084', fontWeight: 700 }}>Sign in</Link>
            </p>
          </div>
          <div style={{ display: 'grid', placeItems: 'center', padding: '1rem' }}>
            <SignUp
              path="/register"
              routing="path"
              signInUrl={signInHref}
              // After Clerk sign-up, send users to our app sign-up page to finish profile
              redirectUrl={afterUrl}
              afterSignUpUrl={afterUrl}
              appearance={{ variables: { colorPrimary: '#6e5084', colorBackground: 'white' } }}
            />
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
  );
}
