"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
        let profileSubscription: any = null;

        // Check active session
        const getSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error getting session:", error);
                await supabase.auth.signOut();
                setLoading(false);
                return;
            }
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                await fetchProfile(currentUser.id);

                // Setup Realtime subscription
                profileSubscription = supabase
                    .channel('profile-changes')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'profiles',
                            filter: `id=eq.${currentUser.id}`,
                        },
                        (payload) => {
                            console.log('Realtime profile update:', payload);
                            setProfile(payload.new);
                        }
                    )
                    .subscribe();

            } else {
                setProfile(null);
            }
            setLoading(false);
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            // Clean up previous subscription if exists
            if (profileSubscription) {
                supabase.removeChannel(profileSubscription);
                profileSubscription = null;
            }

            if (currentUser) {
                // Do not await here to avoid blocking auth state changes
                fetchProfile(currentUser.id).then(() => {
                    // Setup Realtime subscription for new user
                    profileSubscription = supabase
                        .channel('profile-changes')
                        .on(
                            'postgres_changes',
                            {
                                event: 'UPDATE',
                                schema: 'public',
                                table: 'profiles',
                                filter: `id=eq.${currentUser.id}`,
                            },
                            (payload) => {
                                console.log('Realtime profile update:', payload);
                                setProfile(payload.new);
                            }
                        )
                        .subscribe();
                });
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
            if (profileSubscription) {
                supabase.removeChannel(profileSubscription);
            }
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        // Fetch Profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        setProfile(profileData);

        // Fetch Usage History
        const { count: simCount } = await supabase
            .from('simulation_results')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('test_type', 'Simulation');

        const { count: practiceCount } = await supabase
            .from('simulation_results')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .neq('test_type', 'Simulation');

        setCalcSimulationCredits(Math.max(0, 1 - (simCount || 0)));
        setCalcPracticeCredits(Math.max(0, 5 - (practiceCount || 0)));
    };

    const isPremium = profile?.is_premium === true;
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
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, isPremium, practiceCredits, simulationCredits, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
