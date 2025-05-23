
"use client";

import { ONBOARDING_STEPS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface OnboardingStepperProps {
  currentStep: number; // The backend's current step (1-based for steps 1,2,3,4)
  totalSteps?: number; // Optional, defaults to ONBOARDING_STEPS.length
}

export default function OnboardingStepper({ currentStep, totalSteps }: OnboardingStepperProps) {
  const actualTotalSteps = totalSteps || ONBOARDING_STEPS.length;
  const pathname = usePathname();

  // Determine if onboarding is considered fully complete based on user profile data
  // (e.g. if currentStep from profile is 0 or > actualTotalSteps, meaning completion)
  const isEffectivelyCompleted = currentStep === 0 || currentStep > actualTotalSteps;


  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-start justify-between">
        {ONBOARDING_STEPS.map((step, stepIdx) => {
          const isCompleted = isEffectivelyCompleted || step.id < currentStep;
          const isCurrent = !isEffectivelyCompleted && (step.id === currentStep || pathname === step.path);
          // Enable link if step is completed or is current, or if previous steps are completed
          // Essentially, allow going back to any completed step.
          const canNavigate = isCompleted || (isCurrent && step.id <= currentStep);


          return (
            <li key={step.name} className={cn("relative text-center", stepIdx !== actualTotalSteps - 1 ? "flex-1" : "")}>
              {/* Connector line */}
              {stepIdx > 0 && (
                <div className="absolute inset-0 flex items-center -z-10" aria-hidden="true" style={{left: 'calc(-50% + 1rem)', right: 'calc(50% + 1rem)'}}>
                  <div className={cn("h-0.5 w-full", isCompleted || isCurrent ? "bg-primary" : "bg-border")} />
                </div>
              )}

              <Link
                href={canNavigate ? step.path : '#'}
                className={cn(
                  "relative flex flex-col items-center w-full",
                  !canNavigate && "cursor-not-allowed opacity-60"
                )}
                onClick={(e) => !canNavigate && e.preventDefault()}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  isCompleted ? "bg-primary border-primary hover:bg-primary/90" :
                  isCurrent ? "border-primary bg-background" :
                  "border-border bg-background group-hover:border-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  ) : (
                    <span className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      isCurrent ? "bg-primary" : "bg-transparent group-hover:bg-muted-foreground"
                    )} aria-hidden="true" />
                  )}
                </div>
                <span className={cn(
                  "mt-2 text-xs font-medium truncate block",
                  isCompleted ? "text-primary" :
                  isCurrent ? "text-primary font-semibold" :
                  "text-muted-foreground"
                )}>
                  {step.name}
                </span>
                <span className="sr-only">
                  {step.name} - {isCompleted ? "Completed" : isCurrent ? "Current" : "Upcoming"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
    