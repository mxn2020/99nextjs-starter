
import { 
  loginSchema, 
  signupSchema, 
  onboardingStep1Schema,
  onboardingStep2Schema,
  profileUpdateSchema,
  changePasswordSchema
} from '@/lib/schemas'

describe('schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address.')
      }
    })

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required.')
      }
    })
  })

  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
      
      const result = signupSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject password mismatch', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123'
      }
      
      const result = signupSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords don't match.")
      }
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short'
      }
      
      const result = signupSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters long.')
      }
    })
  })

  describe('onboardingStep1Schema', () => {
    it('should validate correct display name', () => {
      const validData = {
        display_name: 'John Doe'
      }
      
      const result = onboardingStep1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject short display name', () => {
      const invalidData = {
        display_name: 'J'
      }
      
      const result = onboardingStep1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Display name must be at least 2 characters.')
      }
    })

    it('should reject long display name', () => {
      const invalidData = {
        display_name: 'A'.repeat(51)
      }
      
      const result = onboardingStep1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Display name too long.')
      }
    })
  })

  describe('onboardingStep2Schema', () => {
    it('should validate correct preferences', () => {
      const validData = {
        notifications_enabled: 'true',
        contact_method: 'email',
        preferred_language: 'en'
      }
      
      const result = onboardingStep2Schema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notifications_enabled).toBe(true)
      }
    })

    it('should handle boolean preprocessing', () => {
      const testCases = [
        { input: 'on', expected: true },
        { input: 'true', expected: true },
        { input: true, expected: true },
        { input: 'false', expected: false },
        { input: false, expected: false }
      ]

      testCases.forEach(({ input, expected }) => {
        const data = {
          notifications_enabled: input,
          contact_method: 'email',
          preferred_language: 'en'
        }
        
        const result = onboardingStep2Schema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.notifications_enabled).toBe(expected)
        }
      })
    })

    it('should reject invalid contact method', () => {
      const invalidData = {
        notifications_enabled: 'true',
        contact_method: 'invalid',
        preferred_language: 'en'
      }
      
      const result = onboardingStep2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('profileUpdateSchema', () => {
    it('should validate correct profile data', () => {
      const validData = {
        display_name: 'Updated Name'
      }
      
      const result = profileUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should allow empty display name', () => {
      const validData = {
        display_name: ''
      }
      
      const result = profileUpdateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject short display name', () => {
      const invalidData = {
        display_name: 'X'
      }
      
      const result = profileUpdateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    it('should validate matching passwords', () => {
      const validData = {
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123'
      }
      
      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject password mismatch', () => {
      const invalidData = {
        newPassword: 'newpassword123',
        confirmNewPassword: 'different123'
      }
      
      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("New passwords don't match.")
      }
    })

    it('should reject short password', () => {
      const invalidData = {
        newPassword: 'short',
        confirmNewPassword: 'short'
      }
      
      const result = changePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('New password must be at least 8 characters long.')
      }
    })
  })
})
