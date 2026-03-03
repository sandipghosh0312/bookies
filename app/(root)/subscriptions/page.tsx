'use client';

import { PricingTable } from '@clerk/nextjs';
import { useSubscription } from '@/hooks/useSubscription';

const SubscriptionsPage = () => {
  const { isLoaded, plan, limits } = useSubscription();

  return (
    <main className="clerk-subscriptions">
      <section className="w-full max-w-4xl mx-auto text-center mb-10">
        <h1 className="page-title-xl">Choose the right plan for your reading</h1>
        <p className="mt-4 text-lg text-(--text-secondary) max-w-2xl mx-auto">
          Start for free with 1 book and short sessions. Upgrade when you&apos;re ready for a bigger
          library and longer conversations.
        </p>

        <div className="mt-6 inline-flex items-center justify-center gap-3 px-4 py-2 rounded-full bg-(--bg-secondary) border border-(--border-subtle) shadow-soft-sm">
          <span className="text-sm font-semibold text-(--text-primary)">
            Current plan:&nbsp;
            <span className="font-bold">
              {!isLoaded ? 'Loading…' : plan === 'FREE' ? 'Free' : plan === 'STANDARD' ? 'Standard' : 'Pro'}
            </span>
          </span>
          <span className="hidden sm:inline text-sm text-(--text-secondary)">
            {!isLoaded ? 'Loading limits…'
              : `${limits.maxBooks} books · ${limits.maxSessionsPerMonth === 'unlimited'
                     ? 'Unlimited sessions'
                    : `${limits.maxSessionsPerMonth} sessions / month`
                } · ${limits.maxMinutesPerSession} min / session`}
          </span>
        </div>
      </section>

      <section className="w-full max-w-5xl mx-auto">
        <div className="clerk-pricing-table-wrapper">
          <PricingTable />
        </div>
      </section>
    </main>
  );
};

export default SubscriptionsPage;

