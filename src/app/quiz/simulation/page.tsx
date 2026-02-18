"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
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
    const { user, isPremium, simulationCredits, refreshProfile, renewalDate } = useAuth();
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

    const STORAGE_KEY = 'simulation_session';

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
        if (!user) {
            setShowLoginModal(true);
            setLoading(false);
        } else {
            setShowLoginModal(false);
            if (questions.length === 0 && !completed) {
                // Check credits
                // Check credits
                if (!isPremium && (simulationCredits ?? 0) <= 0) {
                    setLoading(false);
                    setShowLimitModal(true);
                    return;
                }
                fetchExamQuestions();
            }
        }
    }, [user, isPremium, simulationCredits]);

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
    useEffect(() => {
        if (completed && user && !resultSaved && questions.length > 0) {
            setResultSaved(true);

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

                // Consume credit (Implicit via insert)
                if (!isPremium) {
                    refreshProfile();
                }
            };
            save();
        }
    }, [completed, user, resultSaved, questions, answers, isPremium, simulationCredits, refreshProfile]);


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

    // --- Renders ---

    if (showLimitModal) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem', color: '#64748b' }}>Checking eligibility...</div>
            </div>
            <LimitModal
                isOpen={true}
                onClose={() => setShowLimitModal(false)}
                message="You have no simulation credits remaining. Please upgrade to Premium."
                variant='simulation_limit'
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

        return (
            <DashboardLayout>
                <div className={styles.mainWrapper}>
                    <div className={styles.resultsContainer}>
                        <h1>Simulation Results</h1>
                        <p style={{ marginTop: '1rem', color: '#64748b' }}>Finished in {formatTime(elapsedTime)}</p>

                        <div style={{ margin: '2rem 0', display: 'flex', gap: '3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: '#475569' }}>Rules of the Road</h3>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: passedRules ? '#16a34a' : '#dc2626' }}>
                                    {rulesScore} / {rulesTotal}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: '#475569' }}>Road Signs</h3>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: passedSigns ? '#16a34a' : '#dc2626' }}>
                                    {signsScore} / {signsTotal}
                                </div>
                            </div>
                        </div>

                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: passedOverall ? '#16a34a' : '#dc2626', marginBottom: '1rem' }}>
                            {passedOverall ? 'PASSED' : 'FAILED'}
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Minimum 16/20 required in EACH section.</p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => window.location.reload()} className={styles.resultPrimaryBtn}>
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/study'}
                                className={styles.secondaryBtn}
                            >
                                Back to Menu
                            </button>
                        </div>
                    </div>
                </div>
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
