export type PlanId = 'free' | 'standard' | 'premium';

export type PlanKey = 'FREE' | 'STANDARD' | 'PRO';

export interface PlanLimits {
  maxBooks: number;
  maxSessionsPerMonth: number | 'unlimited';
  maxMinutesPerSession: number;
}

export const PLAN_SLUGS: Record<Exclude<PlanId, 'free'>, PlanKey> = {
  standard: 'STANDARD',
  premium: 'PRO',
};

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  FREE: {
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxMinutesPerSession: 5,
  },
  STANDARD: {
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxMinutesPerSession: 15,
  },
  PRO: {
    maxBooks: 100,
    maxSessionsPerMonth: 'unlimited',
    maxMinutesPerSession: 60,
  },
};

// Aliases used by shared types
export type PlanType = PlanKey;
export const PLANS = PLAN_LIMITS;

export const getCurrentBillingPeriodStart = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export const getPlanKey = (planSlug?: string | null): PlanKey => {
  if (!planSlug) return 'FREE';
  if (planSlug === 'standard') return 'STANDARD';
  if (planSlug === 'premium') return 'PRO';
  return 'FREE';
};

export const getLimitsForPlan = (planSlug?: string | null): PlanLimits => {
  return PLAN_LIMITS[getPlanKey(planSlug)];
};
