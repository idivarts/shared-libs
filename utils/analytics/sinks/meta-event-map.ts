/**
 * Maps Trendly funnel events onto Meta's standard event vocabulary.
 *
 * Kept separate from the sink so the mapping is reviewable on its own — these
 * names are an external contract with the ad account, and changing one silently
 * breaks whatever campaign optimises against it.
 */
interface MetaEvent {
    name: string;
    /** Meta standard events use fbq('track'); custom ones need fbq('trackCustom'). */
    standard: boolean;
}

const MAP: Record<string, MetaEvent> = {
    // Top of funnel — someone showed intent to create an account.
    signup_started: { name: "InitiateCheckout", standard: false },
    // ⭐ The conversion most campaigns will optimise against at first, since
    // there is not enough subscription volume to optimise on purchase yet.
    signup_completed: { name: "CompleteRegistration", standard: true },
    // Activation — the best available proxy for "this signup was real".
    social_connected: { name: "Lead", standard: true },
    content_published: { name: "TrendlyContentPublished", standard: false },
    // Monetisation.
    checkout_started: { name: "InitiateCheckout", standard: true },
    subscription_started: { name: "Subscribe", standard: true },
};

export const getMetaEventName = (event: string): MetaEvent | null => MAP[event] ?? null;
