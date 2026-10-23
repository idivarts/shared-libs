export type Attachment = {
    type: "image" | "video" | "reel";
    appleUrl?: string;
    playUrl?: string;
    imageUrl?: string;
    /**
     * Small WebP copy of `imageUrl`, written by the render worker.
     *
     * A rendered slide is a 1080px PNG, and the places that show it most often
     * — the slide strip, the calendar — draw it at ~128px. Loading megabytes to
     * paint a thumbnail is the single most wasteful thing the app does with
     * rendered media. Always optional: uploads and older renders have none, so
     * every reader falls back to `imageUrl`.
     */
    thumbUrl?: string;
};
