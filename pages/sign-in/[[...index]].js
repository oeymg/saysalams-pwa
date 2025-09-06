import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Layout from '../../components/layout';

export default function SignInCatchAll() {
  const router = useRouter();
  const redirectUrl = (router.query.redirect_url || '/profile');
  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <SignIn redirectUrl={redirectUrl} />
      </div>
    </Layout>
  );
}

