"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: (nextUrl?: string) => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<any>;
    signupWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
    logout: () => Promise<void>;
    isPremium: boolean;
    isAdmin: boolean;
    practiceCredits: number | null;
    simulationCredits: number | null;
    history: any[];
    refreshProfile: (force?: boolean) => Promise<void>;
    renewalDate: Date | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Add initialSession to the props
export const AuthProvider = ({ children, initialSession = null }: { children: ReactNode, initialSession?: Session | null }) => {
    // Initialize user state with the server session immediately
    const [user, setUser] = useState<User | null>(initialSession?.user || null);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const profileRef = useRef(profile); // Track latest profile for stale closures
    const fetchingPromiseRef = useRef<Promise<void> | null>(null); // Track in-progress fetch promise
    const isInitialMount = useRef(true); // Track initial mount for SSR profile fetching

    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);
    const [calcPracticeCredits, setCalcPracticeCredits] = useState<number | null>(null);
    const [calcSimulationCredits, setCalcSimulationCredits] = useState<number | null>(null);
    const [renewalDate, setRenewalDate] = useState<Date | null>(null);

    useEffect(() => {
        let mounted = true;
        let profileSubscription: any = null;

        const cleanupProfileSub = () => {
            if (profileSubscription) {
                supabase.removeChannel(profileSubscription);
                profileSubscription = null;
            }
        };

        // Centralized profile loader to avoid duplication
        const loadProfileForUser = async (uid: string) => {
            try {
                // Proceed with fetch
                await fetchProfile(uid);

                // Setup subscription
                cleanupProfileSub();
                profileSubscription = supabase
                    .channel('profile-changes')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'profiles',
                            filter: `id=eq.${uid}`,
                        },
                        (payload) => {
                            console.log('Realtime profile update:', payload);
                            if (mounted) setProfile(payload.new);
                        }
                    )
                    .subscribe();

            } catch (err) {
                console.error("Profile load error:", err);
            }
        };

        // 1. Register listener FIRST to catch all events (INITIAL_SESSION, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth event: ${event}`);
            const currentUser = session?.user ?? null;
            if (!mounted) return;

            // Prevent race condition where hydration set loading to false,
            // but the client session just loaded and profile is not yet fetched.
            if (currentUser && !profileRef.current) {
                setLoading(true);
            }

            setUser(currentUser);

            // Determine if we should load the profile based on the event type
            // SIGNED_IN is removed because it fires before cookies are fully written in production,
            // leading to 401 Unauthorized errors. INITIAL_SESSION reliably follows and has the cookies.
            const shouldLoad =
                event === "INITIAL_SESSION" ||
                (event === "TOKEN_REFRESHED" && !profileRef.current);

            // Cleanup if no user
            if (!currentUser) {
                cleanupProfileSub();
                setProfile(null);
                setHistory([]);
                setLoading(false);
                return;
            }

            if (shouldLoad) {
                await loadProfileForUser(currentUser.id);

                // --- NEW: SESSION LOGGING LOGIC ---
                try {
                    const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
                    const lastSessionTimeStr = localStorage.getItem('last_session_log');
                    const now = Date.now();

                    let shouldLogSession = false;

                    if (!lastSessionTimeStr) {
                        // First time ever (or since localStorage was cleared)
                        shouldLogSession = true;
                    } else {
                        const lastSessionTime = parseInt(lastSessionTimeStr, 10);
                        if (now - lastSessionTime > SESSION_TIMEOUT_MS) {
                            // It's been more than 4 hours since the last session log!
                            shouldLogSession = true;
                        }
                    }

                    if (shouldLogSession) {
                        let firstName = currentUser.user_metadata?.first_name || '';
                        if (!firstName && currentUser.user_metadata?.full_name) {
                            firstName = currentUser.user_metadata.full_name;
                        }

                        fetch('/api/activity', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                eventData: [
                                    new Date().toISOString(), // Local time is handled in your API route!
                                    currentUser.email || 'unknown_email',
                                    firstName || 'User',
                                    "Session Started" // The specific event you can TRACK in your spreadsheet
                                ]
                            })
                        });

                        // Update the localStorage so we don't spam the spreadsheet on the next refresh
                        localStorage.setItem('last_session_log', now.toString());
                        console.log('Appended Session Started to App Activity sheet.');
                    }

                } catch (err) {
                    console.error("Failed to log session:", err);
                }
                // --- END NEW LOGIC ---
            }

            // --- Tracking Google Signups Centrally ---
            if (event === "SIGNED_IN" && currentUser) {
                // Check if this is a newly created user (within the last 30 seconds)
                // AND ensure they signed up with Google (to prevent double-logging Email users)
                const createdAt = new Date(currentUser.created_at).getTime();
                const now = Date.now();
                const isNewUser = (now - createdAt) < 30000;

                // Identify if the user signed up via OAuth (Google)
                const isGoogleUser = currentUser.app_metadata?.provider === 'google';

                if (isNewUser && isGoogleUser) {
                    try {
                        let firstName = currentUser.user_metadata?.first_name || '';
                        let lastName = currentUser.user_metadata?.last_name || '';
                        if (!firstName && currentUser.user_metadata?.full_name) {
                            firstName = currentUser.user_metadata.full_name;
                        }

                        fetch('/api/activity', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                eventData: [
                                    new Date().toISOString(),
                                    currentUser.email || 'unknown_email',
                                    firstName,
                                    "User Signed Up"
                                ]
                            })
                        });
                        console.log('Appended Google signup to App Activity sheet centrally.');
                    } catch (sheetError) {
                        console.error("Failed to append Google signup to sheet centrally", sheetError);
                    }
                }
            }

            setLoading(false);
        });

        // 2. Trigger initial session check (hydrate calls)
        // Removed manual initAuth() as onAuthStateChange automatically fires INITIAL_SESSION

        // 3. SSR Hydration Profile Load
        // If we have an initial session from the server (SSR), fetch the profile immediately
        // instead of waiting for onAuthStateChange to possibly fire INITIAL_SESSION.
        if (isInitialMount.current && initialSession?.user) {
            console.log("Hydrating profile from SSR session...");
            loadProfileForUser(initialSession.user.id).finally(() => {
                if (mounted) setLoading(false);
            });
            isInitialMount.current = false;
        } else if (isInitialMount.current && !initialSession) {
            setLoading(false);
            isInitialMount.current = false;
        }

        return () => {
            mounted = false;
            subscription.unsubscribe();
            cleanupProfileSub();
        };
    }, []);

    const fetchProfile = async (userId: string, options?: { force?: boolean }) => {
        // Check if data is already loaded and fresh enough (simple memory cache)
        if (!options?.force && profileRef.current && profileRef.current.id === userId) {
            console.log("Skipping profile fetch - using cached data");
            return;
        }

        // If a fetch is already running for this user (or generally), join it.
        // We could optimize to check userId, but generally only one user is active.
        if (fetchingPromiseRef.current) {
            console.log("Joining existing profile fetch for", userId);
            return fetchingPromiseRef.current;
        }

        console.log("Fetching profile for:", userId);

        const fetchTask = async () => {
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    console.log(`Attempt ${attempts}: Fetching profile...`);



                    const fetchTimeoutMs = attempts === 1 ? 10000 : 45000;
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`Profile fetch timed out (${fetchTimeoutMs}ms)`)), fetchTimeoutMs)
                    );

                    // Fetch Profile with explicit cache bursting or headers
                    // Next.js aggressive cache or browser fetch cache might cache a 0-row response
                    // To prevent this, we specify no-cache and add a random query param just in case
                    const profilePromise = supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .maybeSingle();

                    // Supabase js v2 doesn't have a direct way to bypass fetch cache per query without custom fetch.
                    // But we don't want to recreate the client.
                    // Wait, we can't add custom query params to PostgREST easily.
                    // Actually, we CAN add a dummy filter that doesn't affect the result but busts the cache!
                    // e.g. .gte('created_at', '1970-01-01') ? No, let's just use Next.js cache bypass if possible, 
                    // or a dummy header, but .from() doesn't allow headers. 

                    const { data: profileData, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

                    if (error) {
                        // Check for JWT expired error
                        if (error.code === 'PGRST303' || error.message?.includes('JWT expired')) {
                            console.warn(`Attempt ${attempts}: JWT expired. Refreshing session...`);
                            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

                            if (refreshError) {
                                console.error("Session refresh failed:", refreshError);
                                throw refreshError;
                            }

                            if (refreshData.session) {
                                console.log("Session refreshed successfully. Retrying fetch...");
                                continue; // Retry the loop with the new session
                            }
                        }

                        console.error("Supabase Error Details:", JSON.stringify(error, null, 2));
                        throw error;
                    }

                    if (!profileData) {
                        console.warn(`Profile for user ${userId} not found (yet). Retrying...`);
                        throw new Error(`Profile not found for user ${userId}`);
                    }

                    console.log("Profile loaded:", profileData);
                    setProfile(profileData);

                    // 7-Day Rolling Window Logic
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    const isoSevenDaysAgo = sevenDaysAgo.toISOString();

                    // Fetch Usage History (Last 7 Days Only for Counts)
                    // We need actual rows to find the "oldest" test in the window for renewal date
                    const historyFetchPromise = Promise.all([
                        // Simulations in last 7 days
                        supabase
                            .from('simulation_results')
                            .select('created_at')
                            .eq('user_id', userId)
                            .eq('test_type', 'Simulation')
                            .gte('created_at', isoSevenDaysAgo)
                            .order('created_at', { ascending: true }), // Oldest first

                        // Practice Tests in last 7 days
                        supabase
                            .from('simulation_results')
                            .select('created_at')
                            .eq('user_id', userId)
                            .in('test_type', ['Rules of the Road', 'Road Signs'])
                            .gte('created_at', isoSevenDaysAgo)
                            .order('created_at', { ascending: true }), // Oldest first

                        // Full History for Display (Top 50, regardless of date)
                        supabase
                            .from('simulation_results')
                            .select('*')
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false })
                            .limit(50)
                    ]);

                    const historyTimeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("History fetch timed out")), 30000)
                    );

                    const [simResult, practiceResult, historyData] = await Promise.race([historyFetchPromise, historyTimeoutPromise]) as any;

                    // Calculate Credits
                    const usedSimulations = simResult.data?.length || 0;
                    const usedPractice = practiceResult.data?.length || 0;

                    setCalcSimulationCredits(0);
                    setCalcPracticeCredits(Math.max(0, 2 - usedPractice));

                    // Calculate Renewal Date (Oldest test + 7 days)
                    let nextRenewal = null;

                    // If NO credits left, find when the next one frees up
                    // logic: The NEXT credit becomes available 7 days after the OLDEST test in the current window drops out.
                    if (usedPractice >= 2) {
                        const oldestPractice = practiceResult.data?.[0]?.created_at;

                        // We strictly care about the renewal of the specific type that is blocked?
                        // Or just the earliest overall? 
                        // Requirement: "indicate the date their new credits are going to be renewed."
                        // Usually implies the earliest time ANY credit returns.

                        const dates = [];
                        if (usedPractice >= 2 && oldestPractice) dates.push(new Date(oldestPractice).getTime());

                        if (dates.length > 0) {
                            const oldestTimestamp = Math.min(...dates);
                            const renewalDate = new Date(oldestTimestamp);
                            renewalDate.setDate(renewalDate.getDate() + 7);
                            nextRenewal = renewalDate;
                        }
                    }

                    setRenewalDate(nextRenewal); // Add this state

                    if (historyData?.data) {
                        setHistory(historyData.data);
                    } else if (Array.isArray(historyData)) {
                        setHistory(historyData);
                    } else if (historyData && typeof historyData === 'object' && 'data' in historyData) {
                        setHistory(historyData.data || []);
                    }

                    return; // Success

                } catch (err: any) {
                    console.warn(`Attempt ${attempts} failed:`, err);
                    if (attempts >= maxAttempts) {
                        if (profileRef.current) return;
                        console.error("Critical: Profile fetch failed.", err);
                    }
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        };

        // Store the promise so others can wait for it
        fetchingPromiseRef.current = fetchTask().finally(() => {
            fetchingPromiseRef.current = null;
        });

        return fetchingPromiseRef.current;
    };

    const isPremium = profile?.status === "Premium" || profile?.is_premium === true; // Check both for backward compat if schema changed
    const isAdmin = profile?.admin === "YES" || profile?.admin === "yes" || profile?.admin === true || profile?.is_admin === true || profile?.role === "admin";
    const practiceCredits = calcPracticeCredits;
    const simulationCredits = calcSimulationCredits;

    const refreshProfile = async (force?: boolean) => {
        if (user) {
            await fetchProfile(user.id, { force });
        }
    };

    const loginWithGoogle = async (nextUrl?: string) => {
        // Explicitly check for localhost to override any default Supabase site URL settings
        const origin = window.location.origin;
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

        let redirectTo = `${origin}/auth/callback`;
        if (nextUrl) {
            redirectTo += `?next=${nextUrl}`;
        }

        console.log("Logging in with Google, origin:", origin);
        console.log("Calculated redirectTo:", redirectTo);

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    skipBrowserRedirect: true
                }
            });

            if (error) throw error;

            if (data?.url) {
                console.log("Google Auth URL received:", data.url);
                window.location.href = data.url;
            } else {
                console.error("No auth URL returned:", data);
            }
        } catch (err) {
            console.error("Google Login Error:", err);
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    };

    const signupWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    first_name: firstName,
                    last_name: lastName
                }
            }
        });
        if (error) throw error;
        if (error) throw error;

        // Track Email Signups Immediately 
        // (because email verification might take longer than 30 seconds, bypassing the central listener)
        try {
            await fetch('/api/activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventData: [
                        new Date().toISOString(),
                        email,
                        firstName,
                        "User Signed Up"
                    ]
                })
            });
            console.log('Appended Email signup to App Activity sheet locally.');
        } catch (sheetError) {
            console.error("Failed to append email signup to sheet locally", sheetError);
        }

        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setHistory([]);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, isPremium, isAdmin, practiceCredits, simulationCredits, history, refreshProfile, renewalDate }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
