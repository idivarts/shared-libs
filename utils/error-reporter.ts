/**
 * Error-reporting seam for shared-libs.
 *
 * shared-libs is consumed by BOTH trendly-brands and trendly-users, so it must
 * not import a reporting SDK directly — Metro resolves imports at bundle time,
 * so a hard `@sentry/react-native` import here would force every host app to
 * install that native dependency (and rebuild) before it could build at all.
 *
 * Instead each app registers its own reporter during startup and shared-libs
 * stays dependency-free. An app that registers nothing keeps exactly the
 * previous behaviour: console output only, no crash.
 */

export interface ErrorReporter {
    /** Report a caught error. `tag` is a coarse grouping label, e.g. "Sign out Error". */
    captureException: (error: unknown, tag?: string) => void;
    /**
     * Record a non-error trail entry. These are attached to whatever error is
     * reported next, which is what makes a stack trace diagnosable.
     */
    addBreadcrumb: (message: string, data?: unknown[]) => void;
}

let reporter: ErrorReporter | null = null;

/** Registered once by the host app at startup. Pass null to disable. */
export const setErrorReporter = (next: ErrorReporter | null): void => {
    reporter = next;
};

/** Returns the registered reporter, or null when the app registered none. */
export const getErrorReporter = (): ErrorReporter | null => reporter;
