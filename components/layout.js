// components/Layout.js

import Image from 'next/image';
import Link from 'next/link';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

export default function Layout({ children }) {
  const { isSignedIn } = useUser();
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
        className="nav-bar"
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
          className="nav-links"
        >
          <Link href="/events" style={{ color: '#6e5084', textDecoration: 'none', fontWeight: '600', fontSize: '1.3rem' }}>Events</Link>
          <Link href="/host" style={{ color: '#6e5084', textDecoration: 'none', fontWeight: '600', fontSize: '1.3rem' }}>Host</Link>
          <Link href="/faq" style={{ color: '#6e5084', textDecoration: 'none', fontWeight: '600', fontSize: '1.3rem' }}>FAQ</Link>
        </div>

        {/* CTA */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }} className="cta">
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" userProfileUrl="/profile" userProfileMode="navigation" />
          ) : (
            <SignInButton mode="modal">
              <button
                style={{
                  background: 'linear-gradient(90deg, #6e5084, #6e5065)',
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
          <Link
            href="/profile"
            className="profile-link"
            style={{
              background: '#ede8f7',
              color: '#5a3c91',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              border: '1px solid #d9d6e3',
              fontSize: '1.0rem',
              display: 'inline-block',
            }}
          >
            My Profile
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
