"use client";

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import styles from '../shared_quiz_layout.module.css';
import DashboardLayout from '@/components/DashboardLayout'; // Changed from Sidebar
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import ExitModal from '@/components/ExitModal';
import LimitModal from '@/components/LimitModal';
import ParentShareModal from '@/components/ParentShareModal';
import { sendGTMEvent } from '@/lib/gtm';

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

    return <span className={styles.countdownText}>{timeLeft}</span>;
}

function QuizContent() {
    const { user, isPremium, practiceCredits, refreshProfile, renewalDate, loading: authLoading, history, isOfferActive, offerExpiryDate } = useAuth();
    const searchParams = useSearchParams();
    const category = searchParams.get('category'); // e.g., "Rules of the Road"

    const [questions, setQuestions] = useState<any[]>([]);
    const [currentindex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<any[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [limitVariant, setLimitVariant] = useState<'practice_limit' | 'all_limit'>('practice_limit');
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isShareOpen, setIsShareOpen] = useState(false);

    const handleShareWithParent = async () => {
        sendGTMEvent('begin_checkout', { source: 'practice_results_exhausted_share' });
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
                body: JSON.stringify({ isPromo: isOfferActive, source: 'practice_results_exhausted_share' })
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
        sendGTMEvent('begin_checkout', { source: 'practice_results_exhausted' });
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
                body: JSON.stringify({ isPromo: isOfferActive, source: 'practice_results_exhausted' })
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

    // Compute motivational quote
    const motivationQuote = useMemo(() => {
        if (!completed || questions.length === 0) return "";
        const percentage = (score / questions.length) * 100;

        let texts = [];
        if (percentage <= 40) {
            texts = [
                "This is your starting point. Let’s build from here.",
                "Good news: improvement happens fast with practice.",
                "Let’s run it again and raise that score."
            ];
        } else if (percentage <= 60) {
            texts = [
                "You’re halfway there — keep the momentum going.",
                "A few small improvements can make a big difference.",
                "Try again now and push it higher."
            ];
        } else if (percentage <= 80) {
            texts = [
                "You’re just a couple of questions away from passing.",
                "Close, but close doesn’t pass the real G1.",
                "A few more attempts could push you over the line."
            ];
        } else if (percentage < 100) {
            texts = [
                "Strong score. Can you make it consistent?",
                "That’s impressive. Can you do it again?",
                "That’s what almost test-ready looks like!"
            ];
        } else {
            texts = [
                "Perfect score. Can you do it again?",
                "That’s what test-ready looks like. Think you can repeat it?",
                "Prove it wasn’t luck and take another one."
            ];
        }

        return texts[Math.floor(Math.random() * texts.length)];
    }, [completed, score, questions.length]);

    // Compute rolling averages for Rules and Signs categories
    // Option 2: last 3 category-specific tests rolling average (disregarding free/mixed tests)
    const rollingCategoryAverages = useMemo(() => {
        if (!completed || questions.length === 0) return { rulesAvg: null, signsAvg: null };

        const currentScore = Math.round((score / questions.length) * 100);
        
        // We inject the newly completed test to evaluate the new rolling average
        const currentTest = {
            test_type: category,
            score: currentScore
        };

        const combinedHistory = [currentTest, ...(history || [])];

        const rulesPercentages: number[] = [];
        const signsPercentages: number[] = [];

        for (const test of combinedHistory) {
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
    }, [completed, score, questions.length, history, category]);

    // Compute pass probability based on rolling averages of Rules and Signs
    const passProbability = useMemo(() => {
        const { rulesAvg, signsAvg } = rollingCategoryAverages;

        let avgPercentage = 0;
        if (rulesAvg !== null && signsAvg !== null) {
            avgPercentage = (rulesAvg + signsAvg) / 2;
        } else if (rulesAvg !== null) {
            avgPercentage = rulesAvg;
        } else if (signsAvg !== null) {
            avgPercentage = signsAvg;
        } else {
            return 40; // Base baseline
        }

        return Math.round(40 + (avgPercentage * 0.5));
    }, [rollingCategoryAverages]);

    const STORAGE_KEY = `practice_session_${category}`;

    // Auth & Init
    useEffect(() => {
        if (authLoading) return; // Wait until the profile is fetched

        if (!user) {
            setShowLoginModal(true);
            setLoading(false);
        } else {
            setShowLoginModal(false);
            if (questions.length === 0 && !completed) {
                fetchQuestions();
            }
        }
    }, [user, category, authLoading, questions.length, completed]);

    async function fetchQuestions() {
        if (!category) return;
        setLoading(true);

        // Check credits
        if (!isPremium && (practiceCredits ?? 0) <= 0) {
            setLoading(false);
            setLimitVariant('practice_limit');
            setShowLimitModal(true);
            return;
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Date.now() - parsed.timestamp < 3600000) {
                    setQuestions(parsed.questions);
                    setCurrentIndex(parsed.currentindex);
                    setScore(parsed.score);
                    setUserAnswers(parsed.userAnswers);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error(e);
            }
        }

        const { data, error } = await supabase.rpc('get_random_questions', {
            limit_count: 10,
            category_filter: category
        });
        if (error || !data) {
            const { data: fallback } = await supabase.from('questions').select('*').eq('category', category).limit(10);
            setQuestions(fallback || []);
        } else {
            setQuestions(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (!loading && questions.length > 0 && !completed) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                timestamp: Date.now(),
                questions, currentindex, score, userAnswers
            }));
        } else if (completed) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [questions, currentindex, score, userAnswers, loading, completed]);

    // Save Result to DB on completion
    const [resultSaved, setResultSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (completed && user && !resultSaved && questions.length > 0) {
            setResultSaved(true); // Prevent double save
            setIsSaving(true);
            const saveToDB = async () => {
                const isRules = category === 'Rules of the Road';
                const payload = {
                    user_id: user.id,
                    score: Math.round((score / questions.length) * 100),
                    rules_score: isRules ? score : 0,
                    signs_score: !isRules ? score : 0,
                    passed: Math.round((score / questions.length) * 100) >= 80,
                    test_type: category || 'Practice'
                };
                console.log('Attempting to save result:', payload);
                const { data, error } = await supabase.from('simulation_results').insert(payload).select();

                if (error) {
                    console.error('Error saving result:', error);
                    alert('Error saving result: ' + error.message);
                } else {
                    console.log('Result saved successfully:', data);

                    try {
                        const scorePercent = Math.round((score / questions.length) * 100);
                        fetch('/api/activity', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                eventData: [
                                    new Date().toISOString(),
                                    user.email || 'unknown_email',
                                    user.user_metadata?.first_name || 'unknown_name',
                                    `Practice (${category}) Completed - Score: ${scorePercent}%`
                                ]
                            })
                        });
                    } catch (sheetError) {
                        console.error("Failed to append activity to sheet", sheetError);
                    }

                    // Consume Credit (Implicit)
                    if (!isPremium) {
                        await refreshProfile(true);
                    }
                }
                setIsSaving(false);
            };
            saveToDB();
        }
    }, [completed, user, category, score, questions.length, isPremium, refreshProfile]);

    const handleNext = (wasCorrect: boolean, selectedIndex: number) => {
        if (wasCorrect) setScore(p => p + 1);
        setUserAnswers(p => [...p, {
            question: questions[currentindex],
            selectedIndex,
            isCorrect: wasCorrect
        }]);

        if (currentindex < questions.length - 1) {
            setCurrentIndex(p => p + 1);
        } else {
            setCompleted(true);
        }
    };

    const [showExitModal, setShowExitModal] = useState(false);

    const handleExitClick = () => {
        setShowExitModal(true);
    };

    const confirmExit = () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = '/practice'; // Go back to selection
    };

    const handleRetake = (targetCategory: string) => {
        if (isPremium || (practiceCredits && practiceCredits > 0)) {
            localStorage.removeItem(STORAGE_KEY);
            if (targetCategory !== category) {
                window.location.href = `/quiz/practice?category=${encodeURIComponent(targetCategory)}`;
            } else {
                setQuestions([]);
                setCurrentIndex(0);
                setScore(0);
                setUserAnswers([]);
                setCompleted(false);
                setShowReview(false);
                setResultSaved(false);
            }
        } else {
            setLimitVariant('all_limit');
            setShowLimitModal(true);
        }
    };

    // --- Renders ---

    if (showLimitModal && !completed) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem', color: '#64748b' }}>Checking eligibility...</div>
            </div>
            <LimitModal
                isOpen={true}
                onClose={() => setShowLimitModal(false)}
                variant={limitVariant}
                renewalDate={renewalDate}
            />
        </DashboardLayout>
    );

    if (loading) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem', color: '#64748b' }}>Loading questions...</div>
            </div>
        </DashboardLayout>
    );

    if (!user) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <LoginModal isOpen={true} onClose={() => setShowLoginModal(false)} />
            </div>
        </DashboardLayout>
    );

    if (error || (questions.length === 0)) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem' }}>No questions found for {category}.</div>
            </div>
        </DashboardLayout>
    );

    if (completed) {
        // Results
        const hasCredits = isPremium || (practiceCredits !== null && practiceCredits !== undefined && practiceCredits > 0);
        const nextCategory = category === 'Rules of the Road' ? 'Road Signs' : 'Rules of the Road';

        return (
            <DashboardLayout>
                <div className={styles.mainWrapper}>
                    <div className={styles.resultsContainer}>
                        <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500, marginBottom: '1rem' }}>
                            Score
                        </div>
                        <div style={{ fontSize: '5rem', fontWeight: 800, color: '#e1ff21', WebkitTextStroke: '2.5px black', lineHeight: 1 }}>
                            {score}/{questions.length}
                        </div>
                        
                        {/* Status badge based on pass probability / score readiness */}
                        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                            {passProbability >= 80 ? (
                                <div className={`${styles.riskBadge} ${styles.riskBadgeReady}`}>
                                    <span className={`${styles.riskDot} ${styles.riskDotReady}`} />
                                    <span>G1 Ready ({passProbability}% Pass Probability)</span>
                                </div>
                            ) : (
                                <div className={`${styles.riskBadge} ${styles.riskBadgeNotReady}`}>
                                    <span className={`${styles.riskDot} ${styles.riskDotNotReady}`} />
                                    <span>Not Test Ready ({100 - passProbability}% Failure Risk)</span>
                                </div>
                            )}
                        </div>

                        {/* Double-80% Ontario warning */}
                        <div className={styles.doubleTrapBox}>
                            <div className={styles.doubleTrapTitle}>
                                ⚠️ Ontario G1 Separate Passing Requirement
                            </div>
                            <p className={styles.doubleTrapText}>
                                The official Ontario G1 exam requires scoring at least <strong>80% on Rules of the Road</strong> AND <strong>80% on Road Signs</strong> separately to pass. If you fail either section, you fail the whole test. Practice until both categories show safe margins.
                            </p>
                        </div>

                        {/* Timer countdown if user is out of credits */}
                        {!hasCredits && renewalDate && (
                            <div className={styles.countdownBox}>
                                ⏱️ {isOfferActive ? 'Next free credit & 20% OFF offer expires in: ' : 'Next free practice test unlocks in: '}<Countdown targetDate={renewalDate} />
                            </div>
                        )}

                        <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', margin: '1.5rem 0' }}>
                            {motivationQuote}
                        </p>

                        <div className={styles.ctaStack}>
                            {!hasCredits ? (
                                <>
                                    <button
                                        onClick={handleUpgradeDirectly}
                                        disabled={isUpgrading}
                                        className={styles.primaryUpgradeBtn}
                                    >
                                        {isUpgrading 
                                            ? 'Redirecting to checkout...' 
                                            : `🚀 Unlock Full Premium Access - ${isOfferActive ? '$15.98 (20% OFF)' : '$19.97'}`
                                        }
                                    </button>
                                    <div style={{ fontSize: '0.85rem', color: '#475569', textAlign: 'center', marginTop: '0.4rem', fontWeight: 600 }}>
                                        🔒 One-Time Payment • Lifetime Access • No Subscriptions
                                    </div>
                                    <button
                                        onClick={handleShareWithParent}
                                        disabled={isSharing}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#2563eb',
                                            fontSize: '0.85rem',
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
                                    <div className={styles.guaranteeText}>
                                        🛡️ Pass Guarantee: Pass on your first try or get a 100% refund.
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            setLimitVariant('all_limit');
                                            setShowLimitModal(true);
                                        }}
                                        className={styles.lockedBtn}
                                    >
                                        🔒 Retake {category} Test (0 Credits)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLimitVariant('all_limit');
                                            setShowLimitModal(true);
                                        }}
                                        className={styles.lockedBtn}
                                    >
                                        🔒 Take {nextCategory} Test (0 Credits)
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleRetake(category as string)}
                                        disabled={isSaving}
                                        style={{
                                            width: '100%',
                                            background: isSaving ? '#94a3b8' : '#0f172a', color: 'white', padding: '1rem',
                                            borderRadius: '8px', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem'
                                        }}
                                    >
                                        {isSaving ? 'Processing...' : `Retake ${category} Test`}
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleRetake(nextCategory);
                                        }}
                                        disabled={isSaving}
                                        style={{
                                            width: '100%',
                                            background: 'white', color: isSaving ? '#cbd5e1' : '#0f172a', padding: '1rem',
                                            borderRadius: '8px', border: '1px solid #e2e8f0', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem'
                                        }}
                                    >
                                        Take {nextCategory} Test
                                    </button>
                                </>
                            )}
                            
                            <div
                                onClick={() => setShowReview(!showReview)}
                                style={{
                                    marginTop: '0.5rem',
                                    color: '#64748b',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    userSelect: 'none'
                                }}
                            >
                                {showReview ? 'Hide My Answers' : 'Review My Answers'}
                            </div>
                        </div>
                    </div>

                    {showReview && (
                        <div className={styles.reviewSection}>
                            <h2 style={{ paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>Review Answers</h2>
                            {userAnswers.map((ans, idx) => (
                                <div key={idx} className={styles.reviewCard} style={{ borderLeft: `4px solid ${ans.isCorrect ? '#22c55e' : '#ef4444'}` }}>
                                    <h3 style={{ marginBottom: '1rem' }}>{idx + 1}. {ans.question.text}</h3>
                                    {ans.question.media_url && <img src={ans.question.media_url} style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }} />}

                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {ans.question.options.map((opt: string, optIdx: number) => {
                                            let color = 'inherit';
                                            let weight = 'normal';
                                            if (optIdx === ans.question.correct_index) { color = '#15803d'; weight = '700'; }
                                            else if (optIdx === ans.selectedIndex && !ans.isCorrect) { color = '#b91c1c'; }

                                            return (
                                                <div key={optIdx} style={{ color, fontWeight: weight }}>
                                                    {optIdx === ans.selectedIndex && (ans.isCorrect ? '✅ ' : '❌ ')}
                                                    {opt} {optIdx === ans.question.correct_index && optIdx !== ans.selectedIndex && '(Correct Answer)'}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <LimitModal
                    isOpen={showLimitModal}
                    onClose={() => setShowLimitModal(false)}
                    variant={limitVariant}
                    renewalDate={renewalDate}
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

    return (
        <DashboardLayout fullWidth={true} hideTopBar={true}>
            <div className={styles.mainWrapper}>
                <div className={styles.header}>
                    <div className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {category}
                    </div>
                    {/* Stats removed to prevent duplication */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                        <button className={styles.exitBtn} onClick={handleExitClick}>Exit Practice</button>
                    </div>
                </div>

                <div className={styles.contentGrid} style={{ gridTemplateColumns: 'minmax(0, 1000px)', justifyContent: 'center' }}>
                    {/* Left Column: Question */}
                    <div>
                        <QuestionCard
                            question={questions[currentindex]}
                            onNext={handleNext}
                            isLast={currentindex === questions.length - 1}
                            mode="practice"
                            // Find answer for this index in userAnswers history? 
                            // userAnswers is push-only history, so finding by index might be tricky if we skipped? 
                            // But usually we don't skip in practice. 
                            // Let's rely on QuestionCard's internal state resetting for now to keep it simple, 
                            // OR, improved: find partial answer if we want navigation support.
                            // For minimal risk path: Don't pass 'selected' yet, relies on resets. 
                            // But if user navigates back, it will be blank. That's acceptable for "Practice" mode usually.
                            // Better: Pass selected if found.
                            selected={userAnswers.find(a => a.question.id === questions[currentindex].id)?.selectedIndex}
                            onAnswer={() => { }}
                            progressLabel={`Question ${currentindex + 1} / ${questions.length}`}
                        />
                    </div>

                    {/* Right Column: Navigator REMOVED */}
                </div>
            </div>
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            <ExitModal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirm={confirmExit}
            />
            <LimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                variant={limitVariant}
                renewalDate={renewalDate}
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

export default function PracticeQuiz() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <QuizContent />
        </Suspense>
    );
}
