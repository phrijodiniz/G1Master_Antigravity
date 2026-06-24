"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sendGTMEvent } from '@/lib/gtm';
import { useAuth } from '@/context/AuthContext';
import ParentShareModal from './ParentShareModal';
import PricingCardGrid from './PricingCardGrid';
import styles from './LimitModal.module.css';
import { useRouter } from 'next/navigation';

interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    variant?: 'default' | 'chapter_quiz' | 'practice_limit' | 'simulation_quiz' | 'all_limit' | 'progressbar_upgrade';
    renewalDate?: Date | null;
}

export default function LimitModal({ isOpen, onClose, message, variant = 'default', renewalDate }: LimitModalProps) {
    const router = useRouter();
    const { user } = useAuth();

    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isShareOpen, setIsShareOpen] = useState(false);

    if (!isOpen) return null;

    const handleShareWithParent = async () => {
        if (!user) {
            alert("Please log in again.");
            return;
        }
        setIsSharing(true);
        try {
            const shareLink = `${window.location.origin}/parents/pay?userId=${user.id}`;
            setShareUrl(shareLink);
            setIsShareOpen(true);
        } catch (err) {
            console.error(err);
            alert("Error generating share link.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleSelectTier = async (tier: '2_weeks' | '30_days' | 'lifetime') => {
        sendGTMEvent('begin_checkout', { source: `${variant}_modal_${tier}` });
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
                body: JSON.stringify({ tier, source: `limit_modal_${variant}` })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error(err);
            alert("Error initiating checkout.");
        }
    };

    const isChapterQuiz = variant === 'chapter_quiz';
    const isPracticeLimit = variant === 'practice_limit';
    const isSimulationLimit = variant === 'simulation_quiz';
    const isAllLimit = variant === 'all_limit';
    const isProgressBarUpgrade = variant === 'progressbar_upgrade';

    const getHeadline = () => {
        if (isChapterQuiz) return "Unlock All Chapter Tests";
        if (isPracticeLimit) return "Unlock Unlimited Practice";
        if (isSimulationLimit) return "Unlock Unlimited Simulations";
        if (isAllLimit) return "You’ve Reached the Free Limit";
        if (isProgressBarUpgrade) return "Upgrade to G1 Master Premium to unlock:";
        return "Limit Reached";
    };

    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles.modalWide}`}>
                <div className={styles.gradientBar} />

                <h2 className={`${styles.headline} ${styles.headlineSpecial}`}>
                    {getHeadline()}
                </h2>

                <p className={styles.description}>
                    <strong>Upgrade to G1 Master Premium to unlock:</strong>
                </p>

                <div className={styles.featureList}>
                    <div className={styles.featureItem}>
                        <span className={styles.lockIcon}>🔓</span> Unlimited practice tests
                    </div>
                    <div className={styles.featureItem}>
                        <span className={styles.lockIcon}>🔓</span> Unlimited simulations
                    </div>
                    <div className={styles.featureItem}>
                        <span className={styles.lockIcon}>🔓</span> All chapter quizzes
                    </div>
                    <div className={styles.featureItem}>
                        <span className={styles.lockIcon}>🔓</span> Progress tracking & readiness meter
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <PricingCardGrid onSelectTier={handleSelectTier} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {isChapterQuiz && (
                        <p className={styles.secondaryText}>
                            Other apps charge $49/week or $159 lifetime
                        </p>
                    )}
                    {(isPracticeLimit || isSimulationLimit) && (
                        <p className={styles.secondaryText}>
                            {isSimulationLimit ? "Other apps charge $49/week or $159 lifetime" : "One single payment. No renewals or hidden fees."}
                        </p>
                    )}
                    {(isAllLimit || isProgressBarUpgrade) && (
                        <p className={styles.secondaryText}>
                            Some G1 apps charge $49/week or $159 lifetime.
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleShareWithParent}
                        disabled={isSharing}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#2563eb',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: isSharing ? 'not-allowed' : 'pointer',
                            textDecoration: 'underline',
                            textAlign: 'center',
                            margin: '0.25rem 0 0.5rem 0',
                            padding: '0.25rem'
                        }}
                    >
                        {isSharing ? 'Generating link...' : '🔗 Ask parent to pay (Share payment link)'}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (onClose) onClose();
                            if (isAllLimit) {
                                router.push('/dashboard');
                            }
                        }}
                        className={`${styles.backBtn} ${styles.backBtnSpecial}`}
                    >
                        {isProgressBarUpgrade ? "Not Now" : (isAllLimit ? "Back to Dashboard" : "Not now, take me back")}
                    </button>
                </div>
            </div>

            <ParentShareModal 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                checkoutUrl={shareUrl}
                isPromoActive={false}
            />
        </div>
    );
}
