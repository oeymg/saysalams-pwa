// components/Layout.js

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { UserButton, useUser } from '@clerk/nextjs';

export default function Layout({ children }) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ioRef = useRef(null);
  const bindReveals = () => {
    if (typeof window === 'undefined') return;
    const all = Array.from(document.querySelectorAll('[data-reveal], .reveal'));
    if (all.length === 0) return;
    all.forEach(el => el.classList.add('reveal'));

    if (!('IntersectionObserver' in window)) {
      all.forEach(el => el.classList.add('inview'));
      return;
    }

    if (!ioRef.current) {
      ioRef.current = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('inview');
            ioRef.current && ioRef.current.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    }
    const io = ioRef.current;
    all.forEach(el => io.observe(el));

    // Safety: if something remains hidden after 1.2s, show it
    setTimeout(() => {
      all.forEach(el => {
        if (!el.classList.contains('inview')) el.classList.add('inview');
      });
    }, 1200);
  };

  useEffect(() => { bindReveals(); }, []);
  useEffect(() => { bindReveals(); }, [router.asPath]);
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
              width={190}
              height={110}
              className="logo-img"
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
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <Link href="/events" legacyBehavior><a className="nav-pill">Events</a></Link>
          <Link href="/host" legacyBehavior><a className="nav-pill">Host</a></Link>
          <Link href={isSignedIn ? "/connections" : "/sign-in?next=/connections"} legacyBehavior>
            <a className="nav-pill">Connections</a>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="mobile-only mobile-hidden"
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
        <div className="cta" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
          {isSignedIn ? (
            <Link href="/profile" legacyBehavior><a className="nav-pill desktop-only">Profile</a></Link>
          ) : null}
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" userProfileUrl="/profile" />
          ) : (
            <Link href={`/register?next=${encodeURIComponent('/profile')}`} legacyBehavior>
              <a
                style={{
                  background: '#6e5084',
                  color: '#fff',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
              >
                Join Us
              </a>
            </Link>
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
            <Link href="/events" legacyBehavior><a style={{ padding: '0.75rem', color: '#9b8bbd', textDecoration: 'none', fontWeight: 700 }}>Events</a></Link>
            <Link href="/host" legacyBehavior><a style={{ padding: '0.75rem', color: '#9b8bbd', textDecoration: 'none', fontWeight: 700 }}>Host</a></Link>
            <Link href={isSignedIn ? "/connections" : "/sign-in?next=/connections"} legacyBehavior>
              <a style={{ padding: '0.75rem', color: '#9b8bbd', textDecoration: 'none', fontWeight: 700 }}>Connections</a>
            </Link>
            <Link href={isSignedIn ? "/profile" : "/sign-in?next=/profile"} legacyBehavior>
              <a style={{ padding: '0.75rem', color: '#9b8bbd', textDecoration: 'none', fontWeight: 700 }}>Profile</a>
            </Link>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main style={{ flex: 1, paddingBottom: 'calc(84px + var(--safe-bottom))' }}>{children}</main>

      {/* Bottom mobile tab bar */}
      <nav
        className="mobile-only bottom-nav"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#fff',
          borderTop: '1px solid #eee',
          boxShadow: '0 -6px 22px rgba(0,0,0,0.08)',
          zIndex: 60,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0px', padding: '0.65rem 0' }}>
          <Link href="/events" legacyBehavior><a className="bn-item"><div className="bn-icon">🗓️</div><div className="bn-label">Events</div></a></Link>
          <Link href="/host" legacyBehavior><a className="bn-item"><div className="bn-icon">📣</div><div className="bn-label">Host</div></a></Link>
          <Link href={isSignedIn ? "/connections" : "/sign-in?next=/connections"} legacyBehavior>
            <a className="bn-item"><div className="bn-icon">🤝</div><div className="bn-label">Connect</div></a>
          </Link>
          <Link href={isSignedIn ? "/profile" : "/sign-in?next=/profile"} legacyBehavior>
            <a className="bn-item"><div className="bn-icon">👤</div><div className="bn-label">Profile</div></a>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <footer className="site-footer" data-reveal>
        <div className="footer-inner">
          {/* Brand + blurb */}
          <div className="footer-col footer-brand">
            <Image
              src="/icons/invertlogo.png"
              alt="Say Salams logo"
              width={210}
              height={210}
              style={{ height: 'auto', width: 'auto' }}
            />
            <p className="footer-blurb">Community | Connections | Celebration</p>
          </div>

          {/* Quick links */}
          <div className="footer-col">
            <h4 className="footer-title">Explore</h4>
            <ul className="footer-links">
              <li><Link href="/events" legacyBehavior><a>See our upcoming Events</a></Link></li>
              <li><Link href="/host" legacyBehavior><a>Become a Host</a></Link></li>
              <li><Link href="/connections" legacyBehavior><a>Discover Connection</a></Link></li>
              <li><Link href="/profile" legacyBehavior><a>View your Profile</a></Link></li>
              <li><Link href="/faq" legacyBehavior><a>Frequently Asked Questions</a></Link></li>
            </ul>
          </div>

          {/* Contact + social */}
          <div className="footer-col">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-contact">
              <li><a href="mailto:contact@saysalams.com">contact@saysalams.com</a></li>
              <li>Brisbane, QLD, 4000</li>
            </ul>
            <div className="footer-social">
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="TikTok">🎵</a>
              <a href="#" aria-label="LinkedIn">💼</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © 2025 Say Salams. All rights reserved.
            {' '}·{' '}
            <Link href="/privacy" legacyBehavior><a style={{ color: '#fff', textDecoration: 'underline' }}>Privacy Policy</a></Link>
            {' '}·{' '}
            <Link href="/terms" legacyBehavior><a style={{ color: '#fff', textDecoration: 'underline' }}>Terms & Conditions</a></Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
