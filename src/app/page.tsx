
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserNav } from '@/components/layout/UserNav'; // Assuming a UserNav component

export default async function LandingPage() {
const supabase = await createSupabaseServerClient();
const { data: { session } } = await supabase.auth.getSession();

let userProfile = null;
if (session) {
const { data } = await supabase
.from('users')
.select('display_name, avatar_url, role')
.eq('id', session.user.id)
.single();
userProfile = data;
}

return (
<div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background text-foreground">
<header className="absolute top-0 right-0 p-4">
{session && userProfile ? (
<UserNav user={{ email: session.user.email!, name: userProfile.display_name, avatarUrl: userProfile.avatar_url }} />
) : (
<Link href="/login">
<Button variant="outline">Login</Button>
</Link>
)}
</header>
<main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
<h1 className="text-5xl md:text-6xl font-bold">
Welcome to <span className="text-primary">NextJS-Supabase Auth</span>
</h1>

    <p className="mt-3 text-xl md:text-2xl text-muted-foreground">
      Secure authentication, user onboarding, and RBAC made easy.
    </p>

    <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full space-y-4 sm:space-y-0 sm:space-x-4">
      {!session ? (
        <>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full">Get Started - Login</Button>
          </Link>
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full">Sign Up</Button>
          </Link>
        </>
      ) : (
        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button size="lg" className="w-full">Go to Dashboard</Button>
        </Link>
      )}
    </div>
  </main>

  <footer className="flex items-center justify-center w-full h-24 border-t">
    <p className="text-muted-foreground">
      Built with Next.js, Supabase, TailwindCSS, and Shadcn/UI.
    </p>
  </footer>
</div>
);
}
