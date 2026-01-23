"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createBrowserClient } from '@supabase/ssr';
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
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState<any>(null);
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            if (mounted) setUser(currentUser);

            // Cleanup old sub
            if (profileSubscription) {
                supabase.removeChannel(profileSubscription);
                profileSubscription = null;
            }

            if (currentUser) {
                await loadProfileForUser(currentUser.id);
            } else {
                if (mounted) setProfile(null);
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

    const fetchProfile = async (userId: string) => {
        console.log("Fetching profile for:", userId);

        // Use fresh client to avoid singleton locks
        const tempSupabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Profile fetch timed out")), 5000)
            );

            // Fetch Profile
            const profilePromise = tempSupabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data: profileData, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

            if (error) throw error;

            console.log("Profile loaded:", profileData);
            setProfile(profileData);

            // Fetch Usage History (Parallelize these)
            const [simResult, practiceResult] = await Promise.all([
                tempSupabase.from('simulation_results').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('test_type', 'Simulation'),
                tempSupabase.from('simulation_results').select('*', { count: 'exact', head: true }).eq('user_id', userId).neq('test_type', 'Simulation')
            ]);

            setCalcSimulationCredits(Math.max(0, 1 - (simResult.count || 0)));
            setCalcPracticeCredits(Math.max(0, 5 - (practiceResult.count || 0)));

        } catch (err) {
            console.error("Error fetching profile:", err);
            // Don't leave the app broken, just set null profile (non-admin/non-premium)
            // But if it's a timeout, user might be admin and get blocked.
            // Better to retry? For now, we proceed so 'loading' stops.
        }
    };

    const isPremium = profile?.status === "Premium" || profile?.is_premium === true; // Check both for backward compat if schema changed
    const isAdmin = profile?.admin === "YES";
    const practiceCredits = calcPracticeCredits;
    const simulationCredits = calcSimulationCredits;

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const loginWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href
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
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, isPremium, isAdmin, practiceCredits, simulationCredits, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
