"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

interface UserInfo {
    firstName: string;
    email: string;
    isPremium: boolean;
}

function ParentPayContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        if (!email && !userId) {
            setError("Missing email or userId. Please use the complete link provided in your email.");
            setLoading(false);
            return;
        }

        async function fetchUserInfo() {
            try {
                const param = userId ? `userId=${encodeURIComponent(userId)}` : `email=${encodeURIComponent(email!)}`;
                const response = await fetch(`/api/checkout/direct/info?${param}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("We couldn't find your child's account. Please check the link or contact support.");
                    }
                    throw new Error("Failed to load user information.");
                }

                const data = await response.json();
                setUserInfo({
                    firstName: data.firstName,
                    email: data.email,
                    isPremium: data.isPremium
                });
            } catch (err: any) {
                console.error("Error fetching parent checkout info:", err);
                setError(err.message || "An unexpected error occurred while loading this page.");
            } finally {
                setLoading(false);
            }
        }

        fetchUserInfo();
    }, [email, userId]);

    const handleUnlock = () => {
        const param = userId ? `userId=${encodeURIComponent(userId)}` : `email=${encodeURIComponent(email!)}`;
        window.location.href = `/api/checkout/direct?${param}`;
    };

    if (loading) {
        return (
            <div className={styles.card}>
                <div className={styles.logo}>G1 MASTER</div>
                <div className={styles.spinner}></div>
                <p className={styles.subtitle}>Securing payment portal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.card}>
                <div className={styles.logo}>G1 MASTER</div>
                <div className={styles.avatar}>⚠️</div>
                <h1 className={styles.title} style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Unable to Proceed</h1>
                <p className={styles.errorState}>{error}</p>
                <p className={styles.subtitle}>If you think this is a mistake, please sign in directly to your child's account to upgrade.</p>
            </div>
        );
    }

    if (userInfo?.isPremium) {
        return (
            <div className={styles.card}>
                <div className={styles.logo}>G1 MASTER</div>
                <div className={styles.avatar}>🎉</div>
                <h1 className={styles.title}>All Set!</h1>
                <div className={styles.alreadyPremium}>
                    {userInfo.firstName ? userInfo.firstName : "Your child"} already has full access to G1 Master Premium!
                </div>
                <p className={styles.subtitle}>They are fully unlocked to practice unlimited tests and mock simulations.</p>
            </div>
        );
    }

    const childName = userInfo?.firstName ? userInfo.firstName : "your child";

    return (
        <div className={styles.card}>
            <div className={styles.logo}>G1 MASTER</div>
            
            <div className={styles.header}>
                <div className={styles.avatar}>🧑‍🎓</div>
                <h1 className={styles.title}>Unlock Premium</h1>
                <p className={styles.subtitle}>
                    Help <span className={styles.highlight}>{childName}</span> pass the official Ontario G1 Driving Test on the first try.
                </p>
            </div>

            <div className={styles.perksList}>
                <div className={styles.perkItem}>
                    <span className={styles.perkIcon}>🏷️</span>
                    <div>
                        <div className={styles.perkTitle}>One-Time Payment of $12.98 CAD</div>
                        <div className={styles.perkDescription}>
                            Enjoy a special campaign discount of <span className={styles.highlight}>35% OFF</span> the standard price. Single payment, lifetime access. No subscriptions.
                        </div>
                    </div>
                </div>

                <div className={styles.perkItem}>
                    <span className={styles.perkIcon}>🛡️</span>
                    <div>
                        <div className={styles.perkTitle}>100% Pass Guarantee</div>
                        <div className={styles.perkDescription}>
                            Full, prompt refund if they do not pass their official G1 test on their very first attempt.
                        </div>
                    </div>
                </div>

                <div className={styles.perkItem}>
                    <span className={styles.perkIcon}>📈</span>
                    <div>
                        <div className={styles.perkTitle}>Track Learning Progress</div>
                        <div className={styles.perkDescription}>
                            They get detailed readiness scoring, signs & rules stats, and history tracking to know when they are 100% ready.
                        </div>
                    </div>
                </div>

                <div className={styles.perkItem}>
                    <span className={styles.perkIcon}>📚</span>
                    <div>
                        <div className={styles.perkTitle}>500+ Handbook Questions</div>
                        <div className={styles.perkDescription}>
                            Unlimited access to timed mock test simulations, categorized tests, and answers mapped to the MTO handbook.
                        </div>
                    </div>
                </div>
            </div>

            <button className={styles.ctaButton} onClick={handleUnlock}>
                Unlock Premium for {childName} ($12.98)
            </button>

            <div className={styles.guaranteeText}>
                <span>🔒 Secure checkout powered by Stripe</span>
            </div>
        </div>
    );
}

export default function ParentPayPage() {
    return (
        <div className={styles.container}>
            <Suspense fallback={
                <div className={styles.card}>
                    <div className={styles.logo}>G1 MASTER</div>
                    <div className={styles.spinner}></div>
                    <p className={styles.subtitle}>Loading G1 Master Portal...</p>
                </div>
            }>
                <ParentPayContent />
            </Suspense>
        </div>
    );
}
