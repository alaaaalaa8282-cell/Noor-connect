import { useEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github, DownloadCloud, AlertCircle, Sparkles, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const GITHUB_LATEST_RELEASE_API =
    "https://api.github.com/repos/darkmaster0345/Noor-connect/releases/latest";

const STORAGE_KEYS = {
    lastCheckedAt: "noorconnect:update:lastCheckedAt",
    etag: "noorconnect:update:etag",
    lastReleaseJson: "noorconnect:update:lastReleaseJson",
    skippedTag: "noorconnect:update:skippedTag",
    retryWindowStartAt: "noorconnect:update:retryWindowStartAt",
    retryCount: "noorconnect:update:retryCount",
    lastErrorToastAt: "noorconnect:update:lastErrorToastAt",
} as const;

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RETRY_DELAYS_MS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000] as const; // 5m, 15m, 1h

type GithubReleaseAsset = {
    name: string;
    browser_download_url: string;
};

type GithubRelease = {
    tag_name: string;
    html_url: string;
    body?: string | null;
    assets?: GithubReleaseAsset[];
};

const isProbablyOnline = () => {
    // navigator.onLine exists in browsers and in Capacitor WebViews; treat "unknown" as online.
    if (typeof navigator === "undefined") return true;
    if (typeof navigator.onLine !== "boolean") return true;
    return navigator.onLine;
};

const safeJsonParse = <T,>(value: string | null): T | null => {
    if (!value) return null;
    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
};

const getNow = () => Date.now();

const shouldCheckUpdates = () => {
    const platform = Capacitor.getPlatform();
    // Native: android/ios. Web/desktop: anything not native.
    return ["android", "ios"].includes(platform) || !Capacitor.isNativePlatform();
};

type ParsedSemver = {
    major: number;
    minor: number;
    patch: number;
    prerelease: Array<string | number> | null;
};

const parseSemverLoose = (input: string): ParsedSemver | null => {
    const v = (input || "").trim();
    if (!v) return null;

    // Strip leading "v" and whitespace.
    const normalized = v.replace(/^v\s*/i, "");

    // semver-ish: 1.2.3[-prerelease][+build]
    const match = normalized.match(
        /^(?<major>\d+)(?:\.(?<minor>\d+))?(?:\.(?<patch>\d+))?(?:-(?<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
    );
    if (!match?.groups?.major) return null;

    const major = Number(match.groups.major);
    const minor = Number(match.groups.minor ?? "0");
    const patch = Number(match.groups.patch ?? "0");
    if (!Number.isFinite(major) || !Number.isFinite(minor) || !Number.isFinite(patch)) return null;

    const prereleaseRaw = match.groups.prerelease;
    const prerelease = prereleaseRaw
        ? prereleaseRaw.split(".").map((id) => (/^\d+$/.test(id) ? Number(id) : id))
        : null;

    return { major, minor, patch, prerelease };
};

// Returns 1 if a>b, -1 if a<b, 0 if equal/unknown.
const compareVersions = (a: string, b: string) => {
    const pa = parseSemverLoose(a);
    const pb = parseSemverLoose(b);

    // Best-effort fallback when semver parsing fails.
    if (!pa || !pb) {
        const extractNums = (s: string) =>
            (s || "")
                .replace(/^v/i, "")
                .split(/[^0-9]+/g)
                .filter(Boolean)
                .map((n) => Number(n))
                .filter((n) => Number.isFinite(n));
        const na = extractNums(a);
        const nb = extractNums(b);
        const len = Math.max(na.length, nb.length);
        for (let i = 0; i < len; i++) {
            const va = na[i] ?? 0;
            const vb = nb[i] ?? 0;
            if (va > vb) return 1;
            if (va < vb) return -1;
        }
        return 0;
    }

    if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1;
    if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1;
    if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;

    // Release > prerelease.
    if (!pa.prerelease && pb.prerelease) return 1;
    if (pa.prerelease && !pb.prerelease) return -1;
    if (!pa.prerelease && !pb.prerelease) return 0;

    const ra = pa.prerelease ?? [];
    const rb = pb.prerelease ?? [];
    const len = Math.max(ra.length, rb.length);
    for (let i = 0; i < len; i++) {
        const ia = ra[i];
        const ib = rb[i];
        if (ia === undefined) return -1; // shorter prerelease has lower precedence
        if (ib === undefined) return 1;
        if (typeof ia === "number" && typeof ib === "number") {
            if (ia > ib) return 1;
            if (ia < ib) return -1;
            continue;
        }
        if (typeof ia === "number" && typeof ib === "string") return -1; // numeric < non-numeric
        if (typeof ia === "string" && typeof ib === "number") return 1;
        const sa = String(ia);
        const sb = String(ib);
        if (sa > sb) return 1;
        if (sa < sb) return -1;
    }
    return 0;
};

// Returns true if latest > current
const isNewerVersion = (latest: string, current: string) => compareVersions(latest, current) === 1;

export function AppUpdatePrompt() {
    const [updateInfo, setUpdateInfo] = useState<{
        tag: string;
        version: string;
        actionUrl: string;
        actionLabel: string;
        releaseNotes: string;
        isUrgent: boolean;
    } | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const inFlightRef = useRef(false);
    const scheduledTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
    const lastAttemptAtRef = useRef(0);

    useEffect(() => {
        if (!shouldCheckUpdates()) return;

        let cancelled = false;
        let appListenerHandle: { remove: () => void } | null = null;

        const clearScheduledTimeouts = () => {
            for (const t of scheduledTimeoutsRef.current) clearTimeout(t);
            scheduledTimeoutsRef.current = [];
        };

        const scheduleRetry = (delayMs: number) => {
            clearScheduledTimeouts();
            const t = setTimeout(() => void checkWithRetry(), delayMs);
            scheduledTimeoutsRef.current.push(t);
        };

        const getRetryState = () => {
            const now = getNow();
            const windowStartAt = Number(localStorage.getItem(STORAGE_KEYS.retryWindowStartAt) || "0");
            const retryCount = Number(localStorage.getItem(STORAGE_KEYS.retryCount) || "0");
            if (!windowStartAt || now - windowStartAt >= CHECK_INTERVAL_MS) {
                localStorage.setItem(STORAGE_KEYS.retryWindowStartAt, String(now));
                localStorage.setItem(STORAGE_KEYS.retryCount, "0");
                return { windowStartAt: now, retryCount: 0 };
            }
            return { windowStartAt, retryCount };
        };

        const bumpRetryCount = () => {
            const { retryCount } = getRetryState();
            const next = retryCount + 1;
            localStorage.setItem(STORAGE_KEYS.retryCount, String(next));
            return next;
        };

        const maybeToastUpdateCheckFailed = (details?: string) => {
            const now = getNow();
            const lastToastAt = Number(localStorage.getItem(STORAGE_KEYS.lastErrorToastAt) || "0");
            if (lastToastAt && now - lastToastAt < CHECK_INTERVAL_MS) return;

            localStorage.setItem(STORAGE_KEYS.lastErrorToastAt, String(now));
            toast({
                title: "Update Check Failed",
                description: details || "Please try again later.",
                variant: "destructive",
            });
        };

        const resolveCurrentVersion = async () => {
            // Prefer Capacitor native version; fall back to build-time injected version for web.
            try {
                const info = await CapacitorApp.getInfo();
                if (info?.version) return info.version;
            } catch {
                // ignore - expected on some web contexts
            }
            return typeof __APP_VERSION__ === "string" && __APP_VERSION__ ? __APP_VERSION__ : "";
        };

        const chooseAction = (release: GithubRelease) => {
            const platform = Capacitor.getPlatform();
            const isNative = Capacitor.isNativePlatform();
            const releasePageUrl =
                release.html_url ||
                "https://github.com/darkmaster0345/Noor-connect/releases/latest";

            // Native iOS: prefer App Store/TestFlight if configured.
            if (isNative && platform === "ios") {
                const storeUrl = (import.meta as any)?.env?.VITE_IOS_APP_STORE_URL as string | undefined;
                if (storeUrl) return { actionUrl: storeUrl, actionLabel: "Open App Store" };
                return { actionUrl: releasePageUrl, actionLabel: "View Release" };
            }

            // Native Android: prefer APK, fallback to release page.
            if (isNative && platform === "android") {
                const apkAsset = release.assets?.find((a) => a?.name?.toLowerCase().endsWith(".apk"));
                if (apkAsset?.browser_download_url) {
                    return { actionUrl: apkAsset.browser_download_url, actionLabel: "Download APK" };
                }
                return { actionUrl: releasePageUrl, actionLabel: "View Release" };
            }

            // Web/desktop: redirect to the release page.
            return { actionUrl: releasePageUrl, actionLabel: "View Release" };
        };

        const fetchLatestRelease = async (): Promise<{ release: GithubRelease; etag?: string } | null> => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15_000);

            try {
                const etag = localStorage.getItem(STORAGE_KEYS.etag);
                const headers: Record<string, string> = {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                };
                if (etag) headers["If-None-Match"] = etag;

                const response = await fetch(GITHUB_LATEST_RELEASE_API, {
                    headers,
                    signal: controller.signal,
                    cache: "no-store",
                });

                if (response.status === 304) {
                    localStorage.setItem(STORAGE_KEYS.lastCheckedAt, String(getNow()));
                    const cached = safeJsonParse<GithubRelease>(localStorage.getItem(STORAGE_KEYS.lastReleaseJson));
                    if (cached?.tag_name) return { release: cached, etag: etag || undefined };
                    return null;
                }

                const rateRemaining = response.headers.get("X-RateLimit-Remaining");
                const rateReset = response.headers.get("X-RateLimit-Reset"); // epoch seconds
                if (response.status === 403 && rateRemaining === "0" && rateReset) {
                    const resetAtMs = Number(rateReset) * 1000;
                    const delay = Math.max(0, resetAtMs - getNow()) + 5_000;
                    throw new Error(`rate_limited:${delay}`);
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} ${response.statusText}`);
                }

                const data = (await response.json()) as GithubRelease;
                if (!data?.tag_name) throw new Error("Invalid GitHub release response (missing tag_name)");

                const newEtag = response.headers.get("ETag") || undefined;
                localStorage.setItem(STORAGE_KEYS.lastCheckedAt, String(getNow()));
                localStorage.setItem(STORAGE_KEYS.lastReleaseJson, JSON.stringify(data));
                if (newEtag) localStorage.setItem(STORAGE_KEYS.etag, newEtag);

                return { release: data, etag: newEtag };
            } catch (e: any) {
                if (e?.name === "AbortError") throw new Error("timeout");
                throw e;
            } finally {
                clearTimeout(timeout);
            }
        };

        const maybeShowPromptFromRelease = async (release: GithubRelease) => {
            const currentVersion = await resolveCurrentVersion();
            const latestTag = release.tag_name;
            const skippedTag = localStorage.getItem(STORAGE_KEYS.skippedTag) || "";
            const isUrgent = release.body?.toLowerCase().includes("[urgent]") || false;

            if (!isUrgent && skippedTag && skippedTag === latestTag) return;
            if (!currentVersion) return;

            if (isNewerVersion(latestTag, currentVersion)) {
                const { actionUrl, actionLabel } = chooseAction(release);
                setUpdateInfo({
                    tag: latestTag,
                    version: latestTag.replace(/^v/i, ""),
                    actionUrl,
                    actionLabel,
                    releaseNotes:
                        release.body?.replace(/\[urgent\]/gi, "")?.trim() ||
                        "Performance improvements and bug fixes.",
                    isUrgent,
                });
                setIsOpen(true);
            }
        };

        const performUpdateCheck = async () => {
            if (cancelled) return;
            if (inFlightRef.current) return;

            const now = getNow();
            if (now - lastAttemptAtRef.current < 10_000) return;
            lastAttemptAtRef.current = now;

            // If we've checked recently, avoid hitting the API again, but still allow prompting from cache.
            const lastCheckedAt = Number(localStorage.getItem(STORAGE_KEYS.lastCheckedAt) || "0");
            if (lastCheckedAt && now - lastCheckedAt < CHECK_INTERVAL_MS) {
                const cached = safeJsonParse<GithubRelease>(localStorage.getItem(STORAGE_KEYS.lastReleaseJson));
                if (cached?.tag_name) await maybeShowPromptFromRelease(cached);
                return;
            }

            if (!isProbablyOnline()) throw new Error("offline");

            inFlightRef.current = true;
            try {
                const result = await fetchLatestRelease();
                if (!result?.release?.tag_name) return;
                await maybeShowPromptFromRelease(result.release);
                // Reset retry count on success.
                localStorage.setItem(STORAGE_KEYS.retryCount, "0");
            } finally {
                inFlightRef.current = false;
            }
        };

        const shouldRetry = (error: unknown) => {
            const msg = typeof error === "object" && error && "message" in error ? String((error as any).message) : "";
            if (msg.includes("offline")) return true;
            if (msg.includes("timeout")) return true;
            if (msg.includes("rate_limited")) return true;
            if (msg.startsWith("HTTP 5")) return true;
            if (msg.startsWith("HTTP 429")) return true;
            // Most other 4xx errors are not transient.
            return false;
        };

        const checkWithRetry = async () => {
            try {
                await performUpdateCheck();
            } catch (error) {
                if (cancelled) return;
                console.error("Failed to check for updates:", error);

                const msg = typeof error === "object" && error && "message" in error ? String((error as any).message) : "";
                if (msg.startsWith("rate_limited:")) {
                    const delay = Number(msg.split(":")[1] || "0");
                    if (Number.isFinite(delay) && delay > 0) {
                        scheduleRetry(delay);
                        return;
                    }
                }

                if (!shouldRetry(error)) {
                    maybeToastUpdateCheckFailed();
                    return;
                }

                const retryCount = bumpRetryCount();
                if (retryCount > RETRY_DELAYS_MS.length) {
                    maybeToastUpdateCheckFailed();
                    return;
                }

                scheduleRetry(RETRY_DELAYS_MS[retryCount - 1]);
            }
        };

        // Initial check + periodic refresh (throttled internally to 24h).
        void checkWithRetry();
        const intervalId = setInterval(() => void checkWithRetry(), CHECK_INTERVAL_MS);

        // Re-check when app becomes active / browser gains focus / connectivity returns (still throttled).
        CapacitorApp.addListener("appStateChange", (state) => {
            if (state.isActive) void checkWithRetry();
        }).then((h) => {
            appListenerHandle = h;
        });
        const onFocus = () => void checkWithRetry();
        const onOnline = () => void checkWithRetry();
        window.addEventListener("focus", onFocus);
        window.addEventListener("online", onOnline);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
            clearScheduledTimeouts();
            appListenerHandle?.remove();
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("online", onOnline);
        };
    }, []);

    const handleUpdate = async () => {
        if (!updateInfo?.actionUrl) return;
        if (Capacitor.isNativePlatform()) {
            await Browser.open({ url: updateInfo.actionUrl });
            return;
        }
        window.open(updateInfo.actionUrl, "_blank");
    };

    if (!updateInfo) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && !updateInfo.isUrgent) setIsOpen(false);
        }}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-2xl [&>button]:hidden">
                <DialogTitle className="sr-only">App Update Available</DialogTitle>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                            className="relative glass-panel rounded-3xl overflow-hidden border border-white/10 bg-[#0f172a]/90 backdrop-blur-3xl shadow-[0_0_50px_rgba(30,58,138,0.5)] mx-4 sm:mx-0"
                        >
                            {/* Animated Background Gradients */}
                            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/30 rounded-full blur-[80px] pointer-events-none animate-pulse" />
                            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/30 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

                            {/* Header Image/Icon Area */}
                            <div className="relative pt-10 pb-6 px-6 flex flex-col items-center justify-center text-center">
                                {!updateInfo.isUrgent && (
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}

                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                                    className="relative mb-6"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#e0c097] to-[#d6af7e] rounded-2xl blur-xl opacity-50 animate-pulse" />
                                    <div className="relative bg-gradient-to-tr from-[#1a237e] to-[#0d47a1] border border-white/20 p-5 rounded-3xl shadow-2xl">
                                        <DownloadCloud className="w-12 h-12 text-[#e0c097]" />
                                    </div>
                                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#e0c097] animate-bounce" />
                                </motion.div>

                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                    Update Available
                                </h2>
                                <p className="text-slate-300 text-sm max-w-[280px] leading-relaxed">
                                    Experience the latest features right now. Version <span className="text-[#e0c097] font-bold px-1.5 py-0.5 bg-[#e0c097]/10 rounded-md">v{updateInfo.version}</span> is ready!
                                </p>
                            </div>

                            <div className="px-6 pb-8 space-y-6">
                                {/* Release Notes */}
                                {updateInfo.releaseNotes && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <Card className="bg-black/40 border-white/10 p-4 max-h-[140px] overflow-y-auto custom-scrollbar backdrop-blur-md rounded-2xl shadow-inner">
                                            <div className="flex items-center gap-2 mb-3 text-white">
                                                <Github className="w-4 h-4 text-[#e0c097]" />
                                                <span className="font-semibold text-xs tracking-widest uppercase text-white/80">What's New</span>
                                            </div>
                                            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                                                {updateInfo.releaseNotes}
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}

                                {/* Urgent Warning */}
                                {updateInfo.isUrgent && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-200"
                                    >
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
                                        <p className="text-sm font-medium leading-tight">
                                            This is a critical update required to continue using the app smoothly.
                                        </p>
                                    </motion.div>
                                )}

                                {/* Actions */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="space-y-3 pt-2"
                                >
                                    <Button
                                        onClick={handleUpdate}
                                        className="w-full relative group overflow-hidden bg-gradient-to-r from-[#e0c097] via-[#d6af7e] to-[#e0c097] text-black hover:opacity-100 font-bold h-14 rounded-2xl text-lg shadow-[0_0_20px_rgba(224,192,151,0.3)] transition-all active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 bg-white/30 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            {updateInfo.actionLabel || "Update Now"}
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Button>

                                    {!updateInfo.isUrgent && (
                                        <Button
                                            onClick={() => {
                                                localStorage.setItem(STORAGE_KEYS.skippedTag, updateInfo.tag);
                                                setIsOpen(false);
                                            }}
                                            variant="ghost"
                                            className="w-full h-12 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium border-0"
                                        >
                                            Skip this version
                                        </Button>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
