
"use client";

import { useState, useTransition, useEffect }
  from 'react';
import { Button } from '@/components/ui/button';
import { loginWithOAuth } from '@/server/auth.actions';
import { unlinkOAuthAccountAction } from '@/server/user.actions';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import { toast } from 'sonner';
import type { UserIdentity } from '@/lib/types';
import { AlertCircle, LinkIcon, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface LinkedAccountsManagerProps {
  identities: UserIdentity[];
  currentUserId: string;
}

type ProviderInfo = {
  name: string;
  icon: React.ElementType;
  key: 'github' | 'google'; // Add more provider keys as needed
};

const SUPPORTED_OAUTH_PROVIDERS: ProviderInfo[] = [
  { name: 'GitHub', icon: FaGithub, key: 'github' },
  { name: 'Google', icon: FaGoogle, key: 'google' },
  // Add more providers here
];

export default function LinkedAccountsManager({ identities: initialIdentities, currentUserId }: LinkedAccountsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [identities, setIdentities] = useState<UserIdentity[]>(initialIdentities);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  // Function to refresh identities from Supabase
  const refreshIdentities = async () => {
    // Consider adding a loading state if not already present
    const { data: { user }, error } = await supabase.auth.getUser(); // supabase is createSupabaseBrowserClient()

    if (error) {
      toast.error("Failed to refresh account links: " + error.message);
      // Avoid clearing identities on a fetch error; retain current (possibly server-rendered) state
      return;
    }

    if (user?.identities) {
      setIdentities(user.identities as UserIdentity[]);
    } else if (user && !user.identities) {
      // User session exists, but no identities (e.g., only email/password)
      setIdentities([]);
    } else if (!user) {
      // No user session found during this client-side check.
      // This is where "Auth session missing!" occurs.
      // It's crucial not to clear `initialIdentities` if this is a transient issue.
      // Only clear if it's a definitive sign-out, which `onAuthStateChange` might handle better.
      toast.error("Failed to refresh account links: Client-side session check failed. Data might be stale.");
      // Avoid calling `setIdentities([])` here unless you are sure the user is logged out.
      // If `initialIdentities` were populated from the server, you might want to keep them
      // until an explicit logout event.
    }
  };

  // Inside LinkedAccountsManager.tsx, adjust the useEffect:
  useEffect(() => {
    setIdentities(initialIdentities); // Trust server-rendered identities initially

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('LinkedAccountsManager auth state change:', event, session);
      if (session?.user?.identities) {
        setIdentities(session.user.identities as UserIdentity[]);
      } else if (event === 'SIGNED_OUT' || !session?.user) {
        setIdentities([]);
      } else if (session?.user && (!session.user.identities || session.user.identities.length === 0)) {
        setIdentities([]); // User exists but has no external identities
      }
    });

    // To catch updates if the page was already focused when onAuthStateChange fires,
    // or for an explicit refresh on focus:
    const handleFocus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.identities) {
        setIdentities(session.user.identities as UserIdentity[]);
      } else if (!session?.user) {
        setIdentities([]);
      } else if (session?.user && (!session.user.identities || session.user.identities.length === 0)) {
        setIdentities([]);
      }
    };

    window.addEventListener('focus', handleFocus);
    handleFocus(); // Initial call on mount as well

    return () => {
      authListener?.subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [initialIdentities, supabase]);


  const handleLinkAccount = async (provider: 'github' | 'google') => {
    startTransition(async () => {
      // Redirect to settings page after linking, with a query param for feedback
      const result = await loginWithOAuth(provider, `/dashboard/settings?linked_provider=${provider}`);
      if (result?.error) {
        toast.error(`Failed to link ${provider}: ${result.error}`);
      }
      // Server action handles the redirect to OAuth provider
    });
  };

  const handleUnlinkAccount = async (identity: UserIdentity) => {
    startTransition(async () => {
      const result = await unlinkOAuthAccountAction(identity);
      if (result.success) {
        toast.success(result.message || `${identity.provider} account unlinked successfully.`);
        // Refresh identities list after unlinking
        const { data: { user } } = await supabase.auth.getUser();
        setIdentities(user?.identities as UserIdentity[] || []);
        router.refresh(); // Re-fetch server components
      } else {
        toast.error(result.error || `Failed to unlink ${identity.provider} account.`);
      }
    });
  };

  const getProviderInfo = (providerKey: string): ProviderInfo | undefined => {
    return SUPPORTED_OAUTH_PROVIDERS.find(p => p.key === providerKey);
  };

  const linkedProviderKeys = identities.map(id => id.provider);



  return (
    <div className="space-y-4">
      {identities.length > 0 ? (
        <ul className="space-y-3">
          {identities.map((identity) => {
            const providerInfo = getProviderInfo(identity.provider);
            const IconComponent = providerInfo?.icon || LinkIcon;

            const isEmailIdentity = identity.provider === 'email';
            const isPrimaryPasswordIdentity = identity.provider === 'email';
            const isUnlinkable = identity.provider !== 'email';

            return (
              <li key={identity.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="font-medium capitalize">{providerInfo?.name || identity.provider}</span>
                    {identity.identity_data?.email && (
                      <p className="text-xs text-muted-foreground">{identity.identity_data.email}</p>
                    )}
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isPending || !isUnlinkable}>
                      <Trash2 className="mr-1 h-4 w-4" /> Unlink
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unlink {providerInfo?.name || identity.provider} Account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to unlink this account? If this is your only sign-in method and you don't have a password set, you might lose access to your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleUnlinkAccount(identity)}
                        disabled={isPending || !isUnlinkable}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isPending ? 'Unlinking...' : 'Unlink'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No accounts linked yet. You are likely signed in with email and password.</p>
      )}

      <div className="pt-4">
        <h4 className="text-md font-medium mb-2">Link New Account</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
            const isLinked = linkedProviderKeys.includes(provider.key);
            if (isLinked) return null; // Don't show button if already linked

            const Icon = provider.icon;
            return (
              <Button
                key={provider.key}
                variant="outline"
                onClick={() => handleLinkAccount(provider.key)}
                disabled={isPending}
                className="w-full justify-start"
              >
                <Icon className="mr-2 h-5 w-5" /> Link {provider.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
