"use client";

import styles from "./Sidebar.module.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, BarChart2, Calendar, Settings, LogOut, FileText, User, History as HistoryIcon, GraduationCap } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import { useSidebar } from "./DashboardLayout";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sendGTMEvent } from '@/lib/gtm';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, isPremium, logout } = useAuth();
    const router = useRouter();
    const { isSidebarOpen, closeSidebar } = useSidebar();

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

    const handleUpgrade = async (isPromo: boolean) => {
        sendGTMEvent('begin_checkout', { source: 'sidebar' });
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
                body: JSON.stringify({ isPromo, source: 'sidebar' })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (err) {
            setIsCheckingOut(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/"); // Redirect to home/login after logout
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { name: "Account", icon: User, path: "/account" },
        { name: "History", icon: HistoryIcon, path: "/history" },
        { name: "Study Now", icon: GraduationCap, path: "/study" },
    ];

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`${styles.overlay} ${isSidebarOpen ? styles.open : ""}`}
                onClick={closeSidebar}
            />

            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.logoContainer}>
                    <Image src="/G1MasterApp_Logo.png" alt="G1 Master Logo" width={100} height={100} style={{ width: 'auto', height: 'auto', maxWidth: '100%' }} />
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path ||
                            (item.path === '/study' && (pathname === '/practice' || pathname === '/chapter' || pathname?.startsWith('/quiz')));

                        const handleClick = () => {
                            closeSidebar();
                        };

                        if (item.path === '/history' || item.path === '/dashboard') {
                            return (
                                <a
                                    key={item.path}
                                    href={item.path}
                                    className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                                    onClick={handleClick}
                                >
                                    <Icon size={20} />
                                    <span>{item.name}</span>
                                </a>
                            );
                        }
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                                onClick={handleClick}
                            >
                                <Icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
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
                                        padding: '0.6rem 1rem',
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        cursor: isCheckingOut ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                        boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)',
                                        marginBottom: '1rem',
                                        width: '100%',
                                        textAlign: 'center'
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
                                        padding: '0.6rem 1rem',
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        cursor: isCheckingOut ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.4rem',
                                        boxShadow: '0 2px 10px rgba(212, 255, 0, 0.2)',
                                        marginBottom: '1rem',
                                        width: '100%',
                                        textAlign: 'center'
                                    }}
                                >
                                    👑 {isCheckingOut ? 'Loading...' : 'Upgrade to PREMIUM'}
                                </button>
                            )}
                        </>
                    )}

                    <Link
                        href="/contact"
                        className={`${styles.navItem} ${pathname === '/contact' ? styles.active : ""}`}
                        onClick={() => closeSidebar()}
                        style={{ padding: '0.75rem 1rem', marginBottom: 0 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        <span>Contact</span>
                    </Link>

                    <button onClick={handleLogout} className={`${styles.navItem} ${styles.logout}`} style={{ padding: '0.75rem 1rem' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
