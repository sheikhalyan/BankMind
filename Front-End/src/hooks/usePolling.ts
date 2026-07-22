import { useEffect, useRef } from "react";

/**
 * usePolling — silently re-runs a fetch function every `intervalMs`
 *
 * Rules:
 * - Never triggers a loading spinner (caller's `setLoading` is NOT called)
 * - Pauses while a modal is open (pass `paused: true` when any modal is open)
 * - Cleans up on unmount
 * - First run is immediate, then every intervalMs
 *
 * Usage:
 *   usePolling(silentFetch, { intervalMs: 5000, paused: showModal });
 */
export function usePolling(
    fn: () => Promise<void>,
    options: { intervalMs?: number; paused?: boolean; enabled?: boolean } = {}
) {
    const { intervalMs = 5000, paused = false, enabled = true } = options;
    const fnRef = useRef(fn);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Always keep ref up to date so interval always calls latest version
    useEffect(() => { fnRef.current = fn; }, [fn]);

    useEffect(() => {
        if (!enabled || paused) {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            return;
        }

        // Run immediately on mount / resume
        fnRef.current();

        timerRef.current = setInterval(() => { fnRef.current(); }, intervalMs);

        return () => {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        };
    }, [intervalMs, paused, enabled]);
}