import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type {
  AuthProvider,
  AuthResult,
  SignInOptions,
  SignUpOptions,
  OAuthSignInOptions,
  User,
  AuthSession
} from '../../types';
import { AuthError, AuthErrorCode } from '../../errors';
import { supabaseAuthConfig } from './config';
import type { SupabaseAuthOptions, SupabaseUser, SupabaseSession } from './types';
export class SupabaseAuthClient implements AuthProvider {
  private supabase: SupabaseClient;
  private options: SupabaseAuthOptions;
  constructor(options: SupabaseAuthOptions = {}) {
    this.options = { ...supabaseAuthConfig, ...options };
    if (!this.options.supabaseUrl || !this.options.supabaseAnonKey) {
      throw AuthError.providerNotConfigured('Supabase');
    }

    this.supabase = createBrowserClient(
      this.options.supabaseUrl,
      this.options.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: this.options.autoRefreshToken,
          persistSession: this.options.persistSession,
          detectSessionInUrl: this.options.detectSessionInUrl,
          flowType: this.options.flowType,
          storage: this.options.storage,
          storageKey: this.options.storageKey,
        },
      }
    );
  }
  async signIn(options: SignInOptions): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: options.email!,
        password: options.password,
      });
      if (error) {
        return this.handleSupabaseError(error);
      }

      return {
        user: this.transformUser(data.user),
        session: this.transformSession(data.session),
      };
    } catch (error) {
      return {
        error: AuthError.providerError('Supabase sign in failed', error),
      };
    }
  }
  async signUp(options: SignUpOptions): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: options.email,
        password: options.password,
        options: {
          data: {
            name: options.name,
            ...options.metadata,
          },
          emailRedirectTo: options.redirectTo,
        },
      });
      if (error) {
        return this.handleSupabaseError(error);
      }

      const needsVerification = !data.session && data.user && !data.user.email_confirmed_at;

      return {
        user: data.user ? this.transformUser(data.user) : undefined,
        session: data.session ? this.transformSession(data.session) : undefined,
        needsVerification,
      };
    } catch (error) {
      return {
        error: AuthError.providerError('Supabase sign up failed', error),
      };
    }
  }
  async signInWithOAuth(options: OAuthSignInOptions): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: options.provider as any,
        options: {
          redirectTo: options.redirectTo,
          scopes: options.scopes?.join(' '),
        },
      });
      if (error) {
        return this.handleSupabaseError(error);
      }

      return {
        redirectTo: data.url,
      };
    } catch (error) {
      return {
        error: AuthError.oauthError('OAuth sign in failed', error),
      };
    }
  }
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw AuthError.providerError('Sign out failed', error);
    }
  }
  async getUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) {
        return null;
      }

      return user ? this.transformUser(user) : null;
    } catch {
      return null;
    }
  }
  async getSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error || !session) {
        return null;
      }

      return this.transformSession(session);
    } catch {
      return null;
    }
  }
  async refreshToken(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      if (error) {
        return this.handleSupabaseError(error);
      }

      return {
        user: data.user ? this.transformUser(data.user) : undefined,
        session: data.session ? this.transformSession(data.session) : undefined,
      };
    } catch (error) {
      return {
        error: AuthError.providerError('Token refresh failed', error),
      };
    }
  }
  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw AuthError.providerError('Password reset failed', error);
    }
  }
  async updateUser(updates: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase.auth.updateUser({
      email: updates.email,
      data: {
        name: updates.name,
        ...updates.metadata,
      },
    });
    if (error) {
      throw AuthError.providerError('User update failed', error);
    }

    return this.transformUser(data.user);
  }
  async deleteUser(): Promise<void> {
    // TODO: Implement user deletion
    // This requires admin API or custom function
    throw new Error('User deletion not implemented');
  }
  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? this.transformUser(session.user) : null;
      callback(user);
    });
  }
  private transformUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name,
      avatar: supabaseUser.user_metadata?.avatar_url,
      emailVerified: !!supabaseUser.email_confirmed_at,
      metadata: supabaseUser.user_metadata,
      roles: supabaseUser.app_metadata?.roles || [],
      permissions: supabaseUser.app_metadata?.permissions || [],
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at),
    };
  }
  private transformSession(supabaseSession: SupabaseSession): AuthSession {
    return {
      user: this.transformUser(supabaseSession.user),
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresAt: supabaseSession.expires_at
        ? new Date(supabaseSession.expires_at * 1000)
        : undefined,
    };
  }
  private handleSupabaseError(error: any): AuthResult {
    switch (error.message) {
      case 'Invalid login credentials':
        return { error: AuthError.invalidCredentials() };
      case 'User not found':
        return { error: AuthError.userNotFound() };
      case 'User already registered':
        return { error: AuthError.userAlreadyExists() };
      case 'Email not confirmed':
        return { error: AuthError.emailNotVerified() };
      default:
        return { error: AuthError.providerError(error.message, error) };
    }
  }
}
export function createSupabaseAuth(options?: SupabaseAuthOptions): SupabaseAuthClient {
  return new SupabaseAuthClient(options);
}
