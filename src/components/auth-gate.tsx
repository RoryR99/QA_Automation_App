import { LogIn, Loader2 } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { hasSupabaseEnv, getSupabaseClient } from '@/lib/supabase';
import { useAuthSession } from '@/hooks/use-auth-session';

function getRedirectUrl() {
  return window.location.origin;
}

export function AuthGate({ children }: PropsWithChildren) {
  const { session, isLoading } = useAuthSession();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signInWithMicrosoft = async () => {
    try {
      setIsSigningIn(true);
      const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email',
          redirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start Microsoft sign-in.';
      toast.error(message);
      setIsSigningIn(false);
    }
  };

  if (!hasSupabaseEnv) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Supabase configuration required</CardTitle>
            <CardDescription>Add the Supabase URL and anon key before deploying this QA workflow.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel, plus server-side Supabase variables for the API routes.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to QA Auto</CardTitle>
            <CardDescription>Use your Microsoft account to access production QA records.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" className="w-full" onClick={signInWithMicrosoft} disabled={isSigningIn}>
              {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Continue with Microsoft
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
