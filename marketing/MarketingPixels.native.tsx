import { isConfigured, MARKETING } from '@/shared-constants/marketing';
import * as Clarity from '@microsoft/react-native-clarity';
import { useEffect } from 'react';

/**
 * Native (iOS / Android) marketing/analytics bootstrap.
 *
 * The browser pixels live in the web counterpart (MarketingPixels.tsx). On
 * device the only SDK we run is **Microsoft Clarity** (session replay +
 * heatmaps) via @microsoft/react-native-clarity, reusing the same project ID
 * (MARKETING.CLARITY_PROJECT_ID) as the web tag.
 *
 * ⚠️ Clarity ships native code, so it only works in a real build
 * (EAS Build / dev client) — it is a silent no-op in Expo Go and on web.
 * For native attribution use Firebase Analytics (firebase-config.js) and
 * AppsFlyer when running paid UA campaigns.
 */
export default function MarketingPixels() {
    useEffect(() => {
        if (!isConfigured(MARKETING.CLARITY_PROJECT_ID)) return;

        try {
            Clarity.initialize(
                MARKETING.CLARITY_PROJECT_ID,
                __DEV__ ? { logLevel: Clarity.LogLevel.Verbose } : {}
            );
        } catch (error) {
            // Native module unavailable (e.g. Expo Go) — don't crash the app.
            console.warn('[Clarity] native init skipped:', error);
        }
    }, []);

    return null;
}
