'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@99packages/auth'
import { Button } from '@99packages/ui/components/button'
import { Input } from '@99packages/ui/components/input'
import { Label } from '@99packages/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@99packages/ui/components/select'
import { SupabaseUser } from '../../../../packages/auth/src/providers/supabase/types'

type OAuthProvider = "google" | "github" | "discord" | "facebook" | "twitter" | "apple";

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [accountType, setAccountType] = useState<'personal' | 'team' | 'family' | 'enterprise'>('personal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const { signUp, signInWithOAuth } = useAuth()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }
    if (!email || !fullName) {
      setError('Email and full name are required')
      setLoading(false)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }
    if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      setError('Full name can only contain letters and spaces')
      setLoading(false)
      return
    }
    if (!['personal', 'team', 'family', 'enterprise'].includes(accountType)) {
      setError('Invalid account type selected')
      setLoading(false)
      return
    }
    if (!signUp) {
      setError('Sign up is not configured')
      setLoading(false)
      return
    }
    try {

      const { user, error } = await signUp({
        email,
        password,
        name: fullName,
        account_type: accountType,
        metadata: {
          preferences: { theme: 'light' }
        }
      });

      if (error) {
        setError(error.message)
        return
      }

      if (user && !(user as SupabaseUser).email_confirmed_at) {
        setMessage('Please check your email for a confirmation link.')
      } else if (user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError(null)

    if (!signInWithOAuth) {
      setError('OAuth sign-in is not configured')
      setLoading(false)
      return
    }

    try {
      const { redirectTo, error } = await signInWithOAuth({
        provider: 'google',
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        scopes: ['email', 'profile'], // Optional: specify scopes
      });

      if (error) {
        setError(error.message);
      } else if (redirectTo) {
        // Will redirect to OAuth provider
        window.location.href = redirectTo;
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            placeholder="Enter your password"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1"
            placeholder="Confirm your password"
          />
        </div>

        <div>
          <Label htmlFor="accountType">Account Type</Label>
          <Select value={accountType} onValueChange={(value: any) => setAccountType(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 dark:bg-gray-950 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        By creating an account, you agree to our{' '}
        <a href="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
          Privacy Policy
        </a>
      </div>
    </form>
  )
}
