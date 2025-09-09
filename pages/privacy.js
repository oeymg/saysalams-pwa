import Layout from '../components/layout';

const sep = {
  height: 1,
  background: '#eee',
  margin: '1.25rem 0',
};

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ color: '#6e5084', marginBottom: '0.25rem' }}>Privacy Policy </h1>
        <p style={{ color: '#666', marginBottom: '0.25rem' }}>Effective Date: 9th of September 2025</p>
        <p style={{ color: '#666', marginBottom: '1rem' }}>Last Updated: 9th of September 2025</p>

        <p style={{ color: '#444', lineHeight: 1.7 }}>
          Say Salams (“we,” “our,” “us”) is committed to protecting the privacy of our users.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website,
          mobile app, and related services (collectively, the “Platform”).
        </p>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>1. Information We Collect</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>
            <strong>Personal Information You Provide:</strong>
            <div style={{ marginTop: 4 }}>
              Name, email, phone number, location (postcode/city), interests, and other details when creating a user profile.
              Information submitted through forms (e.g., hosting events, RSVPs, signing up as a user).
            </div>
          </li>
          <li>
            <strong>Automatically Collected Data:</strong>
            <div style={{ marginTop: 4 }}>
              Device information, IP address, browser type, and usage statistics. Cookies and analytics data to improve functionality and performance.
            </div>
          </li>
          <li>
            <strong>Content You Share:</strong>
            <div style={{ marginTop: 4 }}>
              Events created, RSVPs, messages, and interactions with other users.
            </div>
          </li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>2. How We Use Your Information</h2>
        <p style={{ color: '#444', lineHeight: 1.8 }}>
          We use the collected data to:
        </p>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>Provide and improve the Platform (events, RSVPs, connections).</li>
          <li>Enable user-to-user features (friends, event sharing, visibility of RSVPs).</li>
          <li>Send confirmations, notifications, and service updates.</li>
          <li>For security, fraud prevention, and compliance with applicable law.</li>
          <li>With your consent, send newsletters, promotional materials, and updates.</li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>3. How We Share Information</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>
            <strong>With Other Users:</strong> Limited details (e.g., name, interests, RSVP status) visible to connections and event hosts.
          </li>
          <li>
            <strong>With Service Providers:</strong> Airtable, Clerk (authentication), Vercel, analytics providers.
          </li>
          <li>
            <strong>For Legal Reasons:</strong> To comply with applicable laws, regulations, or lawful requests.
          </li>
          <li>
            <strong>In Business Transfers:</strong> If Say Salams merges, acquires, or transfers assets.
          </li>
        </ul>
        <p style={{ color: '#444' }}>We do not sell your personal information to third parties.</p>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>4. Your Choices & Rights</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>Access, update, or delete your account information.</li>
          <li>Manage visibility of your profile (e.g., restricting what others can see).</li>
          <li>Opt out of marketing communications.</li>
          <li>Request a copy of your personal data.</li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>5. Data Retention</h2>
        <p style={{ color: '#444', lineHeight: 1.8 }}>
          We retain data as long as your account is active, or as needed to provide services. We may also retain data to comply with legal obligations.
        </p>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>6. Security</h2>
        <p style={{ color: '#444', lineHeight: 1.8 }}>
          We use reasonable technical and organisational measures (encryption, access controls) to protect your data. However, no system is 100% secure.
        </p>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>7. Children’s Privacy</h2>
        <p style={{ color: '#444', lineHeight: 1.8 }}>
          Say Salams is not intended for individuals under 16. If we learn that a child has provided personal information, we will delete it promptly.
        </p>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>8. International Data Transfers</h2>
        <p style={{ color: '#444', lineHeight: 1.8 }}>
          Data may be stored and processed in countries outside your own. By using Say Salams, you consent to these transfers.
        </p>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>9. Updates to This Policy</h2>
        <p style={{ color: '#444', lineHeight: 1.8 }}>
          We may update this policy from time to time. The latest version will always be available on our website.
        </p>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>10. Contact Us</h2>
        <p style={{ color: '#444', lineHeight: 1.8 }}>
          If you have questions, email us at: <a href="mailto:contact@saysalams.com">contact@saysalams.com</a>
        </p>
      </div>
    </Layout>
  );
}

