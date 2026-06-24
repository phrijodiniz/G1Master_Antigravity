"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
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
import PricingCardGrid from '@/components/PricingCardGrid';

import { resultsConfig } from './resultsConfig';
import ScoreRevealSection from './components/ScoreRevealSection';
import ReadinessCheckSection from './components/ReadinessCheckSection';
import StakesSection from './components/StakesSection';
import BenefitsSection from './components/BenefitsSection';
import ProofSection from './components/ProofSection';
import PricingGridSection from './components/PricingGridSection';
import StickyCtaSection from './components/StickyCtaSection';

// Countdown component removed

interface ObservedSectionProps {
  sectionId: string;
  scoreBand: string;
  children: React.ReactNode;
}

function ObservedSection({ sectionId, scoreBand, children }: ObservedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !trackedRef.current) {
          trackedRef.current = true;
          try {
            sendGTMEvent('section_view', {
              section_id: sectionId,
              score_band: scoreBand,
              credits_remaining: 0
            });
            console.log('Tracked section_view:', sectionId, scoreBand);
          } catch (e) {
            console.error('Error sending GTM event:', e);
          }
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.3
    });

    const el = ref.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, [sectionId, scoreBand]);

  return <div ref={ref}>{children}</div>;
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
    const [resultSaved, setResultSaved] = useState(false);
    const [savedRecord, setSavedRecord] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleShareWithParent = async () => {
        if (!user) {
            alert("Please log in again.");
            return;
        }
        setIsSharing(true);
        import('@/lib/gtm').then(({ sendGTMEvent }) => {
            sendGTMEvent('begin_checkout', { source: 'practice_results_exhausted_share' });
        });
        try {
            const shareLink = `${window.location.origin}/parents/pay?userId=${user.id}`;
            setShareUrl(shareLink);
            setIsShareOpen(true);
        } catch (err) {
            console.error(err);
            alert("Error generating checkout link.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleSelectTier = async (tier: '2_weeks' | '30_days' | 'lifetime') => {
        sendGTMEvent('begin_checkout', { source: `practice_results_exhausted_${tier}` });
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
                body: JSON.stringify({ tier, source: 'practice_results_exhausted' })
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
                "Good news: improvement happens fast with practice."
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
        
        let currentRulesScore = 0;
        let currentSignsScore = 0;
        if (category === 'Mixed Practice') {
            currentRulesScore = userAnswers.filter(a => a?.question?.category === 'Rules of the Road' && a.isCorrect).length;
            currentSignsScore = userAnswers.filter(a => a?.question?.category === 'Road Signs' && a.isCorrect).length;
        }

        const currentTest = {
            test_type: category,
            score: currentScore,
            rules_score: category === 'Rules of the Road' ? score : (category === 'Mixed Practice' ? currentRulesScore : 0),
            signs_score: category === 'Road Signs' ? score : (category === 'Mixed Practice' ? currentSignsScore : 0)
        };

        const historyList = history || [];
        const isAlreadySaved = savedRecord && historyList.some((item: any) => item.id === savedRecord.id);

        const combinedHistory = isAlreadySaved ? historyList : [currentTest, ...historyList];

        const rulesPercentages: number[] = [];
        const signsPercentages: number[] = [];

        for (const test of combinedHistory) {
            if (test.test_type === 'Rules of the Road') {
                if (rulesPercentages.length < 3) rulesPercentages.push(test.score);
            } else if (test.test_type === 'Road Signs') {
                if (signsPercentages.length < 3) signsPercentages.push(test.score);
            } else if (test.test_type === 'Mixed Practice') {
                if (rulesPercentages.length < 3) {
                    rulesPercentages.push((test.rules_score || 0) * 20);
                }
                if (signsPercentages.length < 3) {
                    signsPercentages.push((test.signs_score || 0) * 20);
                }
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
    }, [completed, score, questions.length, history, category, savedRecord, userAnswers]);

    const { rulesAvg, signsAvg } = rollingCategoryAverages;

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

        const rawPassProb = Math.round(40 + (avgPercentage * 0.5));
        
        // Count practice history length (including current test if completed)
        const currentTestTmp = { test_type: category };
        const historyListTmp = history || [];
        const isAlreadySavedTmp = savedRecord && historyListTmp.some((item: any) => item.id === savedRecord.id);
        const combinedHistoryTmp = isAlreadySavedTmp ? historyListTmp : [currentTestTmp, ...historyListTmp];
        const practiceHistoryCount = combinedHistoryTmp.filter(
            (test: any) => test.test_type === 'Rules of the Road' || test.test_type === 'Road Signs' || test.test_type === 'Mixed Practice'
        ).length;

        // Apply confidence weight based on number of tests completed
        let weight = 1.0;
        if (practiceHistoryCount <= 0) {
            weight = 0.0;
        } else if (practiceHistoryCount === 1) {
            weight = 0.35;
        } else if (practiceHistoryCount <= 3) {
            weight = 0.56;
        } else if (practiceHistoryCount <= 6) {
            weight = 0.70;
        } else if (practiceHistoryCount <= 9) {
            weight = 0.78;
        } else {
            weight = 1.0;
        }

        return Math.round(40 + (rawPassProb - 40) * weight);
    }, [rollingCategoryAverages, history, category, savedRecord]);

    const recent3PracticeTests = useMemo(() => {
        if (!completed || questions.length === 0) return [];

        const currentScore = Math.round((score / questions.length) * 100);
        
        const currentTest = {
            test_type: category,
            score: currentScore
        };

        const historyList = history || [];
        const isAlreadySaved = savedRecord && historyList.some((item: any) => item.id === savedRecord.id);
        const combinedHistory = isAlreadySaved ? historyList : [currentTest, ...historyList];

        const practiceHistory = combinedHistory.filter(
            (test: any) => test.test_type === 'Rules of the Road' || test.test_type === 'Road Signs'
        );

        return practiceHistory.slice(0, 3).reverse();
    }, [completed, score, questions.length, history, category, savedRecord]);

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

        if (category === 'Mixed Practice') {
            const { data: rulesData } = await supabase.rpc('get_random_questions', {
                limit_count: 5,
                category_filter: 'Rules of the Road'
            });
            const { data: signsData } = await supabase.rpc('get_random_questions', {
                limit_count: 5,
                category_filter: 'Road Signs'
            });
            
            let finalQuestions = [...(rulesData || []), ...(signsData || [])];
            
            if (finalQuestions.length < 10) {
                const { data: fallbackRules } = await supabase.from('questions').select('*').eq('category', 'Rules of the Road').limit(5);
                const { data: fallbackSigns } = await supabase.from('questions').select('*').eq('category', 'Road Signs').limit(5);
                finalQuestions = [...(fallbackRules || []), ...(fallbackSigns || [])];
            }
            
            const shuffled = finalQuestions.sort(() => Math.random() - 0.5);
            setQuestions(shuffled);
            setLoading(false);
            return;
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

    useEffect(() => {
        if (completed && user && !resultSaved && questions.length > 0) {
            setResultSaved(true); // Prevent double save
            setIsSaving(true);
            const saveToDB = async () => {
                let rulesScoreDb = 0;
                let signsScoreDb = 0;
                let isPassed = false;
                
                if (category === 'Rules of the Road') {
                    rulesScoreDb = score;
                    isPassed = score >= 8;
                } else if (category === 'Road Signs') {
                    signsScoreDb = score;
                    isPassed = score >= 8;
                } else if (category === 'Mixed Practice') {
                    rulesScoreDb = userAnswers.filter(a => a?.question?.category === 'Rules of the Road' && a.isCorrect).length;
                    signsScoreDb = userAnswers.filter(a => a?.question?.category === 'Road Signs' && a.isCorrect).length;
                    isPassed = rulesScoreDb >= 4 && signsScoreDb >= 4;
                } else {
                    isPassed = Math.round((score / questions.length) * 100) >= 80;
                }

                const payload = {
                    user_id: user.id,
                    score: Math.round((score / questions.length) * 100),
                    rules_score: rulesScoreDb,
                    signs_score: signsScoreDb,
                    passed: isPassed,
                    test_type: category || 'Practice'
                };
                console.log('Attempting to save result:', payload);
                const { data, error } = await supabase.from('simulation_results').insert(payload).select();

                if (error) {
                    console.error('Error saving result:', error);
                    alert('Error saving result: ' + error.message);
                } else {
                    console.log('Result saved successfully:', data);
                    if (data && data.length > 0) {
                        setSavedRecord(data[0]);
                    }

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

                    // Consume Credit (Implicit) & Refresh History
                    await refreshProfile(true);
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
            setSavedRecord(null);
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

        const displayRenewal = renewalDate || (() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d;
        })();
        const formattedRenewal = displayRenewal.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });

        // Compute scores
        let rulesScoreVal = 0;
        let signsScoreVal = 0;
        if (category === 'Rules of the Road') {
            rulesScoreVal = score;
        } else if (category === 'Road Signs') {
            signsScoreVal = score;
        } else if (category === 'Mixed Practice') {
            rulesScoreVal = userAnswers.filter(a => a?.question?.category === 'Rules of the Road' && a.isCorrect).length;
            signsScoreVal = userAnswers.filter(a => a?.question?.category === 'Road Signs' && a.isCorrect).length;
        }

        const percentage = Math.round((score / questions.length) * 100);
        let scoreBand: 'passing' | 'borderline' | 'failing' = 'failing';
        if (percentage >= 80) {
            scoreBand = 'passing';
        } else if (percentage >= 60) {
            scoreBand = 'borderline';
        } else {
            scoreBand = 'failing';
        }

        const bandConfig = resultsConfig.scoreBands[scoreBand];

        const currentTestTmp = { test_type: category };
        const historyListTmp = history || [];
        const isAlreadySavedTmp = savedRecord && historyListTmp.some((item: any) => item.id === savedRecord.id);
        const combinedHistoryTmp = isAlreadySavedTmp ? historyListTmp : [currentTestTmp, ...historyListTmp];
        const practiceHistoryCount = combinedHistoryTmp.filter(
            (test: any) => test.test_type === 'Rules of the Road' || test.test_type === 'Road Signs' || test.test_type === 'Mixed Practice'
        ).length;

        if (!hasCredits) {
            return (
                <DashboardLayout>
                    <div className={styles.mainWrapper} style={{ paddingBottom: '120px' }}>
                        {resultsConfig.sectionsOrder.map((sectionId) => {
                            let component: React.ReactNode = null;
                            if (sectionId === 'score') {
                                component = (
                                    <ScoreRevealSection
                                        score={score}
                                        totalQuestions={questions.length}
                                        rulesScore={rulesScoreVal}
                                        signsScore={signsScoreVal}
                                        band={scoreBand}
                                        config={bandConfig}
                                    />
                                );
                            } else if (sectionId === 'readiness') {
                                component = (
                                    <ReadinessCheckSection
                                        rulesAvg={rulesAvg}
                                        signsAvg={signsAvg}
                                        passProbability={passProbability}
                                        showWeakestName={resultsConfig.toggles.showWeakestSectionName}
                                        practiceCount={practiceHistoryCount}
                                    />
                                );
                            } else if (sectionId === 'stakes') {
                                if (resultsConfig.toggles.showStakes) {
                                    component = (
                                        <StakesSection
                                            band={scoreBand}
                                            config={bandConfig}
                                        />
                                    );
                                }
                            } else if (sectionId === 'benefits') {
                                component = (
                                    <BenefitsSection
                                        band={scoreBand}
                                        config={bandConfig}
                                    />
                                );
                            } else if (sectionId === 'proof') {
                                if (resultsConfig.toggles.showProof) {
                                    component = <ProofSection />;
                                }
                            } else if (sectionId === 'pricing') {
                                component = (
                                    <PricingGridSection
                                        pricing={resultsConfig.pricing}
                                        onSelectTier={handleSelectTier}
                                        isSubmitting={isUpgrading}
                                    />
                                );
                            }

                            if (!component) return null;

                            return (
                                <ObservedSection key={sectionId} sectionId={sectionId} scoreBand={scoreBand}>
                                    {component}
                                </ObservedSection>
                            );
                        })}

                        {/* Extra non-sticky standard options for conversion landing page */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
                            <button
                                onClick={handleShareWithParent}
                                disabled={isSharing}
                                className={styles.parentPayBtn}
                                style={{ width: '100%' }}
                            >
                                {isSharing ? 'Generating link...' : '🔗 Ask Parent to Pay (Share Link)'}
                            </button>
                            
                            <button
                                onClick={() => {
                                    setLimitVariant('all_limit');
                                    setShowLimitModal(true);
                                }}
                                className={styles.lockedBtn}
                                style={{ width: '100%' }}
                            >
                                🔒 Retake {category} Test (0 Credits)
                            </button>
                            
                            <div
                                onClick={() => setShowReview(!showReview)}
                                style={{
                                    marginTop: '1rem',
                                    color: '#64748b',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    textAlign: 'center',
                                    userSelect: 'none'
                                }}
                            >
                                {showReview ? 'Hide My Answers' : 'Review My Answers'}
                            </div>
                        </div>

                        {/* Answers Review Section */}
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

                    <StickyCtaSection
                        onShareParent={handleShareWithParent}
                        onShowLimits={() => {
                            setLimitVariant('all_limit');
                            setShowLimitModal(true);
                        }}
                        category={category || ''}
                        nextCategory={nextCategory}
                        isSharing={isSharing}
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
                        <div style={{ marginTop: '1.5rem', marginBottom: '0.2rem' }}>
                            {passProbability >= 80 ? (
                                <div className={`${styles.riskBadge} ${styles.riskBadgeReady}`} style={{ marginBottom: '0px' }}>
                                    <span className={`${styles.riskDot} ${styles.riskDotReady}`} />
                                    <span>G1 Ready ({passProbability}% Pass Probability)</span>
                                </div>
                            ) : (
                                <div className={`${styles.riskBadge} ${styles.riskBadgeNotReady}`} style={{ marginBottom: '0px' }}>
                                    <span>Not Test Ready ({100 - passProbability}% Failure Risk*)</span>
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem', fontWeight: 500 }}>
                            *Calculated based on your rolling average across all tests
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

                        <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', margin: '1.5rem 0' }}>
                            {motivationQuote}
                        </p>

                        <div className={styles.ctaStack}>
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
                            {isPremium && (
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
