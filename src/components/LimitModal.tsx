"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sendGTMEvent } from '@/lib/gtm';


interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    variant?: 'default' | 'chapter_quiz' | 'practice_limit' | 'simulation_limit' | 'all_limit';
}

// ... imports
import { useRouter } from 'next/navigation';

interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    variant?: 'default' | 'chapter_quiz' | 'practice_limit' | 'simulation_limit' | 'all_limit';
    renewalDate?: Date | null;
}

// ... imports
import styles from './LimitModal.module.css';

export default function LimitModal({ isOpen, onClose, message, variant = 'default', renewalDate }: LimitModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        sendGTMEvent('begin_checkout', { source: variant === 'default' ? 'limit_modal' : `${variant}_modal` });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Please log in again.");
                return;
            }

            // Create Checkout Session
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
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
    const isSimulationLimit = variant === 'simulation_limit';
    const isAllLimit = variant === 'all_limit';
    const isSpecialVariant = isChapterQuiz || isPracticeLimit || isSimulationLimit || isAllLimit;

    const getHeadline = () => {
        if (isChapterQuiz) return "Unlock All Chapter Tests";
        if (isPracticeLimit) return "Unlock Unlimited Practice";
        if (isSimulationLimit) return "Unlock Unlimited Simulations";
        if (isAllLimit) return "You’ve Reached the Free Limit";
        return "Limit Reached";
    };

    const formattedRenewal = renewalDate ? renewalDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    }) : null;

    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} ${isSpecialVariant ? styles.modalSpecial : ''}`}>
                {isSpecialVariant && <div className={styles.gradientBar} />}

                <h2 className={`${styles.headline} ${isSpecialVariant ? styles.headlineSpecial : ''}`}>
                    {getHeadline()}
                </h2>

                {isChapterQuiz && (
                    <>
                        <p className={styles.description}>
                            Chapter quizzes are part of G1 Master Premium Plan. <br />
                            <strong>Upgrade to get:</strong>
                        </p>

                        <div className={styles.featureList}>
                            <div className={styles.featureItem}>
                                <span className={styles.checkIcon}>✅</span> Unlimited chapter quizzes
                            </div>
                            <div className={styles.featureItem}>
                                <span className={styles.checkIcon}>✅</span> Practice by topic (rules & signs)
                            </div>
                            <div className={styles.featureItem}>
                                <span className={styles.checkIcon}>✅</span> Review mistakes and improve weak areas
                            </div>
                        </div>

                        <div className={styles.priceBox}>
                            <div className={styles.priceMain}>$9.97 <span className={styles.priceSub}>one-time payment</span></div>
                            <div className={styles.priceDesc}>No weekly fees • Lifetime access</div>
                        </div>
                    </>
                )}

                {isPracticeLimit && (
                    <>
                        <p className={styles.description}>
                            You’ve completed all 5 free practice tests <br />
                            <strong>Upgrade to Premium now and unlock:</strong>
                        </p>

                        <div className={styles.featureList}>
                            <div className={styles.featureItem}>
                                <span className={styles.checkIcon}>✅</span> Unlimited practice tests
                            </div>
                            <div className={styles.featureItem}>
                                <span className={styles.checkIcon}>✅</span> Unlimited simulations
                            </div>
                            <div className={styles.featureItem}>
                                <span className={styles.checkIcon}>✅</span> Progress tracking & readiness score
                            </div>
                        </div>

                        <div className={styles.priceBox}>
                            <div className={styles.priceMain}>One-time fee: $9.97</div>
                            <div className={styles.priceDesc}>Practice as much as you want — forever.</div>
                        </div>
                    </>
                )}

                {isSimulationLimit && (
                    <>
                        <p className={styles.description}>
                            You’ve used all free simulation credits. <br />
                            <strong>Upgrade to:</strong>
                        </p>

                        <div className={styles.featureList}>
                            <div className={styles.featureItem}>
                                <span className={styles.checkIcon}>✅</span> Take unlimited G1 simulations
                            </div>
                            <div className={styles.featureItem}>
                                <span className={styles.checkIcon}>✅</span> Experience real exam flow and difficulty
                            </div>
                            <div className={styles.featureItem}>
                                <span className={styles.checkIcon}>✅</span> Build confidence before test day
                            </div>
                        </div>

                        <div className={styles.priceBox}>
                            <div className={styles.priceMain}>$9.97 <span className={styles.priceSub}>— one-time payment</span></div>
                            <div className={styles.priceDesc}>No subscriptions. No renewals.</div>
                        </div>
                    </>
                )}

                {isAllLimit && (
                    <>
                        {formattedRenewal ? (
                            <p className={styles.renewalText}>
                                Credits will renew automatically on <strong>{formattedRenewal}</strong>. Can't wait?
                            </p>
                        ) : (
                            <p className={styles.description}>
                                You’ve completed all free practice and simulation credits — great progress 👏
                            </p>
                        )}
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

                        <div className={styles.priceBox}>
                            <div className={styles.priceMain}>💰 Only $9.97 <span className={styles.priceSub}>(one-time fee)</span></div>
                            <div className={styles.priceDesc}>No subscriptions • Lifetime access</div>
                        </div>
                    </>
                )}

                {!isSpecialVariant && (
                    <p className={styles.description} style={{ lineHeight: '1.5', margin: '0 0 2rem 0' }}>
                        {message || "You have used all your free practice credits. Upgrade to Premium for unlimited access."}
                    </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={handleUpgrade}
                        className={styles.upgradeBtn}
                    >
                        {isSpecialVariant ? (
                            isAllLimit ? "Unlock Full Access" :
                                (isPracticeLimit || isSimulationLimit ?
                                    (isSimulationLimit ? "Get Premium Access" : "Upgrade Now") : "Unlock Premium Access Now")
                        ) : (
                            <>
                                <span>Upgrade Now</span>
                                <span className={styles.priceTag}>$9.97</span>
                            </>
                        )}
                    </button>

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
                    {isAllLimit && (
                        <p className={styles.secondaryText}>
                            Some G1 apps charge $49/week or $159 lifetime.
                        </p>
                    )}

                    <button
                        onClick={() => {
                            if (onClose) onClose();
                            if (isAllLimit) {
                                router.push('/dashboard');
                            }
                        }}
                        className={`${styles.backBtn} ${isSpecialVariant ? styles.backBtnSpecial : ''}`}
                    >
                        {isAllLimit ? "Back to Dashboard" : (isSpecialVariant ? "Not now, take me back" : "Back to Dashboard")}
                    </button>
                </div>
            </div>
        </div>
    );
}
