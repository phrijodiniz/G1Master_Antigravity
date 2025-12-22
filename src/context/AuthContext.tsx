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
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        let profileSubscription: any = null;

        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                // Initial fetch
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                setProfile(data);

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
                // Fetch profile
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                setProfile(data);

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

    const isPremium = profile?.is_premium === true;

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
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, isPremium }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
