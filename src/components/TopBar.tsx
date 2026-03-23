"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./TopBar.module.css";
import { useSidebar } from "./DashboardLayout";
import { Menu } from "lucide-react";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sendGTMEvent } from '@/lib/gtm';

export default function TopBar() {
    const { user, isPremium } = useAuth();
    const { toggleSidebar } = useSidebar();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!user || isPremium) return;

        const updateTimer = () => {
            if (!user.created_at) return;
            const createdTime = new Date(user.created_at).getTime();
            const expiryTime = createdTime + 15 * 60 * 1000;
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [user, isPremium]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleUpgrade = async (isPromo: boolean) => {
        sendGTMEvent('begin_checkout', { source: 'topbar' });
        setIsCheckingOut(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setIsCheckingOut(false);
                return;
            }
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ isPromo, source: 'topbar' })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (err) {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className={styles.topbar}>
            <button className={styles.hamburger} onClick={toggleSidebar}>
                <Menu size={24} />
            </button>
            
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {user && !isPremium && (
                    <>
                        {timeLeft > 0 ? (
                            <button 
                                onClick={() => handleUpgrade(true)}
                                disabled={isCheckingOut}
                                style={{
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: isCheckingOut ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)'
                                }}
                            >
                                <span>{isCheckingOut ? 'Loading...' : `👉 Click to Get PREMIUM - 66% OFF | $9.97 (was $29.97) | Ends in ${formatTime(timeLeft)}`}</span>
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleUpgrade(false)}
                                disabled={isCheckingOut}
                                style={{
                                    background: '#D4FF00',
                                    color: '#000',
                                    border: 'none',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '9999px',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    cursor: isCheckingOut ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    boxShadow: '0 2px 10px rgba(212, 255, 0, 0.2)'
                                }}
                            >
                                👑 {isCheckingOut ? 'Loading...' : 'Upgrade to PREMIUM'}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* User profile removed as per request */}
        </div>
    );
}
