"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<any>;
    signupWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
    logout: () => Promise<void>;
    isPremium: boolean;
    isAdmin: boolean;
    practiceCredits: number;
    simulationCredits: number;
    history: any[];
    refreshProfile: (force?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const profileRef = useRef(profile); // Track latest profile for stale closures
    const fetchingPromiseRef = useRef<Promise<void> | null>(null); // Track in-progress fetch promise

    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);
    const [calcPracticeCredits, setCalcPracticeCredits] = useState(5);
    const [calcSimulationCredits, setCalcSimulationCredits] = useState(1);

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

            setUser(currentUser);

            // Determine if we should load the profile based on the event type
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
            }

            setLoading(false);
        });

        // 2. Trigger initial session check (hydrate calls)
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) console.error("Error getting session:", error);

                const currentUser = session?.user ?? null;
                if (mounted) setUser(currentUser);
            } catch (err) {
                console.error("Auth init error:", err);
            }
        };

        initAuth();

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

                    // VALIDATION CHECK
                    // Ensure we have a valid user session on the server before querying data.
                    // This prevents sending requests with stale tokens that result in 401s.
                    // We wrap this in a timeout because the client itself can sometimes hang on this call.
                    const getUserPromise = supabase.auth.getUser();
                    const getUserTimeout = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("getUser check timed out")), 5000)
                    );

                    const { data: userData, error: userErr } = await Promise.race([getUserPromise, getUserTimeout]) as any;

                    if (userErr || !userData.user) {
                        console.warn(`Attempt ${attempts}: getUser failed (invalid session).`, userErr);
                        throw new Error("No valid user session");
                    }

                    // For Attempt 1, use a shorter "Fail Fast" network timeout (10s)
                    // For Attempt 2+, use the full generous timeout (45s)
                    const fetchTimeoutMs = attempts === 1 ? 10000 : 45000;

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`Profile fetch timed out (${fetchTimeoutMs}ms)`)), fetchTimeoutMs)
                    );

                    // Fetch Profile using singleton client
                    const profilePromise = supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    const { data: profileData, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

                    if (error) throw error;

                    console.log("Profile loaded:", profileData);
                    setProfile(profileData);

                    // Fetch Usage History (Parallelize these) using singleton client
                    // Fetch counts for credits AND detailed history for UI
                    const historyFetchPromise = Promise.all([
                        supabase.from('simulation_results').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('test_type', 'Simulation'),
                        supabase.from('simulation_results').select('*', { count: 'exact', head: true }).eq('user_id', userId).neq('test_type', 'Simulation'),
                        supabase.from('simulation_results').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
                    ]);

                    const historyTimeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("History fetch timed out")), 30000)
                    );

                    const [simResult, practiceResult, historyData] = await Promise.race([historyFetchPromise, historyTimeoutPromise]) as any;

                    setCalcSimulationCredits(Math.max(0, 1 - (simResult.count || 0)));
                    setCalcPracticeCredits(Math.max(0, 5 - (practiceResult.count || 0)));

                    if (historyData?.data) {
                        setHistory(historyData.data);
                    } else if (Array.isArray(historyData)) {
                        setHistory(historyData);
                    } else if (historyData && typeof historyData === 'object' && 'data' in historyData) {
                        setHistory(historyData.data || []);
                    }

                    return; // Success, exit loop

                } catch (err: any) {
                    console.warn(`Attempt ${attempts} failed:`, err);

                    if (attempts >= maxAttempts) {
                        // Check REF for latest data, not stale closure variable
                        if (profileRef.current) {
                            console.warn("Profile fetch failed but using stale data. Error:", err.message);
                            return;
                        }
                        console.error("Critical: Profile fetch failed and no stale data available.", err);
                    }
                    // Wait a bit before retry?
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
    const isAdmin = profile?.admin === "YES";
    const practiceCredits = calcPracticeCredits;
    const simulationCredits = calcSimulationCredits;

    const refreshProfile = async (force?: boolean) => {
        if (user) {
            await fetchProfile(user.id, { force });
        }
    };

    const loginWithGoogle = async () => {
        const redirectTo = `${window.location.origin}/auth/callback`;
        console.log("Logging in with Google, redirecting to:", redirectTo);
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo
            }
        });
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
                emailRedirectTo: window.location.href,
                data: {
                    first_name: firstName,
                    last_name: lastName
                }
            }
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setHistory([]);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, isPremium, isAdmin, practiceCredits, simulationCredits, history, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
