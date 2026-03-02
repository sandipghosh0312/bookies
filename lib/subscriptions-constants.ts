export const getCurrentBillingPeriodStart = (): Date => {
    const now = new Date();
    const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return billingPeriodStart;
}