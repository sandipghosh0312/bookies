'use client';

import { useSession } from '@clerk/nextjs';
import {
  getLimitsForPlan,
  getPlanKey,
  PLAN_LIMITS,
  PlanKey,
  PlanLimits,
} from '@/lib/subscriptions-constants';

export interface SubscriptionState {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  plan: PlanKey;
  limits: PlanLimits;
  planSlug: 'standard' | 'premium' | null;
}

export const useSubscription = (): SubscriptionState => {
  const { isLoaded, isSignedIn, session } = useSession();

  if (!isLoaded || !isSignedIn || !session) {
    return {
      isLoaded,
      isSignedIn,
      plan: 'FREE',
      limits: PLAN_LIMITS.FREE,
      planSlug: null,
    };
  }

  // Clerk JS Billing exposes checkAuthorization on the session object.
  const anySession: any = session;
  const checkAuthorization =
    typeof anySession.checkAuthorization === 'function'
      ? anySession.checkAuthorization.bind(anySession)
      : undefined;

  let planSlug: 'standard' | 'premium' | null = null;

  if (checkAuthorization) {
    if (checkAuthorization({ plan: 'premium' })) {
      planSlug = 'premium';
    } else if (checkAuthorization({ plan: 'standard' })) {
      planSlug = 'standard';
    }
  }

  const limits = getLimitsForPlan(planSlug);
  const plan = getPlanKey(planSlug);

  return {
    isLoaded,
    isSignedIn,
    plan,
    limits,
    planSlug,
  };
};

export default useSubscription;

