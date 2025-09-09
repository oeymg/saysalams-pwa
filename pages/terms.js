import Layout from '../components/layout';

const sep = { height: 1, background: '#eee', margin: '1.25rem 0' };

export default function Terms() {
  return (
    <Layout>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ color: '#6e5084', marginBottom: '0.25rem' }}>Terms & Conditions</h1>
        <p style={{ color: '#666', marginBottom: '0.25rem' }}>Effective Date: 9th of September 2025</p>
        <p style={{ color: '#666', marginBottom: '1rem' }}>Last Updated: 9th of September 2025</p>

        <p style={{ color: '#444', lineHeight: 1.7 }}>
          Welcome to Say Salams. These Terms and Conditions (“Terms”) govern your access to and use of our Platform. By using Say Salams, you agree to these Terms.
        </p>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>1. Eligibility</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>You must be at least 16 years old.</li>
          <li>You must provide accurate, complete information when creating an account.</li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>2. Your Responsibilities</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>Keep your account login secure.</li>
          <li>Do not misuse the Platform (e.g., spam, harassment, illegal activity).</li>
          <li>Respect the community guidelines and Islamic values of peace and respect.</li>
          <li>Only post events you are authorised to host.</li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>3. Platform Use</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>We provide tools for discovering events, RSVPs, and building connections.</li>
          <li>Features (e.g., RSVPs, messaging, connections) may change over time.</li>
          <li>We may suspend or terminate accounts that violate these Terms.</li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>4. Event Hosting</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>Hosts are responsible for the accuracy of event details.</li>
          <li>Say Salams is not liable for issues arising from third-party or user-hosted events.</li>
          <li>Hosts must comply with applicable laws, health and safety, and community standards.</li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>5. Limitations of Liability</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>Say Salams is not responsible for any damages arising from your use of the Platform or participation in events.</li>
          <li>We do not guarantee uninterrupted or error-free services.</li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>6. Intellectual Property</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>Content provided by Say Salams (logos, branding, platform design) is our property.</li>
          <li>Users retain ownership of content they submit but grant Say Salams a licence to display and share it within the Platform.</li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>7. Termination</h2>
        <ul style={{ color: '#444', lineHeight: 1.8 }}>
          <li>You may delete your account at any time.</li>
          <li>We may suspend or terminate accounts that violate these Terms.</li>
        </ul>

        <div style={sep} />

        <h2 style={{ color: '#6e5084', margin: '1rem 0 0.5rem' }}>8. Governing Law</h2>
        <p style={{ color: '#444', lineHeight: 1.8 }}>
          These Terms are governed by the laws of Australia (Queensland).
        </p>
      </div>
    </Layout>
  );
}

