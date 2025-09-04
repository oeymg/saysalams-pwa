// pages/host.js

import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/layout.js';

export default function Host() {
  return (
    <Layout>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ color: '#6e5084', fontSize: '2.5rem', marginBottom: '1.5rem' }}>
          Turn Your Idea, Organisation, or Business into a Community Hub ✨
        </h1>

        <p style={{ marginBottom: '2rem', color: '#444', lineHeight: '1.6' }}>
          You can set up an event with Say Salams anytime, anywhere. Whether you&apos;re an
          individual, organisation, or business, hosting with us empowers you to build meaningful connections, showcase your unique offerings, and engage deeply with the Muslim community through impactful events.
        </p>

        <h2 style={{ color: '#5a3c91', marginBottom: '1rem' }}>Why Host with Say Salams?</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, background: '#f6f4fa', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
            <h3 style={{ color: '#6e5084', marginBottom: '0.5rem' }}>Individuals</h3>
            <p style={{ color: '#333', lineHeight: '1.4' }}>
              Host fun, educational, or creative events that bring people together and spark joy in the community.
            </p>
          </div>
          <div style={{ flex: 1, background: '#f6f4fa', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏛️</div>
            <h3 style={{ color: '#6e5084', marginBottom: '0.5rem' }}>Organisations</h3>
            <p style={{ color: '#333', lineHeight: '1.4' }}>
              Engage your community through workshops, seminars, and events that foster learning and growth.
            </p>
          </div>
          <div style={{ flex: 1, background: '#f6f4fa', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
            <h3 style={{ color: '#6e5084', marginBottom: '0.5rem' }}>Businesses</h3>
            <p style={{ color: '#333', lineHeight: '1.4' }}>
              Boost your brand presence by hosting exclusive offers, networking events, and launch parties.
            </p>
          </div>
        </div>

        <h2 style={{ color: '#5a3c91', marginBottom: '1rem' }}>How it Works</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#333' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              minWidth: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#6e5084',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1rem',
              flexShrink: 0,
              marginTop: '4px'
            }}>1</div>
            <p>Fill out our simple hosting form with all the details about your event idea.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              minWidth: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#6e5084',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1rem',
              flexShrink: 0,
              marginTop: '4px'
            }}>2</div>
            <p>Get quick approval and support from our team to help you prepare for a successful event.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              minWidth: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#6e5084',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1rem',
              flexShrink: 0,
              marginTop: '4px'
            }}>3</div>
            <p>Your event is promoted across the Say Salams network, connecting you with a vibrant community.</p>
          </div>
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <a
            href="https://airtable.com/embed/appTagC9VpvWx3nGF/pagNTMHiWpoKO2GLo/form"
            target="_blank"
            rel="noreferrer"
            style={{
              background: 'linear-gradient(90deg, #6e5084, #6e5065)',
              color: '#fff',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '1.1rem',
              display: 'inline-block',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            Become a Host
          </a>
        </div>
      </div>
    </Layout>
  );
}