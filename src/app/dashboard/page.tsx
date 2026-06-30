"use client";

import { supabase } from "@/lib/supabaseClient";
import styles from "./dashboard.module.css";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Clock, Book, Video, FileText, Car, Map, BookOpen, Lock, Gem } from "lucide-react";
import Link from "next/link";

import DashboardLayout from "@/components/DashboardLayout";
import { useRouter } from "next/navigation";
import LimitModal from "@/components/LimitModal";
import ParentShareModal from "@/components/ParentShareModal";
import FreeMockTestResultModal from "@/components/FreeMockTestResultModal";
import { sendGTMEvent } from "@/lib/gtm";
import ReadinessCheckSection from "../quiz/practice/components/ReadinessCheckSection";


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
    const { user, isPremium, practiceCredits, simulationCredits, renewalDate, loading, history, masteryProgress, isOfferActive, offerExpiryDate, refreshProfile } = useAuth();
    const router = useRouter();



    useEffect(() => {
        if (!loading && practiceCredits === null) {
            refreshProfile(true);
        }
    }, [loading, practiceCredits, refreshProfile]);

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
    const [selectedMode, setSelectedMode] = useState<'practice' | 'mastery' | 'simulation' | 'chapters' | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const selectModeParam = params.get('selectMode');
            if (selectModeParam === 'mastery') {
                setSelectedMode('mastery');
                setTimeout(() => {
                    const el = document.getElementById('mode-card-mastery');
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);
            }
        }
    }, []);

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

            let pending = localStorage.getItem('pending_freetest_results');
            if (!pending) {
                try {
                    const match = document.cookie.match(/(^| )pending_freetest_results=([^;]+)/);
                    if (match) {
                        pending = decodeURIComponent(match[2]);
                    }
                } catch (cookieErr) {
                    console.error('Failed to read backup cookie:', cookieErr);
                }
            }

            if (pending && user) {
                processingRef.current = true;
                try {
                    const result = JSON.parse(pending);

                    // Prevent saving if too old (e.g. > 1 hour)
                    if (Date.now() - result.timestamp > 3600000) {
                        localStorage.removeItem('pending_freetest_results');
                        document.cookie = "pending_freetest_results=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
                        console.log("Result already saved, clearing local storage and cookies.");
                        localStorage.removeItem('pending_freetest_results');
                        document.cookie = "pending_freetest_results=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
                        // Clear storage and backup cookies
                        localStorage.removeItem('pending_freetest_results');
                        document.cookie = "pending_freetest_results=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

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

    const handleStartChapters = () => {
        if (isPremium) {
            router.push("/chapter");
        } else {
            setLimitVariant("chapter_quiz");
            setShowLimitModal(true);
        }
    };

    const handleStartMasteryMap = () => {
        router.push("/masterymap");
    };

    // ===== NEW READINESS CALCULATION (Option A: Question-Volume Weighted Accuracy) =====
    // Aggregate question-level data from ALL study modes

    // 1. Mastery Map totals
    let masteryTotalAttempted = 0, masteryTotalCorrect = 0;
    let masteryRulesAttempted = 0, masteryRulesCorrect = 0;
    let masterySignsAttempted = 0, masterySignsCorrect = 0;
    Object.values(masteryProgress || {}).forEach(tp => {
        masteryTotalAttempted += tp.attempted || 0;
        masteryTotalCorrect += tp.correct || 0;
        masteryRulesAttempted += tp.rulesAttempted || 0;
        masteryRulesCorrect += tp.rulesCorrect || 0;
        masterySignsAttempted += tp.signsAttempted || 0;
        masterySignsCorrect += tp.signsCorrect || 0;
    });

    // 2. Practice Tests + Simulations totals (derived from simulation_results history)
    let practiceTotalAttempted = 0, practiceTotalCorrect = 0;
    let practiceRulesAttempted = 0, practiceRulesCorrect = 0;
    let practiceSignsAttempted = 0, practiceSignsCorrect = 0;
    (history || []).forEach((test: any) => {
        if (test.test_type === 'Rules of the Road') {
            practiceTotalAttempted += 10;
            practiceTotalCorrect += Math.round((test.score / 100) * 10);
            practiceRulesAttempted += 10;
            practiceRulesCorrect += test.rules_score || Math.round((test.score / 100) * 10);
        } else if (test.test_type === 'Road Signs') {
            practiceTotalAttempted += 10;
            practiceTotalCorrect += Math.round((test.score / 100) * 10);
            practiceSignsAttempted += 10;
            practiceSignsCorrect += test.signs_score || Math.round((test.score / 100) * 10);
        } else if (test.test_type === 'Mixed Practice') {
            practiceTotalAttempted += 10;
            practiceTotalCorrect += Math.round((test.score / 100) * 10);
            practiceRulesAttempted += 5;
            practiceRulesCorrect += test.rules_score || 0;
            practiceSignsAttempted += 5;
            practiceSignsCorrect += test.signs_score || 0;
        } else if (test.test_type === 'Simulation') {
            practiceTotalAttempted += 40;
            practiceTotalCorrect += Math.round((test.score / 100) * 40);
            practiceRulesAttempted += 20;
            practiceRulesCorrect += test.rules_score || 0;
            practiceSignsAttempted += 20;
            practiceSignsCorrect += test.signs_score || 0;
        }
    });

    // 3. Combine all sources
    const totalAttempted = masteryTotalAttempted + practiceTotalAttempted;
    const totalCorrect = masteryTotalCorrect + practiceTotalCorrect;
    const overallAccuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
    const volumeWeight = Math.min(totalAttempted / 500, 1.0);
    const computedPassProb = totalAttempted > 0
        ? Math.round(40 + (overallAccuracy * 50) * volumeWeight)
        : 40;

    // 4. Per-category accuracy (Rules vs Signs) from all sources
    const totalRulesAttempted = masteryRulesAttempted + practiceRulesAttempted;
    const totalRulesCorrect = masteryRulesCorrect + practiceRulesCorrect;
    const totalSignsAttempted = masterySignsAttempted + practiceSignsAttempted;
    const totalSignsCorrect = masterySignsCorrect + practiceSignsCorrect;

    const rulesAvg = totalRulesAttempted > 0
        ? Math.round((totalRulesCorrect / totalRulesAttempted) * 100)
        : null;
    const signsAvg = totalSignsAttempted > 0
        ? Math.round((totalSignsCorrect / totalSignsAttempted) * 100)
        : null;

    const hasDiagnostic = true;
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

    const modes = [
        {
            id: 'practice' as const,
            title: "Practice Tests",
            subtitle: "Over 1000 quick practice tests with instant feedback",
            description: "Build your confidence step-by-step. Our bite-sized Practice Tests consist of 10-question quizzes that let you master individual driving topics at your own pace with instant correct-answer feedback and questions that mirror the actual Ontario G1 exam.",
            isPremium: false,
            icon: FileText,
            image: '/dashboard_practice.png',
            metaChips: ["10 Questions", "Instant Feedback", "Free Mode"],
            ctaLabelFree: "Practice Now",
            ctaLabelPremium: "Practice Now",
            handler: handleStartPractice
        },
        {
            id: 'mastery' as const,
            title: "Mastery Map",
            subtitle: "Follow a step-by-step program to track and master every G1 topic",
            description: "A structured, step-by-step road map designed to guide you through all G1 exam topics. Track your progress visual-by-visual, complete milestones, and know exactly when you have completed the program and are ready to pass.",
            isPremium: false,
            icon: Map,
            image: '/dashboard_mastery.png',
            metaChips: ["11 Tests", "Progressive Logic", "Tests 1-3 Free"],
            ctaLabelFree: "Open Mastery Map",
            ctaLabelPremium: "Open Mastery Map",
            handler: handleStartMasteryMap
        },
        {
            id: 'simulation' as const,
            title: "G1 Exam Simulator",
            subtitle: "Experience the real G1 test under actual exam conditions",
            description: "The ultimate dress rehearsal. Experience the strict rules of the real Ontario G1 exam—including the 40-question limit, identical pass thresholds for rules and signs, and a realistic countdown timer.",
            isPremium: true,
            icon: Car,
            image: '/dashboard_simulation.png',
            metaChips: ["40 Questions", "MTO Standard", "Timed"],
            ctaLabelFree: "Unlock with Premium",
            ctaLabelPremium: "Take a Full Test",
            handler: handleStartSimulation
        },
        {
            id: 'chapters' as const,
            title: "Study by Chapter",
            subtitle: "Learn rule-by-rule with bite-sized lessons and targeted quizzes",
            description: "Go back to the basics with structured learning. Dive deep into specific sections of the Official MTO Handbook—from traffic signs and right-of-way rules to highway safety—accompanied by targeted practice questions.",
            isPremium: true,
            icon: BookOpen,
            image: '/dashboard_chapters.png',
            metaChips: ["Handbook Chapters", "Focused Progress", "Premium Mode"],
            ctaLabelFree: "Unlock with Premium",
            ctaLabelPremium: "Choose Chapter",
            handler: handleStartChapters
        }
    ];

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
                        <ReadinessCheckSection
                            rulesAvg={rulesAvg}
                            signsAvg={signsAvg}
                            passProbability={computedPassProb}
                            showWeakestName={true}
                            totalQuestionsAnswered={totalAttempted}
                            style={{ maxWidth: 'none', margin: '0 0 1.5rem 0' }}
                            title="Smart Readiness Calibration"
                        />
                    )}

                    <div className={styles.studySectionHeader}>
                        <h2 className={styles.studySectionTitle}>How do you want to study today?</h2>
                        <p className={styles.studySectionSubline}>Four ways to prep for your G1. Start with any one.</p>
                    </div>
                    
                    {/* Compact Grid of Buttons */}
                    <div className={styles.studyGrid}>
                        {modes.map((mode) => {
                            const isSelected = selectedMode === mode.id;
                            const isPremiumCard = mode.isPremium;
                            
                            // Visual accents
                            const borderClass = isSelected
                                ? (isPremiumCard ? styles.modeCardSelectedPremium : styles.modeCardSelectedFree)
                                : '';
                            const mutedClass = !isPremium && isPremiumCard ? styles.cardMuted : '';

                            return (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => setSelectedMode(prev => prev === mode.id ? null : mode.id)}
                                    className={`${styles.modeCard} ${borderClass} ${mutedClass}`}
                                    aria-expanded={isSelected}
                                    aria-controls="study-detail-panel"
                                    id={`mode-card-${mode.id}`}
                                >
                                    {/* Thumbnail Image Wrapper */}
                                    <div className={styles.thumbnailWrapper}>
                                        <img 
                                            src={mode.image} 
                                            alt={mode.title} 
                                            className={styles.thumbnailImg} 
                                        />
                                        {!isPremium && isPremiumCard && (
                                            <div className={styles.premiumBadgeCorner}>
                                                <Gem size={10} className={styles.premiumBadgeGem} />
                                                <span>Premium</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Details */}
                                    <div className={styles.cardTextContent}>
                                        <h3 className={styles.cardTitleText}>{mode.title}</h3>
                                        <p className={styles.cardSubtitleText}>{mode.subtitle}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
 
                    {/* Inline Expandable Detail Panel */}
                    {(() => {
                        const activeMode = modes.find(m => m.id === selectedMode);
                        return (
                            <div
                                id="study-detail-panel"
                                className={`${styles.detailPanel} ${activeMode ? styles.detailPanelOpen : ''}`}
                                aria-live="polite"
                            >
                                {activeMode && (
                                    <div className={styles.panelContent}>
                                        {/* Left Side: Info */}
                                        <div className={styles.panelLeft}>
                                            <div className={styles.panelTitleBlock}>
                                                <h3 className={styles.panelTitle}>{activeMode.title}</h3>
                                                {activeMode.isPremium && (
                                                    <span className={styles.panelPremiumTag}>Premium</span>
                                                )}
                                            </div>
                                            <p className={styles.panelDescription}>{activeMode.description}</p>
                                        </div>

                                        {/* Right Side: Meta & Actions */}
                                        <div className={styles.panelRight}>
                                            <div className={styles.chipsContainer}>
                                                {activeMode.metaChips.map((chip, idx) => (
                                                    <span key={idx} className={styles.metaChip}>{chip}</span>
                                                ))}
                                            </div>
                                            <div className={styles.panelCtaBlock}>
                                                <button
                                                    type="button"
                                                    onClick={activeMode.handler}
                                                    className={`${styles.panelCtaBtn} ${!isPremium && activeMode.isPremium ? styles.panelCtaBtnPremium : ''}`}
                                                >
                                                    {!isPremium && activeMode.isPremium ? activeMode.ctaLabelFree : activeMode.ctaLabelPremium}
                                                </button>
                                                {!isPremium && activeMode.isPremium && (
                                                    <p className={styles.panelCtaSub}>One-time purchase · keep it for good</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
 
                    {/* Test History Card moved to bottom */}
                    <div className={`${styles.widget} ${styles.testHistoryWidget} glass-panel`} style={{ marginTop: '1rem' }}>
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


