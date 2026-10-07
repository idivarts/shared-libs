/**
 * design-runtime — the in-page contract for a Trendly HTML design.
 *
 * ONE canonical implementation of "where is this design at time T", imported by
 * both sides so they cannot disagree:
 *
 *   • the app's preview frame (iframe on web, WebView on native), which plays
 *     the design back for the user, and
 *   • the server render worker, which seeks frame by frame and screenshots.
 *
 * Preview == export is the whole point of moving rendering server-side, and the
 * only way the two could still diverge is by running different seek code. They
 * don't: this file is it.
 *
 * ── Rules for everything in here ────────────────────────────────────────────
 * Every function is SERIALIZED INTO THE PAGE — `page.evaluate(fn)` on the
 * server, `fn.toString()` inside a <script> in the preview frame. So each one
 * must be self-contained: no imports, no module-scope closure, no TypeScript
 * that needs a runtime (no enums, no decorators). Arguments and browser globals
 * only. A helper used by two functions is inlined in both, deliberately.
 *
 * ── The design format it reads ──────────────────────────────────────────────
 *   [data-carousel]              flex strip holding every scene
 *     [data-slide="N"]           one complete frame; for video, also
 *       data-duration="3000"     how long that scene is on screen, in ms
 *     [data-el="id"]             an addressable element (editing + comments)
 *
 * A single post is one slide. A carousel is N slides. A video is N scenes with
 * their own CSS animations, played in sequence — only one is ever visible.
 */

export interface DesignMeasurement {
    /** Number of [data-slide] scenes (at least 1). */
    count: number;
    /** Start time of each scene in ms, cumulative. */
    offsets: number[];
    /** Total animation length in ms (sum of scene durations). */
    total: number;
    /** Per-slide layout size in CSS px — what a capture should be clipped to. */
    width: number;
    height: number;
}

/**
 * Measure the design: scene count, per-scene start offsets, total duration and
 * the per-slide box. Durations come from `data-duration`; a scene without one
 * falls back to 3000 ms, matching what the AI is told to emit.
 */
export function measureDesign(): DesignMeasurement {
    const scenes = Array.prototype.slice.call(
        document.querySelectorAll("[data-slide]")
    ) as HTMLElement[];
    const list = scenes.length ? scenes : [document.body];
    const offsets: number[] = [];
    let total = 0;
    for (let i = 0; i < list.length; i++) {
        offsets.push(total);
        const raw = parseInt(list[i].getAttribute("data-duration") || "", 10);
        total += raw > 0 ? raw : 3000;
    }
    const first = list[0];
    return {
        count: list.length,
        offsets,
        total: total > 0 ? total : 3000,
        width: first ? first.offsetWidth : 0,
        height: first ? first.offsetHeight : 0,
    };
}

/** Which scene is on screen at `ms` into the whole video. */
export function sceneAt(offsets: number[], ms: number): number {
    let idx = 0;
    for (let i = 0; i < offsets.length; i++) {
        if (ms >= offsets[i]) idx = i;
        else break;
    }
    return idx;
}

/**
 * Put the design at scene `args.index`, `args.localMs` into that scene's own
 * timeline.
 *
 * Takes ONE object because `page.evaluate(fn, arg)` passes a single argument;
 * the preview frame calls it the same way so there is one call shape, not two.
 *
 * Deterministic by construction: every animation on the scene is PAUSED and its
 * currentTime set explicitly, so the frame depends only on the time asked for —
 * never on when the call happened or how long the previous frame took. That is
 * what makes a server render reproducible and a scrubbed preview exact.
 */
export function seekScene(args: { index: number; localMs: number }): void {
    const index = args.index;
    const localMs = args.localMs;
    const carousel = document.querySelector("[data-carousel]") as HTMLElement | null;
    const scenes = document.querySelectorAll("[data-slide]");
    const scene = scenes[index] as HTMLElement | undefined;
    if (carousel) {
        const slideWidth = scene ? scene.offsetWidth : 0;
        carousel.style.transition = "none";
        carousel.style.transform = "translateX(" + -index * slideWidth + "px)";
    }
    if (!scene || !scene.getAnimations) return;
    const anims = scene.getAnimations({ subtree: true });
    for (let i = 0; i < anims.length; i++) {
        try {
            anims[i].pause();
            anims[i].currentTime = localMs;
        } catch (e) {
            /* an animation that refuses to seek is left where it is */
        }
    }
}

/**
 * When scene `index` stops changing, in ms from its own start.
 *
 * Once a scene's entry animations finish, `animation-fill-mode` holds the end
 * state and every later frame of that scene is identical. Infinity means it
 * never settles (an infinite loop), so every frame must be captured.
 */
export function sceneSettleMs(index: number): number {
    const scene = document.querySelectorAll("[data-slide]")[index] as HTMLElement | undefined;
    if (!scene || !scene.getAnimations) return 0;
    const anims = scene.getAnimations({ subtree: true });
    let max = 0;
    for (let i = 0; i < anims.length; i++) {
        try {
            const end = anims[i].effect?.getComputedTiming().endTime;
            const ms = typeof end === "number" ? end : Number(end);
            if (!isFinite(ms)) return Infinity;
            if (ms > max) max = ms;
        } catch (e) {
            /* ignore an animation we can't time */
        }
    }
    return max;
}

/**
 * Resolve once the page has actually painted everything it is going to paint:
 * fonts loaded, every <img> settled, and two animation frames elapsed.
 *
 * Capturing before this is how an asset silently goes missing from an export —
 * a screenshot records whatever has painted so far. Each image is capped by its
 * own timeout so one stuck URL can't hang a render; a timed-out image is
 * captured as whatever it is, which is the same thing the user sees.
 */
export function waitForPaint(perImageTimeoutMs: number): Promise<void> {
    const imgs = Array.prototype.slice.call(document.querySelectorAll("img")) as HTMLImageElement[];
    const settled = imgs.map(function (im) {
        if (im.complete) return Promise.resolve();
        return new Promise<void>(function (resolve) {
            let done = false;
            const finish = function () {
                if (done) return;
                done = true;
                resolve();
            };
            im.addEventListener("load", finish);
            im.addEventListener("error", finish);
            setTimeout(finish, perImageTimeoutMs);
        });
    });
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    return Promise.all([fonts as Promise<unknown>].concat(settled as Promise<unknown>[])).then(
        function () {
            return new Promise<void>(function (resolve) {
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        resolve();
                    });
                });
            });
        }
    );
}

/**
 * Strip everything that belongs to the editor rather than the design: the
 * hover/selection outlines, and the display transform on the carousel.
 *
 * The server renders a clean document, so this is mostly a guard for revisions
 * whose saved HTML captured an outline class. It must run before any capture —
 * an outline baked into a published post is not recoverable.
 */
export function prepareForCapture(): void {
    const marked = document.querySelectorAll(".__el-hover, .__el-selected");
    for (let i = 0; i < marked.length; i++) {
        marked[i].classList.remove("__el-hover");
        marked[i].classList.remove("__el-selected");
    }
    const html = document.documentElement as HTMLElement;
    html.style.width = "auto";
    html.style.height = "auto";
    document.body.style.transform = "none";
    document.body.style.width = "auto";
    document.body.style.height = "auto";
    document.body.style.overflow = "visible";
}

/**
 * The capture box of every slide, in CSS px, after `prepareForCapture`.
 *
 * Read from the live layout rather than assumed from the revision's declared
 * width/height: if a design's own CSS disagrees with what the AI recorded, the
 * layout is the truth, and clipping to a stale number would crop the post.
 */
export function slideRects(): { x: number; y: number; width: number; height: number }[] {
    const scenes = Array.prototype.slice.call(
        document.querySelectorAll("[data-slide]")
    ) as HTMLElement[];
    const list = scenes.length ? scenes : [document.body];
    return list.map(function (el) {
        const r = el.getBoundingClientRect();
        return {
            x: r.left + window.scrollX,
            y: r.top + window.scrollY,
            width: r.width,
            height: r.height,
        };
    });
}

/**
 * Start scene `args.index` playing from `args.localMs`.
 *
 * Preview-only — the renderer never plays, it steps. It lives here anyway so
 * one file owns every way a scene can be driven: if playback and seeking
 * disagreed about what "scene N at time T" means, the preview would drift from
 * the export again, which is the whole thing this file exists to prevent.
 */
export function playSceneFrom(args: { index: number; localMs: number }): void {
    const carousel = document.querySelector("[data-carousel]") as HTMLElement | null;
    const scenes = document.querySelectorAll("[data-slide]");
    const scene = scenes[args.index] as HTMLElement | undefined;
    if (carousel) {
        const slideWidth = scene ? scene.offsetWidth : 0;
        carousel.style.transition = "none";
        carousel.style.transform = "translateX(" + -args.index * slideWidth + "px)";
    }
    if (!scene || !scene.getAnimations) return;
    const anims = scene.getAnimations({ subtree: true });
    for (let i = 0; i < anims.length; i++) {
        try {
            anims[i].currentTime = args.localMs;
            anims[i].play();
        } catch (e) {
            /* an animation that refuses to seek is left where it is */
        }
    }
}

/** Pause every animation on scene `index`, leaving it exactly where it is. */
export function pauseScene(index: number): void {
    const scene = document.querySelectorAll("[data-slide]")[index] as HTMLElement | undefined;
    if (!scene || !scene.getAnimations) return;
    const anims = scene.getAnimations({ subtree: true });
    for (let i = 0; i < anims.length; i++) {
        try {
            anims[i].pause();
        } catch (e) {
            /* ignore */
        }
    }
}
