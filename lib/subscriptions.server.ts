"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getCurrentBillingPeriodStart,
  getLimitsForPlan,
  PlanKey,
  PlanLimits,
} from "./subscriptions-constants";
import Book from "@/database/models/book.model";
import VoiceSession from "@/database/models/voice-session.model";

export interface PlanInfo {
  plan: PlanKey;
  limits: PlanLimits;
  planSlug: "standard" | "premium" | null;
}

export const getCurrentUserPlanServer = async (): Promise<PlanInfo> => {
  const { userId, has } = await auth();

  if (!userId || !has) {
    const limits = getLimitsForPlan(null);
    return { plan: "FREE", limits, planSlug: null };
  }

  if (has({ plan: "premium" })) {
    const limits = getLimitsForPlan("premium");
    return { plan: "PRO", limits, planSlug: "premium" };
  }

  if (has({ plan: "standard" })) {
    const limits = getLimitsForPlan("standard");
    return { plan: "STANDARD", limits, planSlug: "standard" };
  }

  const limits = getLimitsForPlan(null);
  return { plan: "FREE", limits, planSlug: null };
};

export const canCreateMoreBooks = async () => {
  const { userId } = await auth();

  if (!userId) {
    return {
      allowed: false,
      plan: "FREE" as PlanKey,
      currentCount: 0,
      limit: 0,
    };
  }

  const { limits, plan } = await getCurrentUserPlanServer();

  if (limits.maxBooks <= 0) {
    return {
      allowed: false,
      plan,
      currentCount: 0,
      limit: limits.maxBooks,
    };
  }

  const currentCount = await Book.countDocuments({ clerkId: userId });

  return {
    allowed: currentCount < limits.maxBooks,
    plan,
    currentCount,
    limit: limits.maxBooks,
  };
};

export const canStartNewSessionThisPeriod = async () => {
  const { userId } = await auth();

  if (!userId) {
    return {
      allowed: false,
      plan: "FREE" as PlanKey,
      currentCount: 0,
      limit: 0,
      maxDurationMinutes: 0,
    };
  }

  const { limits, plan } = await getCurrentUserPlanServer();

  if (limits.maxSessionsPerMonth === "unlimited") {
    return {
      allowed: true,
      plan,
      currentCount: 0,
      limit: Number.POSITIVE_INFINITY,
      maxDurationMinutes: limits.maxMinutesPerSession,
    };
  }

  const periodStart = getCurrentBillingPeriodStart();

  const currentCount = await VoiceSession.countDocuments({
    clerkId: userId,
    billingPeriodStart: periodStart,
  });

  return {
    allowed: currentCount < limits.maxSessionsPerMonth,
    plan,
    currentCount,
    limit: limits.maxSessionsPerMonth,
    maxDurationMinutes: limits.maxMinutesPerSession,
  };
};