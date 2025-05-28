import bcrypt from 'bcryptjs';
import type {
  AuthProviderInterface,
  AuthResult,
  SignInOptions,
  SignUpOptions,
  User,
  AuthSession
} from '../../types';
import { AuthError, AuthErrorCode } from '../../errors';
import { basicAuthConfig } from './config';
import type { BasicAuthOptions, BasicAuthUser, BasicAuthSession } from './types';
export class BasicAuthClient implements AuthProviderInterface {
  private options: BasicAuthOptions;
  private storage: Storage | null = null;
  private memorySession: BasicAuthSession | null = null;
  constructor(options: BasicAuthOptions = {}) {
    this.options = { ...basicAuthConfig, ...options };
    if (typeof window !== 'undefined' && this.options.storage !== 'memory') {
      this.storage = this.options.storage === 'sessionStorage'
        ? window.sessionStorage
        : window.localStorage;
    }
  }
  async signIn(options: SignInOptions): Promise<AuthResult> {
    try {
      const { username, email, password } = options;
      const identifier = username || email;
      if (!identifier || !password) {
        return {
          error: AuthError.validationError('Username/email and password are required'),
        };
      }

      const user = this.findUser(identifier);
      if (!user) {
        return {
          error: AuthError.userNotFound(),
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          error: AuthError.invalidCredentials(),
        };
      }

      const session: BasicAuthSession = {
        username: user.username,
        user,
        loginTime: Date.now(),
        lastActivity: Date.now(),
      };

      this.setSession(session);

      const transformedUser = this.transformUser(user);

      return {
        user: transformedUser,
        session: {
          user: transformedUser,
          accessToken: btoa(JSON.stringify({ username: user.username, timestamp: Date.now() })),
        },
      };
    } catch (error) {
      return {
        error: AuthError.providerError('Basic auth sign in failed', error),
      };
    }
  }
  async signUp(options: SignUpOptions): Promise<AuthResult> {
    // Basic auth typically doesn't support sign up unless explicitly configured
    // This would require a way to persist new users
    return {
      error: AuthError.providerError('Sign up not supported in basic auth mode'),
    };
  }
  async signOut(): Promise<void> {
    this.removeSession();
  }
  async getUser(): Promise<User | null> {
    const session = this.getStoredSession();
    if (!session) return null;
    // Check session timeout
    const now = Date.now();
    if (now - session.lastActivity > this.options.sessionTimeout!) {
      this.removeSession();
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    this.setSession(session);

    return this.transformUser(session.user);
  }
  async getSession(): Promise<AuthSession | null> {
    const session = this.getStoredSession();
    if (!session) return null;
    const user = this.transformUser(session.user);
    return {
      user,
      accessToken: btoa(JSON.stringify({ username: session.username, timestamp: session.loginTime })),
    };
  }
  async updateUser(updates: Partial<User>): Promise<User> {
    const session = this.getStoredSession();
    if (!session) {
      throw AuthError.unauthorized('No active session');
    }
    // Basic auth doesn't typically support user updates
    // This would require a way to persist changes
    throw AuthError.providerError('User updates not supported in basic auth mode');
  }
  private findUser(identifier: string): BasicAuthUser | undefined {
    return this.options.users?.find(user =>
      user.username === identifier || user.email === identifier
    );
  }
  private transformUser(basicUser: BasicAuthUser): User {
    return {
      id: basicUser.username,
      email: basicUser.email,
      name: basicUser.name || basicUser.username,
      roles: basicUser.roles || [],
      permissions: basicUser.permissions || [],
      metadata: basicUser.metadata || {},
    };
  }
  private getStoredSession(): BasicAuthSession | null {
    if (this.options.storage === 'memory') {
      return this.memorySession;
    }
    if (!this.storage) return null;

    try {
      const sessionData = this.storage.getItem(this.options.storageKey!);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }
  private setSession(session: BasicAuthSession): void {
    if (this.options.storage === 'memory') {
      this.memorySession = session;
      return;
    }
    if (this.storage) {
      this.storage.setItem(this.options.storageKey!, JSON.stringify(session));
    }
  }
  private removeSession(): void {
    if (this.options.storage === 'memory') {
      this.memorySession = null;
      return;
    }
    if (this.storage) {
      this.storage.removeItem(this.options.storageKey!);
    }
  }
}
export function createBasicAuth(options?: BasicAuthOptions): BasicAuthClient {
  return new BasicAuthClient(options);
}
