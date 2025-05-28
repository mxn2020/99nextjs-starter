import type {
  AuthProviderInterface,
  AuthResult,
  SignInOptions,
  SignUpOptions,
  OAuthSignInOptions,
  User,
  AuthSession
} from '../../types';
import { AuthError, AuthErrorCode } from '../../errors';
import { betterAuthConfig } from './config';
import type { BetterAuthOptions, BetterAuthUser, BetterAuthSession } from './types';
export class BetterAuthClient implements AuthProviderInterface {
  private options: BetterAuthOptions;
  private baseURL: string;
  constructor(options: BetterAuthOptions = {}) {
    this.options = { ...betterAuthConfig, ...options };
    this.baseURL = this.options.baseURL!;
    if (!this.options.secret) {
      throw AuthError.providerNotConfigured('Better Auth secret not configured');
    }
  }
  async signIn(options: SignInOptions): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/sign-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: options.email,
          password: options.password,
          rememberMe: options.remember,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        return this.handleError(data);
      }

      return {
        user: this.transformUser(data.user),
        session: this.transformSession(data.session),
      };
    } catch (error) {
      return {
        error: AuthError.providerError('Better Auth sign in failed', error),
      };
    }
  }
  async signUp(options: SignUpOptions): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/sign-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: options.email,
          password: options.password,
          name: options.name,
          ...options.metadata,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        return this.handleError(data);
      }

      const needsVerification = this.options.emailAndPassword?.requireEmailVerification && !data.user.emailVerified;

      return {
        user: this.transformUser(data.user),
        session: data.session ? this.transformSession(data.session) : undefined,
        needsVerification,
      };
    } catch (error) {
      return {
        error: AuthError.providerError('Better Auth sign up failed', error),
      };
    }
  }
  async signInWithOAuth(options: OAuthSignInOptions): Promise<AuthResult> {
    try {
      const params = new URLSearchParams({
        provider: options.provider,
        ...(options.redirectTo && { redirectTo: options.redirectTo }),
        ...(options.scopes && { scopes: options.scopes.join(' ') }),
      });
      const authUrl = `${this.baseURL}/api/auth/oauth/${options.provider}?${params}`;

      // For client-side, redirect to the OAuth URL
      if (typeof window !== 'undefined') {
        window.location.href = authUrl;
        return { redirectTo: authUrl };
      }

      // For server-side, return the URL
      return { redirectTo: authUrl };
    } catch (error) {
      return {
        error: AuthError.oauthError('OAuth sign in failed', error),
      };
    }
  }
  async signOut(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/api/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      // Ignore sign out errors
    }
  }
  async getUser(): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/session`, {
        credentials: 'include',
      });
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user ? this.transformUser(data.user) : null;
    } catch {
      return null;
    }
  }
  async getSession(): Promise<AuthSession | null> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/session`, {
        credentials: 'include',
      });
      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.session || !data.user) {
        return null;
      }

      return {
        user: this.transformUser(data.user),
        accessToken: data.session.token,
        expiresAt: new Date(data.session.expiresAt),
      };
    } catch {
      return null;
    }
  }
  async refreshToken(): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        return this.handleError(data);
      }

      return {
        user: this.transformUser(data.user),
        session: this.transformSession(data.session),
      };
    } catch (error) {
      return {
        error: AuthError.providerError('Token refresh failed', error),
      };
    }
  }
  async resetPassword(email: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw AuthError.providerError(data.message || 'Password reset failed', data);
    }
  }
  async updateUser(updates: Partial<User>): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/auth/user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const data = await response.json();
      throw AuthError.providerError(data.message || 'User update failed', data);
    }

    const data = await response.json();
    return this.transformUser(data.user);
  }
  async deleteUser(): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/auth/user`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const data = await response.json();
      throw AuthError.providerError(data.message || 'User deletion failed', data);
    }
  }
  private transformUser(betterUser: BetterAuthUser): User {
    return {
      id: betterUser.id,
      email: betterUser.email,
      name: betterUser.name,
      avatar: betterUser.image,
      emailVerified: betterUser.emailVerified,
      metadata: {
        createdAt: betterUser.createdAt,
        updatedAt: betterUser.updatedAt,
      },
      roles: betterUser.roles || [],
      permissions: betterUser.permissions || [],
      createdAt: betterUser.createdAt,
      updatedAt: betterUser.updatedAt,
    };
  }
  private transformSession(betterSession: BetterAuthSession): AuthSession {
    return {
      user: {} as User, // Will be populated by the caller
      accessToken: betterSession.token,
      expiresAt: betterSession.expiresAt,
    };
  }
  private handleError(data: any): AuthResult {
    const errorCode = data.code || 'UNKNOWN_ERROR';
    const errorMessage = data.message || 'An error occurred';
    switch (errorCode) {
      case 'INVALID_CREDENTIALS':
        return { error: AuthError.invalidCredentials(errorMessage) };
      case 'USER_NOT_FOUND':
        return { error: AuthError.userNotFound(errorMessage) };
      case 'USER_ALREADY_EXISTS':
        return { error: AuthError.userAlreadyExists(errorMessage) };
      case 'EMAIL_NOT_VERIFIED':
        return { error: AuthError.emailNotVerified(errorMessage) };
      default:
        return { error: AuthError.providerError(errorMessage, data) };
    }
  }
}
export function createBetterAuth(options?: BetterAuthOptions): BetterAuthClient {
  return new BetterAuthClient(options);
}
// Helper function to create Better Auth client hook
export function useBetterAuth() {
  // TODO: Implement Better Auth specific hooks
  // This would integrate with Better Auth's client-side hooks
  throw new Error('Better Auth client hooks not implemented - use the Better Auth package directly');
}
