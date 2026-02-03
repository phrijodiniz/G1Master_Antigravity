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

        // Centralized profile loader to avoid duplication
        const loadProfileForUser = async (uid: string) => {
            try {
                await fetchProfile(uid);

                // Setup subscription
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
                            setProfile(payload.new);
                        }
                    )
                    .subscribe();

            } catch (err) {
                console.error("Profile load error:", err);
            }
        };

        const initAuth = async () => {
            try {
                // 1. Get initial session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Error getting session:", error);
                }

                const currentUser = session?.user ?? null;
                if (mounted) setUser(currentUser);

                if (currentUser) {
                    await loadProfileForUser(currentUser.id);
                } else {
                    if (mounted) setProfile(null);
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            if (mounted) setUser(currentUser);

            // Optimization: Skip profile reload on token refresh (subscription remains active)
            if (event === 'TOKEN_REFRESHED') return;

            // Cleanup old sub
            if (profileSubscription) {
                supabase.removeChannel(profileSubscription);
                profileSubscription = null;
            }

            if (currentUser) {
                await loadProfileForUser(currentUser.id);
            } else {
                if (mounted) {
                    setProfile(null);
                    setHistory([]);
                }
            }

            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            if (profileSubscription) {
                supabase.removeChannel(profileSubscription);
            }
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
            const maxAttempts = 2;

            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Profile fetch timed out")), 15000)
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
                        setTimeout(() => reject(new Error("History fetch timed out")), 10000)
                    );

                    const [simResult, practiceResult, historyData] = await Promise.race([historyFetchPromise, historyTimeoutPromise]) as any;

                    setCalcSimulationCredits(Math.max(0, 1 - (simResult.count || 0)));
                    setCalcPracticeCredits(Math.max(0, 5 - (practiceResult.count || 0)));

                    if (historyData?.data) {
                        setHistory(historyData.data);
                    } else if (Array.isArray(historyData)) {
                        // Sometimes supabase returns data directly depending on client version/mocking, but usually .data
                        setHistory(historyData);
                    } else if (historyData && typeof historyData === 'object' && 'data' in historyData) {
                        // Double check structure
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
                    await new Promise(r => setTimeout(r, 1000));
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
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
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
