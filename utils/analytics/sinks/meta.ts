import type { AnalyticsSink } from "../index";
import { getMetaEventName } from "./meta-event-map";

/**
 * Meta (Facebook / Instagram) Pixel sink.
 *
 * Fires only on web, where `fbq` is installed by
 * shared-libs/marketing/MarketingPixels.tsx. On native `window` is undefined
 * and every call short-circuits — native Meta conversions need the backend
 * Conversions API, which is a separate piece of work.
 *
 * Only funnel events Meta can optimise against are forwarded. Sending Meta our
 * full product taxonomy would bloat its event set without improving delivery,
 * and Meta caps how many custom conversions an account may define.
 */
const fbq = (): ((...args: any[]) => void) | null => {
    if (typeof window === "undefined") return null;
    const fn = (window as any).fbq;
    return typeof fn === "function" ? fn : null;
};

export const metaSink: AnalyticsSink = {
    name: "meta",

    track: (event, props) => {
        const mapped = getMetaEventName(event);
        if (!mapped) return;

        const send = fbq();
        if (!send) return;

        // Standard events go through 'track'; anything else must use
        // 'trackCustom' or Meta silently drops it.
        send(mapped.standard ? "track" : "trackCustom", mapped.name, {
            value: (props as any).value,
            currency: (props as any).currency,
            plan_key: (props as any).plan_key,
        });
    },
};
