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
 *       data-transition="fade"   how this scene ENTERS: cut | fade | push | slide
 *       data-transition-ms="400" how long that entry overlaps the scene before
 *     [data-el="id"]             an addressable element (editing + comments)
 *
 * A single post is one slide. A carousel is N slides. A video is N scenes with
 * their own CSS animations, played in sequence.
 *
 * ── Overlapping scenes ──────────────────────────────────────────────────────
 * Scenes used to hard-cut: the strip jumped by exactly one slide width and only
 * one scene was ever on screen. Every scene boundary was therefore a cut, which
 * is why multi-scene videos read as a slideshow however good the scenes were.
 *
 * A scene with an entry transition now STARTS EARLY — `data-transition-ms`
 * before the previous one ends — so the two are on screen together for that
 * window and the runtime composites them. That is the whole mechanism: the
 * overlap lives in the TIMELINE, not in a special playback mode, so seeking to
 * any instant inside a transition is exactly as deterministic as any other
 * instant, and the server render and the preview stay identical for free.
 *
 * Because the overlap is subtracted, the total is SHORTER than the sum of the
 * scene durations. `total` is the truth; nothing should add the durations up.
 *
 * ⚠️ The runtime OWNS `transform` and `opacity` on every [data-slide] element
 * and on [data-carousel] — compositing writes them on every seek and clears
 * them on the next. A design must not set either inline on a slide section
 * (animate children instead); the backend's design validator rejects one that
 * does, so this is enforced rather than hoped for.
 */

/** How a scene enters. Anything unrecognised is treated as a cut. */
export type TransitionKind = "cut" | "fade" | "push" | "slide";

export interface DesignMeasurement {
    /** Number of [data-slide] scenes (at least 1). */
    count: number;
    /** Start time of each scene in ms. Overlaps make these NON-cumulative. */
    offsets: number[];
    /** Each scene's own on-screen duration in ms. */
    durations: number[];
    /** Each scene's entry transition. Index 0 is always a cut. */
    transitions: { kind: TransitionKind; ms: number }[];
    /** Total length in ms — sum of durations MINUS the overlaps. */
    total: number;
    /** Per-slide layout size in CSS px — what a capture should be clipped to. */
    width: number;
    height: number;
}

/**
 * Measure the design: scene count, per-scene start offsets, total duration and
 * the per-slide box. Durations come from `data-duration`; a scene without one
 * falls back to 3000 ms, matching what the AI is told to emit.
 *
 * ⚠️ The timeline block below is DUPLICATED verbatim in `seekAt` and
 * `paintTransitionAt`. That is not an oversight: each function in this file is
 * serialized into the page on its own (`page.evaluate(fn)` / `fn.toString()`),
 * so a call to a sibling would be a ReferenceError inside the frame. Change one
 * copy and you must change all three — they are the same arithmetic, and a
 * measurement that disagrees with a seek is precisely the drift this file
 * exists to prevent.
 *
 * The clamp is the part worth reading: an overlap may never exceed HALF of the
 * shorter of the two scenes it joins. Without it a transition longer than the
 * outgoing scene would push the next scene's start back past it, the offsets
 * would stop increasing, and a seek would become a coin flip over which scene
 * is current. Half is also about where a cross-fade stops reading as a
 * transition and starts reading as a mistake.
 */
export function measureDesign(): DesignMeasurement {
    const scenes = Array.prototype.slice.call(
        document.querySelectorAll("[data-slide]")
    ) as HTMLElement[];
    const list = scenes.length ? scenes : [document.body];

    const durations: number[] = [];
    const transitions: { kind: TransitionKind; ms: number }[] = [];
    for (let i = 0; i < list.length; i++) {
        const raw = parseInt(list[i].getAttribute("data-duration") || "", 10);
        durations.push(raw > 0 ? raw : 3000);
        const named = (list[i].getAttribute("data-transition") || "").toLowerCase();
        const kind = (
            named === "fade" || named === "push" || named === "slide" ? named : "cut"
        ) as TransitionKind;
        const declared = parseInt(list[i].getAttribute("data-transition-ms") || "", 10);
        let ms = kind === "cut" || i === 0 ? 0 : declared > 0 ? declared : 400;
        if (ms > 0) {
            const half = Math.floor(Math.min(durations[i - 1], durations[i]) / 2);
            if (ms > half) ms = half;
        }
        transitions.push({ kind: (i === 0 ? "cut" : kind) as TransitionKind, ms });
    }
    const offsets: number[] = [];
    for (let i = 0; i < list.length; i++) {
        offsets.push(i === 0 ? 0 : offsets[i - 1] + durations[i - 1] - transitions[i].ms);
    }
    const last = list.length - 1;
    const total = offsets[last] + durations[last];

    const first = list[0];
    return {
        count: list.length,
        offsets,
        durations,
        transitions,
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
 *
 * ⚠️ STILLS AND CAROUSELS ONLY — for a video use `seekAt`. This function places
 * exactly ONE scene and snaps the strip to a whole slide index, which is right
 * for paging a carousel and right for a video whose scenes all hard-cut. It
 * cannot render a transition: an overlap means two scenes composited, and this
 * does not know the previous scene exists. Reaching for it on a video design
 * silently produces frames with every cross-fade missing.
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
 * Put the design at `args.ms` on the WHOLE video's timeline, transitions and
 * all. This is the function a renderer should seek with.
 *
 * `seekScene` positions one scene and knows nothing about its neighbours, which
 * is all a hard cut ever needed. A transition needs both scenes placed and
 * composited against each other, so it needs the global clock — hence a second
 * entry point rather than more arguments on the first.
 *
 * How the compositing works, given a strip of slides laid out left to right at
 * x = i·w: the carousel is translated so the OUTGOING scene sits in the capture
 * box, and the incoming scene — which the browser paints on top of it, being a
 * later sibling — is pulled left by one slide width to land on the same spot.
 * From there each kind is a different interpolation:
 *
 *   fade   the incoming scene's opacity ramps 0 → 1 over the overlap
 *   slide  it travels in from the right edge; the outgoing scene stays put
 *   push   both move together — the carousel sits at a FRACTIONAL slide index,
 *          which is the whole effect, so no per-scene transform is needed
 *
 * Deterministic, like `seekScene`: every animation on both scenes is paused and
 * its currentTime set, and the transition state is a pure function of `ms`. The
 * same instant always produces the same pixels.
 */
export function seekAt(args: { ms: number }): void {
    const scenes = Array.prototype.slice.call(
        document.querySelectorAll("[data-slide]")
    ) as HTMLElement[];
    const list = scenes.length ? scenes : [document.body];

    // ⚠️ Duplicated verbatim from measureDesign — see the note there.
    const durations: number[] = [];
    const transitions: { kind: TransitionKind; ms: number }[] = [];
    for (let i = 0; i < list.length; i++) {
        const raw = parseInt(list[i].getAttribute("data-duration") || "", 10);
        durations.push(raw > 0 ? raw : 3000);
        const named = (list[i].getAttribute("data-transition") || "").toLowerCase();
        const kind = (
            named === "fade" || named === "push" || named === "slide" ? named : "cut"
        ) as TransitionKind;
        const declared = parseInt(list[i].getAttribute("data-transition-ms") || "", 10);
        let ms = kind === "cut" || i === 0 ? 0 : declared > 0 ? declared : 400;
        if (ms > 0) {
            const half = Math.floor(Math.min(durations[i - 1], durations[i]) / 2);
            if (ms > half) ms = half;
        }
        transitions.push({ kind: (i === 0 ? "cut" : kind) as TransitionKind, ms });
    }
    const offsets: number[] = [];
    for (let i = 0; i < list.length; i++) {
        offsets.push(i === 0 ? 0 : offsets[i - 1] + durations[i - 1] - transitions[i].ms);
    }

    const now = args.ms;
    let index = 0;
    for (let i = 0; i < offsets.length; i++) {
        if (now >= offsets[i]) index = i;
        else break;
    }

    // The runtime owns transform/opacity on slides: clear last frame's
    // compositing before writing this one, or a scrub backwards would leave a
    // half-faded scene behind.
    for (let i = 0; i < list.length; i++) {
        list[i].style.transform = "";
        list[i].style.opacity = "";
    }

    const width = list[index] ? list[index].offsetWidth : 0;
    const entry = transitions[index];
    const inTransition = entry && entry.ms > 0 && index > 0 && now < offsets[index] + entry.ms;

    // ease-in-out cubic, so a transition accelerates away and settles in rather
    // than running at a constant speed, which always reads as mechanical.
    let eased = 1;
    if (inTransition) {
        const p = Math.max(0, Math.min(1, (now - offsets[index]) / entry.ms));
        eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    }

    const carousel = document.querySelector("[data-carousel]") as HTMLElement | null;
    if (carousel) {
        carousel.style.transition = "none";
        // During a push the strip rests between two slides; otherwise it sits on
        // the outgoing scene (mid-transition) or the current one (everywhere else).
        const at =
            inTransition && entry.kind === "push"
                ? index - 1 + eased
                : inTransition
                  ? index - 1
                  : index;
        carousel.style.transform = "translateX(" + -at * width + "px)";
    }

    if (inTransition && entry.kind !== "push") {
        const incoming = list[index];
        if (entry.kind === "fade") {
            incoming.style.transform = "translateX(" + -width + "px)";
            incoming.style.opacity = String(eased);
        } else {
            // slide: travels from the right edge onto the outgoing scene.
            incoming.style.transform = "translateX(" + -eased * width + "px)";
        }
    }

    // Seek the active scene, and the outgoing one too while both are on screen —
    // a frozen scene under a cross-fade is as wrong as no cross-fade at all.
    const seekOne = function (i: number) {
        const scene = list[i];
        if (!scene || !scene.getAnimations) return;
        const anims = scene.getAnimations({ subtree: true });
        for (let k = 0; k < anims.length; k++) {
            try {
                anims[k].pause();
                anims[k].currentTime = now - offsets[i];
            } catch (e) {
                /* an animation that refuses to seek is left where it is */
            }
        }
    };
    if (inTransition) seekOne(index - 1);
    seekOne(index);
}

/**
 * Composite the transition at `args.ms` WITHOUT touching any animation clock.
 *
 * Playback and seeking need different things here. A seek owns time completely
 * and pins every animation; playback lets the browser run the animations at
 * wall-clock speed and must not interfere, but still has to draw the overlap
 * itself, because an overlap is not something CSS can express — it is two
 * sibling scenes being placed on top of each other.
 *
 * So the preview calls `playSceneFrom` when a scene becomes active and this on
 * every frame. Returns the active scene index, which saves the caller
 * recomputing it.
 */
export function paintTransitionAt(args: { ms: number }): number {
    const scenes = Array.prototype.slice.call(
        document.querySelectorAll("[data-slide]")
    ) as HTMLElement[];
    const list = scenes.length ? scenes : [document.body];

    // ⚠️ Duplicated verbatim from measureDesign — see the note there.
    const durations: number[] = [];
    const transitions: { kind: TransitionKind; ms: number }[] = [];
    for (let i = 0; i < list.length; i++) {
        const raw = parseInt(list[i].getAttribute("data-duration") || "", 10);
        durations.push(raw > 0 ? raw : 3000);
        const named = (list[i].getAttribute("data-transition") || "").toLowerCase();
        const kind = (
            named === "fade" || named === "push" || named === "slide" ? named : "cut"
        ) as TransitionKind;
        const declared = parseInt(list[i].getAttribute("data-transition-ms") || "", 10);
        let ms = kind === "cut" || i === 0 ? 0 : declared > 0 ? declared : 400;
        if (ms > 0) {
            const half = Math.floor(Math.min(durations[i - 1], durations[i]) / 2);
            if (ms > half) ms = half;
        }
        transitions.push({ kind: (i === 0 ? "cut" : kind) as TransitionKind, ms });
    }
    const offsets: number[] = [];
    for (let i = 0; i < list.length; i++) {
        offsets.push(i === 0 ? 0 : offsets[i - 1] + durations[i - 1] - transitions[i].ms);
    }

    const now = args.ms;
    let index = 0;
    for (let i = 0; i < offsets.length; i++) {
        if (now >= offsets[i]) index = i;
        else break;
    }

    for (let i = 0; i < list.length; i++) {
        list[i].style.transform = "";
        list[i].style.opacity = "";
    }

    const width = list[index] ? list[index].offsetWidth : 0;
    const entry = transitions[index];
    const inTransition = entry && entry.ms > 0 && index > 0 && now < offsets[index] + entry.ms;

    let eased = 1;
    if (inTransition) {
        const p = Math.max(0, Math.min(1, (now - offsets[index]) / entry.ms));
        eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    }

    const carousel = document.querySelector("[data-carousel]") as HTMLElement | null;
    if (carousel) {
        carousel.style.transition = "none";
        const at =
            inTransition && entry.kind === "push"
                ? index - 1 + eased
                : inTransition
                  ? index - 1
                  : index;
        carousel.style.transform = "translateX(" + -at * width + "px)";
    }

    if (inTransition && entry.kind !== "push") {
        const incoming = list[index];
        if (entry.kind === "fade") {
            incoming.style.transform = "translateX(" + -width + "px)";
            incoming.style.opacity = String(eased);
        } else {
            incoming.style.transform = "translateX(" + -eased * width + "px)";
        }
    }
    return index;
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
