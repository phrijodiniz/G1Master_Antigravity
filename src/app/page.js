"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from "./page.module.css";
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useRouter } from 'next/navigation';

export default function Home() {
    const { user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const router = useRouter();

    // Auto-redirect to Dashboard if logged in
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    // If user is logged in, show nothing (or a spinner) while redirecting to avoid flash
    if (user) {
        return (
            <main className={styles.main} style={{ justifyContent: 'center' }}>
                <div style={{ opacity: 0.7 }}>Loading Dashboard...</div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            {/* Nav Header */}
            <nav style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div>
                    <Image src="/G1MasterApp_Logo.png" alt="G1 Master Logo" width={150} height={150} style={{ width: 'auto', height: '40px' }} />
                </div>
                <button
                    onClick={() => setShowLoginModal(true)}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '20px', cursor: 'pointer' }}
                >
                    Log In
                </button>
            </nav>

            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

            {/* Hero Section */}
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 style={{
                    fontSize: '4rem',
                    marginBottom: '1.5rem',
                    fontWeight: 800,
                    lineHeight: 1.1
                }}>
                    Pass Your <span style={{ color: 'var(--primary)' }}>G1 Test</span><br />
                    The First Time.
                </h1>

                <p style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '3rem', maxWidth: '600px', lineHeight: 1.6 }}>
                    Master the Ontario rules of the road with unlimited practice tests, timed simulations, and chapter-by-chapter breakdowns.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="btn-primary"
                        style={{
                            fontSize: '1.2rem',
                            padding: '1rem 2.5rem',
                            boxShadow: '0 0 30px rgba(225, 255, 33, 0.3)'
                        }}
                    >
                        Start Practicing Free
                    </button>
                </div>

                {/* Features Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '4rem', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '3rem' }}>
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Chapter Study</h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Focus on individual sections of the handbook.</p>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏱️</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Exam Simulation</h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Real-time 40 question tests with time tracking.</p>
                    </div>
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📈</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Progress Tracking</h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>See your scores improve and know when you're ready.</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto', padding: '2rem', opacity: 0.4, fontSize: '0.8rem' }}>
                &copy; {new Date().getFullYear()} G1 Master App. Unofficial study aid.
            </div>
        </main>
    );
}
