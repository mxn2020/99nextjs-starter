
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { redirect } from 'next/navigation'
import OnboardingStep1Form from '@/components/onboarding/OnboardingStep1Form'
import OnboardingStep2Form from '@/components/onboarding/OnboardingStep2Form'
import OnboardingStep3Form from '@/components/onboarding/OnboardingStep3Form'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/server/onboarding.actions', () => ({
  saveOnboardingStep1: jest.fn(),
  saveOnboardingStep2: jest.fn(),
  saveOnboardingStep3: jest.fn(),
  skipOnboardingStep: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

describe('Onboarding Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Step 1 - Profile Basics', () => {
    const defaultProps = {
      userId: '123',
      currentDisplayName: '',
      currentAvatarUrl: null,
    }

    it('should complete step 1 and proceed to step 2', async () => {
      const { saveOnboardingStep1 } = require('@/server/onboarding.actions')
      saveOnboardingStep1.mockImplementation(() => {
        const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
        mockRedirect('/onboarding/step2')
        return Promise.resolve({ success: true })
      })

      render(<OnboardingStep1Form {...defaultProps} />)
      
      const displayNameInput = screen.getByLabelText(/display name/i)
      const submitButton = screen.getByRole('button', { name: /save and continue/i })
      
      fireEvent.change(displayNameInput, { target: { value: 'John Doe' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(saveOnboardingStep1).toHaveBeenCalled()
      })
    })

    it('should allow skipping step 1', async () => {
      const { skipOnboardingStep } = require('@/server/onboarding.actions')
      skipOnboardingStep.mockResolvedValue({ success: true })

      render(<OnboardingStep1Form {...defaultProps} />)
      
      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      fireEvent.click(skipButton)
      
      await waitFor(() => {
        expect(skipOnboardingStep).toHaveBeenCalledWith(1)
      })
    })

    it('should handle validation errors in step 1', async () => {
      const { saveOnboardingStep1 } = require('@/server/onboarding.actions')
      saveOnboardingStep1.mockReturnValue(Promise.resolve({
        message: 'Validation failed',
        success: false,
        errors: {
          display_name: ['Display name too short']
        }
      }))

      render(<OnboardingStep1Form {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /save and continue/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Display name too short')).toBeInTheDocument()
      })
    })
  })

  describe('Step 2 - Preferences', () => {
    const defaultProps = {
      userId: '123',
      currentPreferences: {},
    }

    it('should complete step 2 and proceed to step 3', async () => {
      const { saveOnboardingStep2 } = require('@/server/onboarding.actions')
      saveOnboardingStep2.mockImplementation(() => {
        const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
        mockRedirect('/onboarding/step3')
        return Promise.resolve({ success: true })
      })

      render(<OnboardingStep2Form {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /save and continue/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(saveOnboardingStep2).toHaveBeenCalled()
      })
    })

    it('should handle preference selections', async () => {
      const { saveOnboardingStep2 } = require('@/server/onboarding.actions')
      saveOnboardingStep2.mockResolvedValue({ success: true })

      render(<OnboardingStep2Form {...defaultProps} />)
      
      // Toggle notifications
      const notificationsToggle = screen.getByRole('switch')
      fireEvent.click(notificationsToggle)
      
      // Select contact method
      const emailRadio = screen.getByLabelText(/email/i)
      fireEvent.click(emailRadio)
      
      // Select language
      const languageSelect = screen.getByRole('combobox')
      fireEvent.click(languageSelect)
      
      const submitButton = screen.getByRole('button', { name: /save and continue/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(saveOnboardingStep2).toHaveBeenCalled()
      })
    })
  })

  describe('Step 3 - Customization', () => {
    const defaultProps = {
      userId: '123',
      currentPreferences: {},
    }

    it('should complete step 3 and proceed to confirmation', async () => {
      const { saveOnboardingStep3 } = require('@/server/onboarding.actions')
      saveOnboardingStep3.mockImplementation(() => {
        const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
        mockRedirect('/onboarding/step4')
        return Promise.resolve({ success: true })
      })

      render(<OnboardingStep3Form {...defaultProps} />)
      
      const bioTextarea = screen.getByLabelText(/short bio/i)
      const submitButton = screen.getByRole('button', { name: /save and continue/i })
      
      fireEvent.change(bioTextarea, { target: { value: 'I am a developer' } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(saveOnboardingStep3).toHaveBeenCalled()
      })
    })

    it('should handle beta access and privacy settings', async () => {
      const { saveOnboardingStep3 } = require('@/server/onboarding.actions')
      saveOnboardingStep3.mockResolvedValue({ success: true })

      render(<OnboardingStep3Form {...defaultProps} />)
      
      // Toggle beta access
      const betaAccessCheckbox = screen.getByRole('checkbox')
      fireEvent.click(betaAccessCheckbox)
      
      // Select privacy level
      const privateRadio = screen.getByLabelText(/private/i)
      fireEvent.click(privateRadio)
      
      const submitButton = screen.getByRole('button', { name: /save and continue/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(saveOnboardingStep3).toHaveBeenCalled()
      })
    })

    it('should validate bio length', async () => {
      const { saveOnboardingStep3 } = require('@/server/onboarding.actions')
      saveOnboardingStep3.mockReturnValue(Promise.resolve({
        message: 'Validation failed',
        success: false,
        errors: {
          bio: ['Bio cannot exceed 250 characters']
        }
      }))

      render(<OnboardingStep3Form {...defaultProps} />)
      
      const bioTextarea = screen.getByLabelText(/short bio/i)
      const submitButton = screen.getByRole('button', { name: /save and continue/i })
      
      fireEvent.change(bioTextarea, { target: { value: 'A'.repeat(251) } })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Bio cannot exceed 250 characters')).toBeInTheDocument()
      })
    })
  })

  describe('Complete Onboarding Flow', () => {
    it('should handle sequential completion of all steps', async () => {
      const actions = require('@/server/onboarding.actions')
      
      // Mock each step to redirect to next
      actions.saveOnboardingStep1.mockImplementation(() => {
        const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
        mockRedirect('/onboarding/step2')
        return Promise.resolve({ success: true })
      })
      
      actions.saveOnboardingStep2.mockImplementation(() => {
        const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
        mockRedirect('/onboarding/step3')
        return Promise.resolve({ success: true })
      })
      
      actions.saveOnboardingStep3.mockImplementation(() => {
        const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
        mockRedirect('/onboarding/step4')
        return Promise.resolve({ success: true })
      })

      // Test step 1
      const { rerender } = render(
        <OnboardingStep1Form 
          userId="123" 
          currentDisplayName="" 
          currentAvatarUrl={null} 
        />
      )
      
      fireEvent.change(screen.getByLabelText(/display name/i), { 
        target: { value: 'John Doe' } 
      })
      fireEvent.click(screen.getByRole('button', { name: /save and continue/i }))
      
      await waitFor(() => {
        expect(actions.saveOnboardingStep1).toHaveBeenCalled()
      })

      // Test step 2
      rerender(
        <OnboardingStep2Form 
          userId="123" 
          currentPreferences={{}} 
        />
      )
      
      fireEvent.click(screen.getByRole('button', { name: /save and continue/i }))
      
      await waitFor(() => {
        expect(actions.saveOnboardingStep2).toHaveBeenCalled()
      })

      // Test step 3
      rerender(
        <OnboardingStep3Form 
          userId="123" 
          currentPreferences={{}} 
        />
      )
      
      fireEvent.click(screen.getByRole('button', { name: /save and continue/i }))
      
      await waitFor(() => {
        expect(actions.saveOnboardingStep3).toHaveBeenCalled()
      })
    })
  })
})
