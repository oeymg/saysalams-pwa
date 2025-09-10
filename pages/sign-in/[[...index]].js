import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/router';

export default function SignInCatchAll() {
  const router = useRouter();
  const redirectUrl =
    router.query.redirect_url ||
    router.query.redirect ||
    router.query.redirectUrl ||
    '/';
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <SignIn 
        path="/sign-in" 
        routing="path" 
        signUpUrl="/sign-up" 
        redirectUrl={redirectUrl} 
      />
    </div>
  );
}
