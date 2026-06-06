"use client";

import { supabase } from "@/lib/supabaseClient";
import styles from "./dashboard.module.css";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Clock, Book, Video, FileText, Car } from "lucide-react";
import Link from "next/link";

import DashboardLayout from "@/components/DashboardLayout";
// ... imports
import { useRouter } from "next/navigation";
import LimitModal from "@/components/LimitModal";
import ParentShareModal from "@/components/ParentShareModal";
import FreeMockTestResultModal from "@/components/FreeMockTestResultModal";
import { sendGTMEvent } from "@/lib/gtm";

function Countdown({ targetDate }: { targetDate: Date }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
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

    return <span className={styles.diagTimerVal}>{timeLeft}</span>;
}

export default function Dashboard() {
    const { user, isPremium, practiceCredits, simulationCredits, renewalDate, loading, history, isOfferActive, offerExpiryDate } = useAuth();
    const router = useRouter();

    // Helper to capitalize
    const formatName = (name: string) => {
        if (!name) return "";
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const meta = user?.user_metadata || {};
    const firstName = meta.first_name || "";
    const lastName = meta.last_name || "";

    let displayName = "User";
    if (firstName) {
        displayName = `${formatName(firstName)} ${formatName(lastName)}`.trim();
    } else if (user?.email) {
        displayName = user.email.split('@')[0];
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    const [showResultModal, setShowResultModal] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitVariant, setLimitVariant] = useState<'default' | 'chapter_quiz' | 'practice_limit' | 'simulation_quiz' | 'all_limit' | 'progressbar_upgrade'>('default');
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isShareOpen, setIsShareOpen] = useState(false);

    const handleShareWithParent = async () => {
        sendGTMEvent('begin_checkout', { source: 'dashboard_diagnostic_widget_share' });
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
                body: JSON.stringify({ isPromo: isOfferActive, source: 'dashboard_diagnostic_widget_share' })
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

    const handleUpgradeDirectly = async () => {
        sendGTMEvent('begin_checkout', { source: 'dashboard_diagnostic_widget' });
        setIsUpgrading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Please log in again.");
                setIsUpgrading(false);
                return;
            }

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ isPromo: isOfferActive, source: 'dashboard_diagnostic_widget' })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error(err);
            alert("Error initiating checkout.");
            setIsUpgrading(false);
        }
    };

    const processingRef = useRef(false);

    // Check for pending results from Free Test
    useEffect(() => {
        const savePendingResult = async () => {
            if (processingRef.current) return;

            const pending = localStorage.getItem('pending_freetest_results');
            if (pending && user) {
                processingRef.current = true;
                try {
                    const result = JSON.parse(pending);

                    // Prevent saving if too old (e.g. > 1 hour)
                    if (Date.now() - result.timestamp > 3600000) {
                        localStorage.removeItem('pending_freetest_results');
                        processingRef.current = false;
                        return;
                    }

                    // Double check if we already saved this specific result (idempotency)
                    const { data: existing } = await supabase
                        .from('simulation_results')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('created_at', new Date(result.timestamp).toISOString()) // Assuming we can use timestamp as unique ident or close to it
                        .limit(1)
                        .single();

                    if (existing) {
                        console.log("Result already saved, clearing local storage.");
                        localStorage.removeItem('pending_freetest_results');
                        return;
                    }

                    // Insert into DB
                    const { error } = await supabase.from('simulation_results').insert({
                        user_id: user.id,
                        score: result.score,
                        rules_score: result.rules_score,
                        signs_score: result.signs_score,
                        passed: result.passed,
                        test_type: 'Practice (First Try)',
                        created_at: new Date().toISOString()
                    });

                    if (!error) {
                        // Clear storage
                        localStorage.removeItem('pending_freetest_results');

                        // Show Modal
                        setResultData(result);
                        setShowResultModal(true);
                    } else {
                        console.error('Error saving pending result:', error);
                        processingRef.current = false; // Allow retry if error
                    }
                } catch (e) {
                    console.error(e);
                    processingRef.current = false;
                }
            }
        };

        savePendingResult();
    }, [user]);

    const handleStartPractice = () => {
        if (isPremium || (practiceCredits || 0) > 0) {
            router.push("/practice");
        } else {
            // Check if BOTH are 0 to show "all_limit" or just practice limit?
            // User requested: "When credits run out... shows the 'You’ve Reached the Free Limit' pop up."
            // If Sim credits are also 0, show All Limit.
            if ((simulationCredits || 0) <= 0) {
                setLimitVariant('all_limit');
            } else {
                setLimitVariant('practice_limit');
            }
            setShowLimitModal(true);
        }
    };

    const handleStartSimulation = () => {
        if (isPremium || (simulationCredits || 0) > 0) {
            router.push("/quiz/simulation");
        } else {
            setLimitVariant('simulation_quiz');
            setShowLimitModal(true);
        }
    };

    // Compute rolling averages for Rules and Signs categories
    // Option 2: last 3 category-specific tests rolling average (disregarding free/mixed tests)
    const getRollingCategoryAverages = (historyList: any[]) => {
        const rulesPercentages: number[] = [];
        const signsPercentages: number[] = [];

        for (const test of historyList) {
            if (rulesPercentages.length < 3 && test.test_type === 'Rules of the Road') {
                rulesPercentages.push(test.score);
            }
            if (signsPercentages.length < 3 && test.test_type === 'Road Signs') {
                signsPercentages.push(test.score);
            }
            if (rulesPercentages.length >= 3 && signsPercentages.length >= 3) {
                break;
            }
        }

        const rulesAvg = rulesPercentages.length > 0
            ? Math.round(rulesPercentages.reduce((a, b) => a + b, 0) / rulesPercentages.length)
            : null;

        const signsAvg = signsPercentages.length > 0
            ? Math.round(signsPercentages.reduce((a, b) => a + b, 0) / signsPercentages.length)
            : null;

        return { rulesAvg, signsAvg };
    };

    const { rulesAvg, signsAvg } = getRollingCategoryAverages(history || []);
    const hasDiagnostic = rulesAvg !== null || signsAvg !== null;

    let avgPercentage = 0;
    if (rulesAvg !== null && signsAvg !== null) {
        avgPercentage = (rulesAvg + signsAvg) / 2;
    } else if (rulesAvg !== null) {
        avgPercentage = rulesAvg;
    } else if (signsAvg !== null) {
        avgPercentage = signsAvg;
    }

    const computedPassProb = Math.round(40 + (avgPercentage * 0.5));
    const computedFailRisk = 100 - computedPassProb;
    const isTestReady = computedPassProb >= 80 && (rulesAvg === null || rulesAvg >= 80) && (signsAvg === null || signsAvg >= 80);
    const hasPracticeCredits = isPremium || (practiceCredits !== null && practiceCredits !== undefined && practiceCredits > 0);

    // Show loading state while auth is initializing or data is being fetched
    if (loading || (!isPremium && (practiceCredits === null || simulationCredits === null))) {
        return (
            <DashboardLayout>
                <div className={styles.dashboardGrid}>
                    <div className={styles.leftColumn}>
                        {/* Skeleton Banner */}
                        <div className={`${styles.banner} skeleton-pulse`} style={{ height: '150px', background: 'rgba(255,255,255,0.05)' }}></div>

                        {/* Skeleton Title */}
                        <h2 className={styles.sectionTitle} style={{ width: '200px', height: '24px', background: 'rgba(255,255,255,0.1)', marginTop: '2rem', borderRadius: '4px' }}></h2>

                        {/* Skeleton Cards */}
                        <div className={styles.actionCardsGrid}>
                            <div className={styles.actionCard} style={{ opacity: 0.5 }}>
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                                    <div style={{ width: '60%', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                                    <div style={{ width: '100%', height: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                                </div>
                            </div>
                            <div className={styles.actionCard} style={{ opacity: 0.5 }}>
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                                    <div style={{ width: '60%', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                                    <div style={{ width: '100%', height: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className={styles.dashboardGrid}>
                {/* Middle Column */}
                <div className={styles.leftColumn}>
                    <div className={styles.banner}>
                        <div className={styles.bannerDate}>{formattedDate}</div>
                        <div>
                            <h1 className={styles.bannerTitle}>Hello {displayName}</h1>
                            <p className={styles.bannerSubtitle}>
                                Success on your G1 test comes from steady practice, not last-minute cramming.
                            </p>
                        </div>
                    </div>

                    {hasDiagnostic && (
                        <div className={styles.diagnosticCard}>
                            <div className={styles.diagHeader}>
                                <h3 className={styles.diagTitle}>📊 G1 Diagnostic Status</h3>
                                <div className={`${styles.diagBadge} ${isTestReady ? styles.diagBadgeReady : styles.diagBadgeNotReady}`}>
                                    <span className={styles.diagDot} />
                                    <span>
                                        {isTestReady 
                                            ? `Test Ready (${computedPassProb}% Pass Probability)` 
                                            : `Not Test Ready (${computedFailRisk}% Failure Risk)`
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className={styles.diagGrid}>
                                <div className={styles.diagSection}>
                                    <div className={styles.diagSectionHeader}>
                                        <span className={styles.diagSectionTitle}>Rules of the Road</span>
                                        <span className={styles.diagSectionScore}>
                                            {rulesAvg !== null ? `${rulesAvg}%` : 'Not Tested'}
                                        </span>
                                    </div>
                                    <div className={styles.diagTrack}>
                                        <div 
                                            className={styles.diagBar} 
                                            style={{ 
                                                width: `${rulesAvg !== null ? rulesAvg : 0}%`, 
                                                background: (rulesAvg !== null && rulesAvg >= 80) ? '#22c55e' : '#ef4444' 
                                            }} 
                                        />
                                    </div>
                                </div>

                                <div className={styles.diagSection}>
                                    <div className={styles.diagSectionHeader}>
                                        <span className={styles.diagSectionTitle}>Road Signs</span>
                                        <span className={styles.diagSectionScore}>
                                            {signsAvg !== null ? `${signsAvg}%` : 'Not Tested'}
                                        </span>
                                    </div>
                                    <div className={styles.diagTrack}>
                                        <div 
                                            className={styles.diagBar} 
                                            style={{ 
                                                width: `${signsAvg !== null ? signsAvg : 0}%`, 
                                                background: (signsAvg !== null && signsAvg >= 80) ? '#22c55e' : '#ef4444' 
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {!isPremium && (
                                <div className={styles.diagUpgradeBox}>
                                    <p className={styles.diagUpgradeText}>
                                        <strong>⚠️ Ontario G1 Separate Passing Requirement:</strong> You must score 80% or higher in both sections separately to pass. Failure in one is a fail on the entire test. Upgrade to Premium to practice as much as you need!
                                    </p>
                                    {practiceCredits !== null && practiceCredits <= 0 && (
                                        <>
                                            <button 
                                                onClick={handleUpgradeDirectly} 
                                                disabled={isUpgrading} 
                                                className={styles.diagUpgradeBtn}
                                            >
                                                {isUpgrading ? 'Redirecting...' : `🚀 Unlock Full Premium Access - ${isOfferActive ? '$15.98 (20% OFF)' : '$19.97'}`}
                                            </button>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                                🔒 One-time payment. Lifetime access. No subscriptions.
                                            </div>
                                            <button
                                                onClick={handleShareWithParent}
                                                disabled={isSharing}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#2563eb',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    cursor: isSharing ? 'not-allowed' : 'pointer',
                                                    textDecoration: 'underline',
                                                    display: 'block',
                                                    margin: '0.5rem auto 0 auto',
                                                    textAlign: 'center',
                                                    padding: '0.25rem'
                                                }}
                                            >
                                                {isSharing ? 'Generating link...' : '🔗 Ask parent to pay (Share payment link)'}
                                            </button>
                                        </>
                                    )}
                                    {!hasPracticeCredits && renewalDate && (
                                        <div className={styles.diagTimerText}>
                                            ⏱️ {isOfferActive ? 'Next free credit & 20% OFF offer expires in: ' : 'Next free practice test unlocks in: '}<Countdown targetDate={renewalDate} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <h2 className={styles.sectionTitle}>How do you feel like studying today?</h2>
                    <div className={styles.actionCardsGrid}>
                        <div className={styles.actionCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardIcon}>
                                    <FileText size={48} strokeWidth={1.5} />
                                </div>

                            </div>
                            <h3 className={styles.actionTitle}>Practice Tests</h3>
                            <p className={styles.actionSubtitle}>Build confidence at your own pace.</p>
                            <p className={styles.actionDescription}>
                                Start building your knowledge the smart way. Review Road Signs or Rules of the Road with instant feedback after every question.
                            </p>

                            <button className={styles.actionBtn} onClick={handleStartPractice}>Practice Now</button>

                            {!isPremium && user && (
                                <p className={styles.creditText}>
                                    You have {practiceCredits} practice test {practiceCredits === 1 ? 'credit' : 'credits'} left
                                </p>
                            )}
                        </div>

                        <div className={styles.actionCard}>
                            <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className={styles.cardIcon}>
                                    <Car size={48} strokeWidth={1.5} />
                                </div>
                            </div>
                            <h3 className={styles.actionTitle}>G1 Test Simulation</h3>
                            <p className={styles.actionSubtitle}>Test yourself just like the real exam.</p>
                            <p className={styles.actionDescription}>
                                A true G1-style test with timed, mixed questions and no hints. Covers both Road Signs and Rules of the Road. See if you&apos;re ready to pass.
                            </p>

                            <button 
                                className={styles.actionBtn} 
                                onClick={handleStartSimulation}
                                style={!isPremium ? { background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' } : {}}
                            >
                                {!isPremium ? '👑 Unlock Simulation' : 'Take a Full Test'}
                            </button>
                        </div>
                    </div>

                    {/* Test History Card moved to bottom */}
                    <div className={`${styles.widget} ${styles.testHistoryWidget} glass-panel`} style={{ marginTop: '2.5rem' }}>
                        <h3 className={styles.sectionTitle}>Test History</h3>
                        <TestHistoryTable />
                    </div>
                </div>

            </div>

            <FreeMockTestResultModal
                isOpen={showResultModal}
                results={resultData}
                onClose={() => setShowResultModal(false)}
            />

            <LimitModal
                isOpen={showLimitModal}
                variant={limitVariant}
                renewalDate={renewalDate}
                onClose={() => setShowLimitModal(false)}
            />

            <ParentShareModal 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                checkoutUrl={shareUrl}
                isPromoActive={isOfferActive}
            />
        </DashboardLayout>
    );
}

function TestHistoryTable() {
    const { user, history } = useAuth();
    // No local state needed for fetching

    if (!history || history.length === 0) {
        return <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem' }}>No tests taken yet.</div>;
    }

    // Use cached history, take top 5
    const recentHistory = history.slice(0, 5);

    return (
        <div className={styles.historyListContainer}>
            <table className={styles.historyTable}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Test</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    {recentHistory.map((item, idx) => (
                        <tr key={idx}>
                            <td>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td>{item.test_type || 'Simulation'}</td>
                            <td>
                                <span className={`${styles.statusBadge} ${item.passed ? styles.passBadge : styles.failBadge}`}>
                                    {item.passed ? 'Pass' : 'Fail'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link href="/history" className={styles.showMoreLink} style={{
                    display: 'inline-block',
                    backgroundColor: '#000',
                    color: '#fff',
                    padding: '0.6rem 2rem',
                    borderRadius: '9999px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                }}>
                    Show More
                </Link>
            </div>
        </div>
    );
}


