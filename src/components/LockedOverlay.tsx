"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { loadStripe } from "@stripe/stripe-js";
import { sendGTMEvent } from "@/lib/gtm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function LockedOverlay() {
    const { user, isPremium, practiceCredits, simulationCredits, loading } = useAuth();
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (!loading && user && !isPremium) {
            // Lock ONLY if ALL credits are 0
            if (practiceCredits <= 0 && simulationCredits <= 0) {
                setIsLocked(true);
            } else {
                setIsLocked(false);
            }
        } else {
            setIsLocked(false);
        }
    }, [user, isPremium, practiceCredits, simulationCredits, loading]);

    const handleUpgrade = async () => {
        sendGTMEvent('begin_checkout', { source: 'locked_overlay' });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Please log in again.");
                return;
            }

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const { url } = data;
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No checkout URL returned");
            }

        } catch (err) {
            console.error(err);
            alert("Error initiating checkout. See console for details.");
        }
    };

    if (!isLocked) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                textAlign: 'center',
                maxWidth: '450px',
                border: '1px solid #e2e8f0'
            }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
                    Out of Credits
                </h2>
                <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                    You have used all your free practice and simulation credits. Upgrade to Premium for unlimited access to all tests and simulations.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={handleUpgrade}
                        style={{
                            background: '#0f172a',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '1rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>Upgrade to Premium</span>
                        <span style={{ background: '#e1ff21', color: 'black', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px' }}>$9.97</span>
                    </button>
                    <button
                        className="text-sm text-slate-500 hover:text-slate-800"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}
                        onClick={(e) => {
                            e.preventDefault();
                            supabase.auth.signOut().then(() => window.location.href = '/');
                        }}
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
