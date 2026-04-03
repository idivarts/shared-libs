/**
 * Grabs one frame from a remote video URL in the browser (for carousel posters).
 * Requires CORS headers on the video response; otherwise canvas is tainted and this returns null.
 */
export function captureVideoFrameAsDataUrl(videoUrl: string): Promise<string | null> {
    if (typeof document === "undefined") {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";

        const timeoutId = window.setTimeout(() => {
            teardown();
            resolve(null);
        }, 18_000);

        const teardown = () => {
            window.clearTimeout(timeoutId);
            video.onloadedmetadata = null;
            video.onseeked = null;
            video.onerror = null;
            video.removeAttribute("src");
            video.load();
        };

        const fail = () => {
            teardown();
            resolve(null);
        };

        video.onerror = () => fail();

        video.onloadedmetadata = () => {
            try {
                const d = video.duration;
                const t =
                    Number.isFinite(d) && d > 0
                        ? Math.min(0.5, Math.max(0.05, d * 0.05))
                        : 0.1;
                video.currentTime = t;
            } catch {
                fail();
            }
        };

        video.onseeked = () => {
            try {
                const w = video.videoWidth;
                const h = video.videoHeight;
                if (!w || !h) {
                    fail();
                    return;
                }
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    fail();
                    return;
                }
                ctx.drawImage(video, 0, 0, w, h);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
                teardown();
                resolve(dataUrl);
            } catch {
                fail();
            }
        };

        video.src = videoUrl;
    });
}
