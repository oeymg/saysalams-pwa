

// components/Layout.js

import Image from 'next/image';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div
      style={{
        background: '#f6f4fa',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Logo */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              src="/icons/longlogo.png"
              alt="Say Salams logo"
              width={160}
              height={60}
              style={{ height: 'auto', width: 'auto' }}
            />
          </Link>
        </div>

        {/* Nav Links */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <Link href="/events" style={{ color: '#6e5084', textDecoration: 'none' }}>Events</Link>
          <Link href="/host" style={{ color: '#6e5084', textDecoration: 'none' }}>Host</Link>
          <Link href="/faq" style={{ color: '#6e5084', textDecoration: 'none' }}>FAQ</Link>
        </div>

        {/* CTA */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href="/join"
            style={{
              background: 'linear-gradient(90deg, #6e5084, #6e5065)',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Join Us
          </Link>
        </div>
      </nav>

      {/* Page Content */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer */}
      <footer
        style={{
          background: '#6e5084',
          color: '#fff',
          textAlign: 'center',
          padding: '2rem 1rem',
          marginTop: '3rem',
        }}
      >
        <Image
          src="/icons/invertlogo.png"
          alt="Say Salams logo"
          width={180}
          height={60}
          style={{ margin: '0 auto 1rem auto', height: 'auto', width: 'auto' }}
        />
        <p style={{ margin: '0.3rem 0' }}>📍 Brisbane, QLD, 4000</p>
        <p style={{ margin: '0.3rem 0' }}>
          📧{' '}
          <a
            href="mailto:contact@saysalams.com"
            style={{ color: '#fff', textDecoration: 'underline' }}
          >
            contact@saysalams.com
          </a>
        </p>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
          © {new Date().getFullYear()} Say Salams. All rights reserved.
        </p>
      </footer>
    </div>
  );
}