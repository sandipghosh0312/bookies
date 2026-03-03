'use server'
import VoiceSession from "@/database/models/voice-session.model";
import { connectToDatabase } from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import { getCurrentBillingPeriodStart } from "../subscriptions-constants";
import { canStartNewSessionThisPeriod } from "../subscriptions.server";

export const startVoiceSession = async (
    clerkId: string,
    bookId: string,
): Promise<StartSessionResult> => {
    try {
        await connectToDatabase();

        const limitsCheck = await canStartNewSessionThisPeriod(clerkId);

        if (!limitsCheck.allowed) {
            return {
                success: false,
                error:
                    limitsCheck.plan === 'FREE'
                        ? 'You have used all 5 monthly sessions on the free plan. Upgrade to continue talking to your books.'
                        : `You have reached your monthly session limit (${limitsCheck.limit}). Please wait until next month or upgrade your plan.`,
            };
        }

        const session = await VoiceSession.create({
            clerkId,
            bookId,
            startedAt: new Date(),
            billingPeriodStart: getCurrentBillingPeriodStart(),
            durationSeconds: 0,
        });

        return {
            success: true,
            sessionId: session._id.toString(),
            maxDurationMinutes: limitsCheck.maxDurationMinutes,
        };
    } catch (e) {
        console.error("Error starting the voice session ", e);
        return {
            success: false,
            error: "Failed to start the voice session.",
        };
    }
};

export const endVoiceSession = async (
    sessionId: string,
    durationSeconds: number,
): Promise<EndSessionResult> => {
    try {
        await connectToDatabase();

        const result = await VoiceSession.findByIdAndUpdate(sessionId, {
            endedAt: new Date(),
            durationSeconds,
        });

        if (!result) return { success: false, error: 'Voice session not found.' }

        return { success: true }
    } catch (e) {
        console.error('Error ending voice session', e);
        return { success: false, error: 'Failed to end voice session. Please try again later.' }
    }
}