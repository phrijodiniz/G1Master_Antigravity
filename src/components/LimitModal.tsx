"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sendGTMEvent } from '@/lib/gtm';
import { useAuth } from '@/context/AuthContext';
import ParentShareModal from './ParentShareModal';

function Countdown({ targetDate }: { targetDate: Date }) {
    const [timeLeft, setTimeLeft] = useState('');

    React.useEffect(() => {
        function updateTimer() {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                setTimeLeft('00:00:00');
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const parts = [];
            if (days > 0) {
                parts.push(`${days}d`);
            }
            parts.push(`${hours.toString().padStart(2, '0')}h`);
            parts.push(`${minutes.toString().padStart(2, '0')}m`);
            parts.push(`${seconds.toString().padStart(2, '0')}s`);

            setTimeLeft(parts.join(' '));
        }

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return <span>{timeLeft}</span>;
}


interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    variant?: 'default' | 'chapter_quiz' | 'practice_limit' | 'simulation_quiz' | 'all_limit' | 'progressbar_upgrade';
}

// ... imports
import { useRouter } from 'next/navigation';

interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    variant?: 'default' | 'chapter_quiz' | 'practice_limit' | 'simulation_quiz' | 'all_limit' | 'progressbar_upgrade';
    renewalDate?: Date | null;
}

// ... imports
import styles from './LimitModal.module.css';

export default function LimitModal({ isOpen, onClose, message, variant = 'default', renewalDate }: LimitModalProps) {
    const router = useRouter();
    const { isOfferActive, offerExpiryDate } = useAuth();
    const activePrice = isOfferActive ? "$12.98" : "$19.97";
    const strikePrice = isOfferActive ? " (was $19.97)" : "";

    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isShareOpen, setIsShareOpen] = useState(false);

    if (!isOpen) return null;

    const handleShareWithParent = async () => {
        setIsSharing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Please log in again.");
                setIsSharing(false);
                return;
            }

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ isPromo: isOfferActive, source: `limit_modal_share_${variant}` })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.url) {
                setShareUrl(data.url);
                setIsShareOpen(true);
            }
        } catch (err) {
            console.error(err);
            alert("Error generating checkout link.");
        } finally {
            setIsSharing(false);
        }
    };

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
                body: JSON.stringify({ isPromo: isOfferActive, source: `limit_modal_${variant}` })
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
    const isSpecialVariant = isChapterQuiz || isPracticeLimit || isSimulationLimit || isAllLimit || isProgressBarUpgrade;

    const getHeadline = () => {
        if (isChapterQuiz) return "Unlock All Chapter Tests";
        if (isPracticeLimit) return "Unlock Unlimited Practice";
        if (isSimulationLimit) return "Unlock Unlimited Simulations";
        if (isAllLimit) return "You’ve Reached the Free Limit";
        if (isProgressBarUpgrade) return "Upgrade to G1 Master Premium to unlock:";
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
                            <div className={styles.priceMain}>{activePrice}{strikePrice} <span className={styles.priceSub} style={{ fontWeight: 800, color: '#22c55e' }}>ONE-TIME PAYMENT - NO SUBSCRIPTION</span></div>
                            <div className={styles.priceDesc}>No weekly fees • Lifetime access</div>
                        </div>
                    </>
                )}

                {isPracticeLimit && (
                    <>
                        <p className={styles.description}>
                            {formattedRenewal ? (
                                <>
                                    Free practice tests are time-capped. Your credits will renew automatically on <strong>{formattedRenewal}</strong>.
                                </>
                            ) : (
                                <>You’ve completed your active free practice tests.</>
                            )}
                            <br />
                            <strong style={{ display: 'block', marginTop: '0.5rem' }}>Upgrade to Premium now and unlock:</strong>
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
                            <div className={styles.priceMain}>One-time fee: {activePrice}{strikePrice} <span style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', color: '#22c55e', marginTop: '0.2rem' }}>ONE-TIME PAYMENT - NO SUBSCRIPTION</span></div>
                            <div className={styles.priceDesc}>Practice as much as you want — forever.</div>
                        </div>
                    </>
                )}

                {isSimulationLimit && (
                    <>
                        <p className={styles.description}>
                            G1 Test Simulations are part of G1 Master Premium Plan. <br />
                            <strong>Upgrade to get:</strong>
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
                            <div className={styles.priceMain}>{activePrice}{strikePrice} <span className={styles.priceSub} style={{ fontWeight: 800, color: '#22c55e' }}>ONE-TIME PAYMENT - NO SUBSCRIPTION</span></div>
                            <div className={styles.priceDesc}>No weekly fees • Lifetime access</div>
                        </div>
                    </>
                )}

                {isAllLimit && (
                    <>
                        {formattedRenewal ? (
                            <p className={styles.renewalText}>
                                Credits will renew automatically on <strong>{formattedRenewal}</strong>. Can&apos;t wait?
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
                            <div className={styles.priceMain}>💰 Only {activePrice}{strikePrice} <span className={styles.priceSub} style={{ fontWeight: 800, color: '#22c55e' }}>ONE-TIME PAYMENT - NO SUBSCRIPTION</span></div>
                            <div className={styles.priceDesc}>No subscriptions • Lifetime access</div>
                        </div>
                    </>
                )}

                {isProgressBarUpgrade && (
                    <>
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
                            <div className={styles.priceMain}>💰 Only {activePrice}{strikePrice} <span className={styles.priceSub} style={{ fontWeight: 800, color: '#22c55e' }}>ONE-TIME PAYMENT - NO SUBSCRIPTION</span></div>
                            <div className={styles.priceDesc}>No subscriptions • Lifetime access</div>
                        </div>
                    </>
                )}

                {!isSpecialVariant && (
                    <p className={styles.description} style={{ lineHeight: '1.5', margin: '0 0 2rem 0' }}>
                        {message || "You have used all your free practice credits. Upgrade to Premium for unlimited access."}
                    </p>
                )}

                {isOfferActive && offerExpiryDate && (
                    <div style={{ marginBottom: '1.25rem', color: '#ef4444', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.6rem', borderRadius: '8px', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                        ⏱️ New Sign Up Offer (35% OFF) ends in: <Countdown targetDate={offerExpiryDate} />
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={handleUpgrade}
                        className={styles.upgradeBtn}
                    >
                        {isSpecialVariant ? (
                            (isAllLimit || isProgressBarUpgrade) ? "Unlock Full Access" :
                                (isPracticeLimit || isSimulationLimit ?
                                    (isSimulationLimit ? "Get Premium Access" : "Upgrade Now") : "Unlock Premium Access Now")
                        ) : (
                            <>
                                <span>Upgrade Now</span>
                                <span className={styles.priceTag}>{activePrice}</span>
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
                    {(isAllLimit || isProgressBarUpgrade) && (
                        <p className={styles.secondaryText}>
                            Some G1 apps charge $49/week or $159 lifetime.
                        </p>
                    )}

                    <button
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
                        onClick={() => {
                            if (onClose) onClose();
                            if (isAllLimit) {
                                router.push('/dashboard');
                            }
                        }}
                        className={`${styles.backBtn} ${isSpecialVariant ? styles.backBtnSpecial : ''}`}
                    >
                        {isProgressBarUpgrade ? "Not Now" : (isAllLimit ? "Back to Dashboard" : (isSpecialVariant ? "Not now, take me back" : "Back to Dashboard"))}
                    </button>
                </div>
            </div>

            <ParentShareModal 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                checkoutUrl={shareUrl}
                isPromoActive={isOfferActive}
            />
        </div>
    );
}
