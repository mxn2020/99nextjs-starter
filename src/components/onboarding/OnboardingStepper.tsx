
"use client";

import { ONBOARDING_STEPS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import Link from 'next/link'; // Import Link
import { usePathname } from 'next/navigation'; // To highlight current step based on path

interface OnboardingStepperProps {
  currentStep: number; // The backend's current step (1-based)
  totalSteps?: number; // Optional, defaults to ONBOARDING_STEPS.length
}

export default function OnboardingStepper({ currentStep, totalSteps }: OnboardingStepperProps) {
  const actualTotalSteps = totalSteps || ONBOARDING_STEPS.length;
  const pathname = usePathname();

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-between">
        {ONBOARDING_STEPS.map((step, stepIdx) => (
          <li key={step.name} className={cn("relative", stepIdx !== actualTotalSteps - 1 ? "flex-1" : "")}>
            {step.id < currentStep || currentStep > actualTotalSteps ? ( // Step completed or onboarding finished
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <Link
                  href={step.path}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary/90"
                >
                  <Check className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  <span className="sr-only">{step.name} - Completed</span>
                </Link>
                <span className="block mt-2 text-xs text-center font-medium text-primary truncate">{step.name}</span>
              </>
            ) : step.id === currentStep || pathname === step.path ? ( // Current step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={cn("h-0.5 w-full", stepIdx === 0 ? "bg-transparent" : "bg-border")} />
                </div>
                <Link
                  href={step.path}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="sr-only">{step.name} - Current</span>
                </Link>
                 <span className="block mt-2 text-xs text-center font-semibold text-primary truncate">{step.name}</span>
              </>
            ) : ( // Future step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                   <div className={cn("h-0.5 w-full", stepIdx === 0 ? "bg-transparent" : "bg-border")} />
                </div>
                <Link
                  href={step.path}
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background hover:border-muted-foreground"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">{step.name} - Upcoming</span>
                </Link>
                <span className="block mt-2 text-xs text-center text-muted-foreground truncate">{step.name}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
    