// components/Layout.js

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

export default function Layout({ children }) {
  const { isSignedIn } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
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
        className="nav-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
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
          className="nav-links desktop-only"
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <Link href="/events" style={{ color: '#6e5084', textDecoration: 'none', fontWeight: '600', fontSize: '1.3rem' }}>Events</Link>
          <Link href="/host" style={{ color: '#6e5084', textDecoration: 'none', fontWeight: '600', fontSize: '1.3rem' }}>Host</Link>
          <Link href="/faq" style={{ color: '#6e5084', textDecoration: 'none', fontWeight: '600', fontSize: '1.3rem' }}>FAQ</Link>
          <Link href="/connections" style={{ color: '#6e5084', textDecoration: 'none', fontWeight: '600', fontSize: '1.3rem' }}>Connections</Link>
          <Link href="/profile" style={{ color: '#6e5084', textDecoration: 'none', fontWeight: '600', fontSize: '1.3rem' }}>Profile</Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="mobile-only"
          aria-label="Open menu"
          aria-controls="mobile-menu"
          aria-expanded={mobileOpen ? 'true' : 'false'}
          onClick={() => setMobileOpen(v => !v)}
          style={{
            background: '#f6f4fa',
            color: '#6e5084',
            border: '1px solid #ded7ef',
            borderRadius: 8,
            padding: '0.5rem 0.8rem',
            fontWeight: 700,
            display: 'none', // hidden on desktop; shown via CSS on mobile
          }}
        >
          ☰ Menu
        </button>

        {/* CTA */}
        <div className="cta" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" userProfileUrl="/profile" />
          ) : (
            <SignInButton mode="modal">
              <button
                style={{
                  background: '#6e5084',
                  color: '#fff',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Join Us
              </button>
            </SignInButton>
          )}
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="mobile-only hover-pop"
          style={{
            background: '#fff',
            margin: '0.5rem 1rem 0',
            border: '1px solid #eee',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            padding: '0.5rem',
          }}
        >
          <div style={{ display: 'grid', gap: '0.25rem' }} onClick={() => setMobileOpen(false)}>
            <Link href="/events" style={{ padding: '0.75rem', color: '#6e5084', textDecoration: 'none', fontWeight: 700 }}>Events</Link>
            <Link href="/host" style={{ padding: '0.75rem', color: '#6e5084', textDecoration: 'none', fontWeight: 700 }}>Host</Link>
            <Link href="/faq" style={{ padding: '0.75rem', color: '#6e5084', textDecoration: 'none', fontWeight: 700 }}>FAQ</Link>
            <Link href="/connections" style={{ padding: '0.75rem', color: '#6e5084', textDecoration: 'none', fontWeight: 700 }}>Connections</Link>
            <Link href="/profile" style={{ padding: '0.75rem', color: '#6e5084', textDecoration: 'none', fontWeight: 700 }}>Profile</Link>
          </div>
        </div>
      )}

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
