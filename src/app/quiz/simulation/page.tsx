"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import styles from '../shared_quiz_layout.module.css';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import ExitModal from '@/components/ExitModal';

import LimitModal from '@/components/LimitModal';

// format seconds to MM:SS
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

function SimulationContent() {
    const { user, isPremium, simulationCredits, refreshProfile, renewalDate, loading: authLoading, history } = useAuth();
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentindex, setCurrentIndex] = useState(0);

    // Tracking
    const [answers, setAnswers] = useState<Record<number, { correct: boolean, selected: number }>>({});

    const [loading, setLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false); // Added state
    const [showLimitModal, setShowLimitModal] = useState(false); // Added state
    const [resultSaved, setResultSaved] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [limitVariant, setLimitVariant] = useState<'simulation_quiz' | 'all_limit'>('simulation_quiz');

    const STORAGE_KEY = 'simulation_session';

    const totalScore = useMemo(() => {
        let score = 0;
        questions.forEach((q, idx) => {
            if (answers[idx]?.correct) score++;
        });
        return score;
    }, [questions, answers]);

    const motivationQuote = useMemo(() => {
        if (!completed || questions.length === 0) return "";
        const percentage = (totalScore / questions.length) * 100;

        let texts = [];
        if (percentage <= 40) {
            texts = [
                "This is your starting point — now let’s build from here.",
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
                "That’s what almost test-ready looks like. Think you can repeat it?"
            ];
        } else {
            texts = [
                "Perfect score. Can you do it again?",
                "That’s what test-ready looks like. Think you can repeat it?",
                "Prove it wasn’t luck and take another one."
            ];
        }

        return texts[Math.floor(Math.random() * texts.length)];
    }, [completed, totalScore, questions.length]);

    const passProbability = useMemo(() => {
        if (!completed || questions.length === 0) return 0;

        // Find prior simulation tests in history
        const priorSimTests = (history || []).filter((h: any) => h.test_type === 'Simulation');

        // Compute current score percent
        const currentScorePercent = (totalScore / 40) * 100;

        // Compile the recent scores (up to 5)
        const recentScores = [currentScorePercent];
        for (const test of priorSimTests) {
            if (recentScores.length >= 5) break;
            if (recentScores.length < 5) {
                recentScores.push(test.score);
            }
        }

        let passProb = 0;

        if (priorSimTests.length < 5) {
            // Less than 5 simulations in history
            passProb = 40 + (currentScorePercent * 0.5);
        } else {
            // 5 or more tests
            const last4 = priorSimTests.slice(0, 4);
            let sumPercentages = currentScorePercent;
            last4.forEach((test: any) => sumPercentages += test.score);

            const avgPercentage = sumPercentages / 5;
            passProb = 40 + (avgPercentage * 0.5);
        }

        return Math.round(passProb);
    }, [completed, totalScore, questions.length, history]);

    async function fetchExamQuestions() {
        setLoading(true);

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Date.now() - parsed.timestamp < 7200000) { // 2 hours
                    setQuestions(parsed.questions);
                    setCurrentIndex(parsed.currentindex);
                    setAnswers(parsed.answers);
                    setElapsedTime(parsed.elapsedTime);
                    setLoading(false);
                    return;
                }
            } catch (e) { }
        }

        const [rules, signs] = await Promise.all([
            supabase.rpc('get_random_questions', { limit_count: 20, category_filter: 'Rules of the Road' }),
            supabase.rpc('get_random_questions', { limit_count: 20, category_filter: 'Road Signs' })
        ]);

        const rulesData = rules.data || [];
        const signsData = signs.data || [];

        setQuestions([...rulesData, ...signsData]);
        setLoading(false);
    }

    // Auth & Init
    useEffect(() => {
        if (authLoading) return; // Wait for profile array

        if (!user) {
            setShowLoginModal(true);
            setLoading(false);
        } else {
            setShowLoginModal(false);
            if (questions.length === 0 && !completed) {
                // Check permissions
                if (!isPremium) {
                    setLoading(false);
                    setLimitVariant('simulation_quiz');
                    setShowLimitModal(true);
                    return;
                }
                fetchExamQuestions();
            }
        }
    }, [user, isPremium, authLoading, questions.length, completed]);

    // Prevent save on exit
    const isExiting = useRef(false);

    // Save State
    useEffect(() => {
        if (isExiting.current) return; // Block save if exiting
        if (!loading && questions.length > 0 && !completed) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                timestamp: Date.now(),
                questions, currentindex, answers, elapsedTime
            }));
        } else if (completed) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [questions, currentindex, answers, elapsedTime, loading, completed]);

    // Stopwatch
    useEffect(() => {
        if (loading || completed || showLoginModal || !user) return;
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, completed, showLoginModal, user]);

    // Save Result Logic (Top-level Hook)
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (completed && user && !resultSaved && questions.length > 0) {
            setResultSaved(true);
            setIsSaving(true);

            // Calculate Score
            let rulesScore = 0, signsScore = 0, rulesTotal = 0, signsTotal = 0;
            questions.forEach((q, idx) => {
                const ans = answers[idx];
                const isCor = ans ? ans.correct : false;
                if (q.category === 'Rules of the Road') {
                    rulesTotal++;
                    if (isCor) rulesScore++;
                } else {
                    signsTotal++;
                    if (isCor) signsScore++;
                }
            });

            const passedRules = rulesScore >= 16;
            const passedSigns = signsScore >= 16;
            const passedOverall = passedRules && passedSigns;
            const totalScore = Math.round(((rulesScore + signsScore) / (rulesTotal + signsTotal)) * 100);

            const save = async () => {
                await supabase.from('simulation_results').insert({
                    user_id: user.id,
                    score: totalScore,
                    rules_score: rulesScore,
                    signs_score: signsScore,
                    passed: passedOverall,
                    test_type: 'Simulation'
                });

                try {
                    fetch('/api/activity', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventData: [
                                new Date().toISOString(),
                                user.email || 'unknown_email',
                                user.user_metadata?.first_name || 'unknown_name',
                                `Simulation Completed - Score: ${totalScore}%`
                            ]
                        })
                    });
                } catch (sheetError) {
                    console.error("Failed to append activity to sheet", sheetError);
                }

                // Consume credit (Implicit via insert)
                if (!isPremium) {
                    await refreshProfile(true);
                }
                setIsSaving(false);
            };
            save();
        }
    }, [completed, user, resultSaved, questions, answers, isPremium, refreshProfile]);


    const handleAnswer = (isCorrect: boolean, selectedIndex: number) => {
        setAnswers(prev => ({
            ...prev,
            [currentindex]: { correct: isCorrect, selected: selectedIndex }
        }));
    };

    const handleNext = () => {
        // Navigation Logic

        // Find next unanswered question
        let nextIndex = -1;

        // 1. Look ahead
        for (let i = currentindex + 1; i < questions.length; i++) {
            if (!answers[i]) {
                nextIndex = i;
                break;
            }
        }

        // 2. If none ahead, look from start
        if (nextIndex === -1) {
            for (let i = 0; i < currentindex; i++) {
                if (!answers[i]) {
                    nextIndex = i;
                    break;
                }
            }
        }

        if (nextIndex !== -1) {
            setCurrentIndex(nextIndex);
        } else {
            // No unanswered questions found. 
            // Check strictly if ALL are answered
            if (Object.keys(answers).length === questions.length) {
                // If on last question, Finsh.
                if (currentindex === questions.length - 1) {
                    setCompleted(true);
                } else {
                    // Navigate to last question to show Finish button
                    setCurrentIndex(questions.length - 1);
                }
            } else {
                alert("Please answer all questions.");
            }
        }
    };

    const handleExitClick = () => {
        setShowExitModal(true);
    };

    const confirmExit = () => {
        isExiting.current = true; // Set flag
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = '/study';
    };

    const handleRetake = () => {
        if (isPremium) {
            localStorage.removeItem(STORAGE_KEY);
            setQuestions([]);
            setCurrentIndex(0);
            setAnswers({});
            setElapsedTime(0);
            setCompleted(false);
            setShowReview(false);
            setResultSaved(false);
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
                message="You have no simulation credits remaining. Please upgrade to Premium."
                variant={limitVariant}
                renewalDate={renewalDate}
            />
        </DashboardLayout>
    );

    if (loading) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem', color: '#64748b' }}>Preparing Exam...</div>
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

    if (questions.length === 0) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem', color: '#dc2626' }}>Error loading questions.</div>
            </div>
        </DashboardLayout>
    );

    if (completed) {
        // Recalculate for Display
        let rulesScore = 0, signsScore = 0, rulesTotal = 0, signsTotal = 0;
        questions.forEach((q, idx) => {
            const ans = answers[idx];
            const isCor = ans ? ans.correct : false;
            if (q.category === 'Rules of the Road') {
                rulesTotal++;
                if (isCor) rulesScore++;
            } else {
                signsTotal++;
                if (isCor) signsScore++;
            }
        });
        const passedRules = rulesScore >= 16;
        const passedSigns = signsScore >= 16;
        const passedOverall = passedRules && passedSigns;
        const combinedScore = rulesScore + signsScore;
        const combinedTotal = rulesTotal + signsTotal;

        return (
            <DashboardLayout>
                <div className={styles.mainWrapper}>
                    <div className={styles.resultsContainer}>
                        <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500, marginBottom: '1.5rem' }}>
                            Score
                        </div>
                        <div style={{ fontSize: '5rem', fontWeight: 800, color: '#e1ff21', WebkitTextStroke: '2.5px black', lineHeight: 1 }}>
                            {combinedScore}/{combinedTotal}
                        </div>
                        <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500, marginTop: '1.5rem' }}>
                            Pass Probability: <span style={{ color: '#0f172a', fontWeight: 700 }}>{passProbability}%</span>
                        </div>

                        <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', margin: '2.5rem 0' }}>
                            {motivationQuote}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
                            <button
                                onClick={handleRetake}
                                disabled={isSaving}
                                style={{
                                    width: '100%',
                                    background: isSaving ? '#94a3b8' : '#0f172a', color: 'white', padding: '1rem',
                                    borderRadius: '8px', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem'
                                }}
                            >
                                {isSaving ? 'Processing...' : 'Take Another Simulation'}
                            </button>
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
                            {questions.map((q, idx) => {
                                const ans = answers[idx] || { correct: false, selected: -1 };
                                return (
                                    <div key={idx} className={styles.reviewCard} style={{ borderLeft: `4px solid ${ans.correct ? '#22c55e' : '#ef4444'}`, marginBottom: '1rem', padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ marginBottom: '1rem' }}>{idx + 1}. {q.text}</h3>
                                        {q.media_url && <img src={q.media_url} style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }} />}

                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            {q.options.map((opt: string, optIdx: number) => {
                                                let color = 'inherit';
                                                let weight = 'normal';
                                                if (optIdx === q.correct_index) { color = '#15803d'; weight = '700'; }
                                                else if (optIdx === ans.selected && !ans.correct) { color = '#b91c1c'; }

                                                return (
                                                    <div key={optIdx} style={{ color, fontWeight: weight }}>
                                                        {optIdx === ans.selected && (ans.correct ? '✅ ' : '❌ ')}
                                                        {opt} {optIdx === q.correct_index && optIdx !== ans.selected && '(Correct Answer)'}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
                <LimitModal
                    isOpen={showLimitModal}
                    onClose={() => setShowLimitModal(false)}
                    message="You have no simulation credits remaining. Please upgrade to Premium."
                    variant={limitVariant}
                    renewalDate={renewalDate}
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout fullWidth={true} hideTopBar={true}>
            <div className={styles.mainWrapper}>
                <div className={styles.header}>
                    <div className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        Simulation
                        <span className={styles.timer} style={{ fontSize: '1rem', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                            {formatTime(elapsedTime)}
                        </span>
                    </div>

                    <button className={styles.exitBtn} onClick={handleExitClick}>Exit Simulation</button>
                </div>

                <div className={styles.contentGrid} style={{ gridTemplateColumns: 'minmax(0, 1000px)', justifyContent: 'center' }}>
                    {/* Left Column: Question */}
                    <div>
                        <QuestionCard
                            question={questions[currentindex]}
                            onNext={handleNext}
                            isLast={currentindex === questions.length - 1}
                            mode="simulation"
                            selected={answers[currentindex]?.selected}
                            onAnswer={handleAnswer}
                            progressLabel={`Question ${currentindex + 1} / ${questions.length}`}
                        />
                    </div>

                    {/* Navigator - Restored below QuestionCard */}
                    <div className={styles.navigatorCard} style={{ marginTop: '2rem', position: 'static', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ color: '#475569', margin: 0 }}>Navigator</h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '0.5rem' }}>
                            {questions.map((_, idx) => {
                                const isAnswered = answers[idx] !== undefined;
                                const isCurrent = idx === currentindex;

                                let bg = '#f1f5f9';
                                let color = '#64748b';
                                let border = '1px solid #e2e8f0';

                                if (isCurrent) {
                                    bg = '#0f172a';
                                    color = 'white';
                                    border = '1px solid #0f172a';
                                } else if (isAnswered) {
                                    bg = '#e1ff21';
                                    color = 'black';
                                    border = '1px solid #d4f010';
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '4px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            background: bg,
                                            color: color,
                                            border: border,
                                            aspectRatio: '1'
                                        }}
                                    >
                                        {idx + 1}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            <ExitModal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirm={confirmExit}
            />
        </DashboardLayout>

    );
}

export default function SimulationQuiz() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SimulationContent />
        </Suspense>
    );
}
