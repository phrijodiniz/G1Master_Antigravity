"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { sendGTMEvent } from '@/lib/gtm';
import { useAuth } from '@/context/AuthContext';
import styles from './FreeMockTestResultModal.module.css';

interface FreeMockTestResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    results: {
        score: number;
        total_questions?: number;
        passed: boolean;
        answers?: any;
    } | null;
}

export default function FreeMockTestResultModal({ isOpen, results, onClose }: FreeMockTestResultModalProps) {
    const router = useRouter();
    const { isPremium, user } = useAuth();
    
    // OTO Timer state
    const [timeLeft, setTimeLeft] = useState(0);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        if (!isOpen || !user) return;
        
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
    }, [isOpen, user]);

    if (!isOpen || !results) return null;

    const { score, passed } = results;
    // Interpret out of whatever total_questions is provided, default to 10 if not present.
    const tq = results.total_questions || 10;
    const correctAnswers = Math.round((score / 100) * tq);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleUpgrade = async () => {
        sendGTMEvent('begin_checkout', { source: 'result_modal_oto' });
        setIsCheckingOut(true);
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Session expired. Please log in again.");
                setIsCheckingOut(false);
                return;
            }

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ isPromo: true, source: 'result_modal_oto' })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error(err);
            alert("Error initiating checkout. Please try again.");
            setIsCheckingOut(false);
        }
    };

    const handlePracticeClick = (category: string) => {
        onClose();
        router.push(`/quiz/practice?category=${encodeURIComponent(category)}`);
    };

    return (
        <div className={styles.container} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'block' }}>
            <div className={styles.gradientBg} style={{ position: 'fixed' }}></div>
            
            <div className={styles.content} style={{ margin: '2rem auto' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', lineHeight: '1.2', fontWeight: 800, color: '#e1ff21' }}>
                    You scored {correctAnswers}/{tq} on your first practice test.
                </h2>
                <p style={{ marginBottom: '1.5rem', opacity: 0.9, fontSize: '1rem', color: 'white' }}>
                    With a little more practice, you can walk into the real G1 fully confident.
                </p>

                {/* If already premium, just show the standard options */}
                {isPremium ? (
                    <>
                        <p style={{ marginBottom: '1rem', fontWeight: 600, color: 'white' }}>Choose what to practice next:</p>
                        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
                            <button onClick={() => handlePracticeClick('Rules of the Road')} className="btn-primary" style={{ flex: 1, padding: '0.8rem', fontSize: '0.95rem', fontWeight: 700, background: '#D4FF00', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Rules of the Road</button>
                            <button onClick={() => handlePracticeClick('Road Signs')} className="btn-primary" style={{ flex: 1, padding: '0.8rem', fontSize: '0.95rem', fontWeight: 700, background: '#D4FF00', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Road Signs</button>
                        </div>
                        <button onClick={onClose} style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: 'white', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', opacity: 0.8 }}>Go to Dashboard</button>
                    </>
                ) : (
                    /* The Premium OTO Offer for Free Users */
                    <div className={styles.offerBox}>
                        <div className={styles.offerBadge}>Exclusive New User Offer</div>
                        
                        <div className={styles.timer} style={{ marginTop: '1.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Offer expires in {formatTime(timeLeft)}
                        </div>
                        
                        <h2 className={styles.offerTitle}>Pass Your G1 on the First Try</h2>
                        <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Over 95% of our Premium users pass their G1 test on their first attempt. 
                            Don't risk failing and paying the $106 re-test fee.
                        </p>

                        <div className={styles.offerPrice}>
                            <span>$29.97</span> $9.97
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            One-time payment • Lifetime access • No subscriptions
                        </p>

                        <div className={styles.featureList}>
                            <div className={styles.featureItem}><div className={styles.checkIcon}>✓</div><span><strong>Unlimited G1 Test Simulations</strong></span></div>
                            <div className={styles.featureItem}><div className={styles.checkIcon}>✓</div><span><strong>Unlimited Practice Tests</strong></span></div>
                            <div className={styles.featureItem}><div className={styles.checkIcon}>✓</div><span><strong>Smart Readiness Meter</strong></span></div>
                        </div>

                        <button onClick={handleUpgrade} disabled={isCheckingOut} className={styles.upgradeBtn}>
                            {isCheckingOut ? 'Loading Secure Checkout...' : 'Unlock Lifetime Premium Now'}
                        </button>
                        
                        <button onClick={onClose} className={styles.skipLink}>
                            No thanks, continue to my free dashboard →
                        </button>
                    </div>
                )}
                
            </div>
        </div>
    );
}
