import { isConfigured, MARKETING } from '@/shared-constants/marketing';
import { useEffect } from 'react';

/**
 * Injects marketing/retargeting pixel scripts into the document head.
 * Web-only — the .native.tsx counterpart returns null on iOS/Android.
 * Each pixel fires only when its ID is configured in constants/marketing.ts.
 *
 * Note: GA4 is already handled by Firebase Analytics (firebase-config.js).
 * This component adds Meta, Google Ads, LinkedIn, Twitter, and Clarity on top.
 */
export default function MarketingPixels() {
    useEffect(() => {
        if (typeof document === 'undefined') return;

        // ── Meta (Facebook / Instagram) Pixel ──────────────────────────────────
        if (isConfigured(MARKETING.META_PIXEL_ID)) {
            const s = document.createElement('script');
            s.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${MARKETING.META_PIXEL_ID}');
        fbq('track','PageView');
      `;
            document.head.appendChild(s);
        }

        // ── Google Ads (remarketing on top of existing Firebase/GA4) ───────────
        if (isConfigured(MARKETING.GOOGLE_ADS_ID)) {
            const ext = document.createElement('script');
            ext.async = true;
            ext.src = `https://www.googletagmanager.com/gtag/js?id=${MARKETING.GOOGLE_ADS_ID}`;
            ext.onload = () => {
                const init = document.createElement('script');
                init.innerHTML = `
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','${MARKETING.GOOGLE_ADS_ID}');
        `;
                document.head.appendChild(init);
            };
            document.head.appendChild(ext);
        }

        // ── LinkedIn Insight Tag ────────────────────────────────────────────────
        if (isConfigured(MARKETING.LINKEDIN_PARTNER_ID)) {
            const s = document.createElement('script');
            s.innerHTML = `
        _linkedin_partner_id="${MARKETING.LINKEDIN_PARTNER_ID}";
        window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
        (function(l){
          if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[];}
          var s=document.getElementsByTagName("script")[0];
          var b=document.createElement("script");
          b.type="text/javascript";b.async=true;
          b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
          s.parentNode.insertBefore(b,s);
        })(window.lintrk);
      `;
            document.head.appendChild(s);
        }

        // ── Twitter / X Pixel ──────────────────────────────────────────────────
        if (isConfigured(MARKETING.TWITTER_PIXEL_ID)) {
            const s = document.createElement('script');
            s.innerHTML = `
        !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):
        s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,
        u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],
        a.parentNode.insertBefore(u,a))}(window,document,'script');
        twq('config','${MARKETING.TWITTER_PIXEL_ID}');
      `;
            document.head.appendChild(s);
        }

        // ── Microsoft Clarity ──────────────────────────────────────────────────
        if (isConfigured(MARKETING.CLARITY_PROJECT_ID)) {
            const s = document.createElement('script');
            s.innerHTML = `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script","${MARKETING.CLARITY_PROJECT_ID}");
      `;
            document.head.appendChild(s);
        }
    }, []);

    return null;
}
