import Layout from '../components/layout.js';
import Collapsible from '../components/Collapsible';

export default function FAQ() {
  return (
    <Layout>
      <section style={{ backgroundColor: '#f6f4fa', padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#6e5084', fontSize: '2.5rem', marginBottom: '0.5rem' }}>Frequently Asked Questions</h1>
      </section>
      <section style={{ backgroundColor: '#f6f4fa', padding: '1rem 1.25rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', color: '#333', lineHeight: '1.6' }}>
          <Collapsible title="What is Say Salams?">
            <p style={{ margin: 0 }}>Say Salams is a community platform that connects people through events to foster friendship, understanding, and cultural exchange.</p>
          </Collapsible>
          <Collapsible title="How do I attend an event?">
            <p style={{ margin: 0 }}>You can browse upcoming events on our platform and register for those that interest you. Attendance is usually free and open to all.</p>
          </Collapsible>
          <Collapsible title="How do I become a host?">
            <p style={{ margin: 0 }}>To become a host, sign up on our website and submit your event details for approval. We support hosts with resources to make your event successful.</p>
          </Collapsible>
          <Collapsible title="Does it cost to host or attend events?">
            <p style={{ margin: 0 }}>No, Say Salams does not charge fees for hosting or attending events. We aim to keep community engagement accessible to everyone.</p>
          </Collapsible>
          <Collapsible title="Can businesses benefit from hosting with Say Salams?">
            <p style={{ margin: 0 }}>Yes, businesses can connect with the community, increase visibility, and foster goodwill by hosting events through Say Salams.</p>
          </Collapsible>
          <Collapsible title="How do I stay updated on new events?">
            <p style={{ margin: 0 }}>Subscribe to our newsletter and follow us on social media to get the latest updates on upcoming events and community news.</p>
          </Collapsible>
        </div>
      </section>
    </Layout>
  );
}
