import { SignJWT, jwtVerify } from 'jose';
import type {
  AuthProvider,
  AuthResult,
  SignInOptions,
  SignUpOptions,
  User,
  AuthSession
} from '../../types';
import { AuthError, AuthErrorCode } from '../../errors';
import { jwtAuthConfig } from './config';
import type { JWTAuthOptions, JWTTokenPayload, JWTAuthResponse } from './types';

export class JWTAuthClient implements AuthProvider {
  private options: JWTAuthOptions;
  private storage: Storage | null = null;
  constructor(options: JWTAuthOptions = {}) {
    this.options = { ...jwtAuthConfig, ...options };
    if (typeof window !== 'undefined') {
      this.storage = this.options.storage === 'sessionStorage'
        ? window.sessionStorage
        : window.localStorage;
    }
  }
  async signIn(options: SignInOptions): Promise<AuthResult> {
    try {
      const response = await fetch(`${ this.options.apiUrl }/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: options.email,
          password: options.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: data.code || 'SIGNIN_FAILED',
            message: data.message || 'Sign in failed',
          },
        };
      }

      const authResponse: JWTAuthResponse = data;

      // Store tokens
      this.setToken(authResponse.accessToken);
      if (authResponse.refreshToken) {
        this.setRefreshToken(authResponse.refreshToken);
      }

      return {
        user: authResponse.user,
        session: {
          user: authResponse.user,
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          expiresAt: new Date(Date.now() + authResponse.expiresIn * 1000),
        },
      };
    } catch (error) {
      return {
        error: AuthError.providerError('JWT sign in failed', error),
      };
    }
  }
  async signUp(options: SignUpOptions): Promise<AuthResult> {
    try {
      const response = await fetch(`${ this.options.apiUrl }/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: options.email,
          password: options.password,
          name: options.name,
          metadata: options.metadata,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: data.code || 'SIGNUP_FAILED',
            message: data.message || 'Sign up failed',
          },
        };
      }

      const authResponse: JWTAuthResponse = data;

      // Store tokens
      this.setToken(authResponse.accessToken);
      if (authResponse.refreshToken) {
        this.setRefreshToken(authResponse.refreshToken);
      }

      return {
        user: authResponse.user,
        session: {
          user: authResponse.user,
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          expiresAt: new Date(Date.now() + authResponse.expiresIn * 1000),
        },
      };
    } catch (error) {
      return {
        error: AuthError.providerError('JWT sign up failed', error),
      };
    }
  }
  async signOut(): Promise<void> {
    this.removeToken();
    this.removeRefreshToken();
    // Optional: Call server to invalidate token
    try {
      await fetch(`${this.options.apiUrl}/auth/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
    } catch {
      // Ignore errors on sign out
    }
  }
  async getUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = await this.verifyToken(token);
      if (!payload) return null;

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      };
    } catch {
      return null;
    }
  }
  async getSession(): Promise<AuthSession | null> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    if (!token) return null;

    try {
      const payload = await this.verifyToken(token);
      if (!payload) return null;

      const user: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      };

      return {
        user,
        accessToken: token,
        refreshToken,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
      };
    } catch {
      return null;
    }
  }
  async refreshToken(): Promise<AuthResult> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return {
        error: AuthError.expiredToken('No refresh token available'),
      };
    }
    try {
      const response = await fetch(`${this.options.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: data.code || 'REFRESH_FAILED',
            message: data.message || 'Token refresh failed',
          },
        };
      }

      const authResponse: JWTAuthResponse = data;

      // Store new tokens
      this.setToken(authResponse.accessToken);
      if (authResponse.refreshToken) {
        this.setRefreshToken(authResponse.refreshToken);
      }

      return {
        user: authResponse.user,
        session: {
          user: authResponse.user,
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          expiresAt: new Date(Date.now() + authResponse.expiresIn * 1000),
        },
      };
    } catch (error) {
      return {
        error: AuthError.providerError('Token refresh failed', error),
      };
    }
  }
  async resetPassword(email: string): Promise<void> {
    const response = await fetch(`${ this.options.apiUrl }/auth/reset-password`, {
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
    const token = this.getToken();
    if (!token) {
      throw AuthError.unauthorized('No access token');
    }
    const response = await fetch(`${this.options.apiUrl}/auth/user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const data = await response.json();
      throw AuthError.providerError(data.message || 'User update failed', data);
    }

    return await response.json();
  }
  async deleteUser(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw AuthError.unauthorized('No access token');
    }
    const response = await fetch(`${this.options.apiUrl}/auth/user`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw AuthError.providerError(data.message || 'User deletion failed', data);
    }

    this.signOut();
  }
  private async verifyToken(token: string): Promise<JWTTokenPayload | null> {
    try {
      if (!this.options.jwtSecret) {
        throw new Error('JWT secret not configured');
      }
      const secret = new TextEncoder().encode(this.options.jwtSecret);
      const { payload } = await jwtVerify(token, secret);

      return payload as JWTTokenPayload;
    } catch {
      return null;
    }
  }
  private getToken(): string | null {
    if (!this.storage) return null;
    return this.storage.getItem(this.options.storageKey!);
  }
  private setToken(token: string): void {
    if (this.storage) {
      this.storage.setItem(this.options.storageKey!, token);
    }
  }
  private removeToken(): void {
    if (this.storage) {
      this.storage.removeItem(this.options.storageKey!);
    }
  }
  private getRefreshToken(): string | null {
    if (!this.storage) return null;
    return this.storage.getItem(this.options.refreshStorageKey!);
  }
  private setRefreshToken(token: string): void {
    if (this.storage) {
      this.storage.setItem(this.options.refreshStorageKey!, token);
    }
  }
  private removeRefreshToken(): void {
    if (this.storage) {
      this.storage.removeItem(this.options.refreshStorageKey!);
    }
  }
}
export function createJWTAuth(options?: JWTAuthOptions): JWTAuthClient {
  return new JWTAuthClient(options);
}
