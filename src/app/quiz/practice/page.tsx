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

function QuizContent() {
    const { user, isPremium, practiceCredits, refreshProfile, renewalDate, loading: authLoading, history } = useAuth();
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

    // Compute pass probability
    const passProbability = useMemo(() => {
        if (!completed || questions.length === 0) return 0;

        // Find prior practice tests in history
        const priorPracticeTests = (history || []).filter((h: any) => h.test_type !== 'Simulation');

        // Does this current score exist in the history yet? 
        // Since history fetch might not have caught up with the just-saved result, 
        // we'll manually prepend the current score to be safe when evaluating the last 5.
        // We know the current test score is: Math.round((score / questions.length) * 100)
        const currentScorePercent = (score / questions.length) * 100;

        // Compile the recent scores (up to 5)
        const recentScores = [currentScorePercent];
        for (const test of priorPracticeTests) {
            if (recentScores.length >= 5) break;
            // Check if this test in history is the *exact* one we just saved to avoid double counting
            // We can approximate this by skipping if it was created in the last 10 seconds, 
            // but the safest way is if the component just mounted, we know `resultSaved` state.
            // For simplicity and to avoid race conditions, we'll just take the top 4 from history to make 5 total.
            if (recentScores.length < 5) {
                recentScores.push(test.score);
            }
        }

        let baseProb = 40;
        let finalProb = 0;

        if (recentScores.length < 5) {
            // If < 5 tests: 40% + (current_test_score_percentage * 0.05)
            // Wait, the user req said: pass_probability = 40% + (test score × 5%)
            // Assuming "test score x 5%" means if they got 80%, it's 80 * 0.05 = 4
            // Let's use the exact formula: currentScorePercent * 0.05
            finalProb = baseProb + (currentScorePercent * 0.05); // Wait, "test score * 5%". If score is 80%, 80 * 0.05 = 4%.  40 + 4 = 44%.
            // Wait, maybe they meant "score * 5%" where score is out of 100?
            // "If user has less than 5 practice tests: pass_probability = 40% + (test score × 5%)"
            // Let's assume `test score` is the percentage (0-100).
            // Example: Score = 80%. 40 + (80 * 0.05) = 40 + 4. Wait, 44% seems low for an 80% score.
            // Wait! "test score * 5%" -> if score is 10/10 (10), 10 * 5% = 50%. 40 + 50 = 90%. 
            // Ah! "test score" is the RAW SCORE! Out of 10 for practice, out of 40 for sim!
            // Wait, for Simulation, there are 40 questions. 40 * 5% = 200%. That's wrong.
            // Let's look at the second formula: "average_score = total_correct / total_questions of last 5 tests. pass_probability = 40% + (average_score × 50%)"
            // `average_score` is a decimal (e.g. 0.8). 0.8 * 50 = 40. 40 + 40 = 80%. This makes perfect sense!
            // So for < 5 tests: test score must be the PERCENTAGE (0-100) * 0.50 ? No, user specifically wrote `test score x 5%`.
            // Let's just calculate `average_score * 50` for BOTH, or `score / total * 50` for the first.
            // Wait! The user wrote `40% + (test score * 5%)`. If `test score` is 10 (raw score), 10 * 5 = 50. 40 + 50 = 90%.
            // OK, so for Practice Tests (< 5): test score is raw score (0-10). `40 + (raw_score * 5)`.
            // For > 5 tests: `total_correct / total_questions` of last 5. This is a decimal (0-1). `0-1 * 50` is max 50. Wait, `40% + (average_score * 50)` -> wait, 0.8 * 50 = 40. 40 + 40 = 80%. Wait, what if they get 100%? 1.0 * 50 = 50%. 40 + 50 = 90%. 
            // Let's use `average_percentage` as a 0-100 value.
            // Formula 1: 40 + (raw_score * 5)
        }

        // Let's calculate total correct and total questions for the last 5 tests.
        // Wait, the DB `simulation_results` stores `score` as a PERCENTAGE (0-100), not raw score!
        // We know this from payload: `score: Math.round((score / questions.length) * 100)`
        // If the DB only has percentage, we can't easily get raw score unless we assume 10 Qs for practice.
        // Let's normalize everything to percentages to be safe and accurate.
        // If percentage is 0-100:
        // User formula 1: 40 + (percentage * 0.5)  -> if 100%, 40 + 50 = 90%
        // User formula 2: 40 + (average_percentage * 0.5) -> if 100%, 40 + 50 = 90%
        // Yes, both formulas are mathematically identical if evaluated as percentages multiplied by 0.5!

        let passProb = 0;

        if (priorPracticeTests.length < 5) {
            // Less than 5 total practice tests in history (including this one, so < 4 in DB + current)
            const percentage = (score / questions.length) * 100;
            passProb = 40 + (percentage * 0.5);
        } else {
            // 5 or more tests
            // we need the average of the last 5 tests (including the current one)
            // So we take current + last 4 from history.
            const last4 = priorPracticeTests.slice(0, 4);
            let sumPercentages = currentScorePercent;
            last4.forEach((test: any) => sumPercentages += test.score); // test.score is a percentage 0-100 in DB

            const avgPercentage = sumPercentages / 5;
            passProb = 40 + (avgPercentage * 0.5);
        }

        return Math.round(passProb);
    }, [completed, score, questions.length, history]);

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
                    passed: score >= 16,
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
        return (
            <DashboardLayout>
                <div className={styles.mainWrapper}>
                    <div className={styles.resultsContainer}>
                        <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500, marginBottom: '1.5rem' }}>
                            Score
                        </div>
                        <div style={{ fontSize: '5rem', fontWeight: 800, color: '#e1ff21', WebkitTextStroke: '2.5px black', lineHeight: 1 }}>
                            {score}/{questions.length}
                        </div>
                        <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500, marginTop: '1.5rem' }}>
                            Pass Probability: <span style={{ color: '#0f172a', fontWeight: 700 }}>{passProbability}%</span>
                        </div>

                        <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', margin: '2.5rem 0' }}>
                            {motivationQuote}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
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
                                    const nextCategory = category === 'Rules of the Road' ? 'Road Signs' : 'Rules of the Road';
                                    handleRetake(nextCategory);
                                }}
                                disabled={isSaving}
                                style={{
                                    width: '100%',
                                    background: 'white', color: isSaving ? '#cbd5e1' : '#0f172a', padding: '1rem',
                                    borderRadius: '8px', border: '1px solid #e2e8f0', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem'
                                }}
                            >
                                Take {category === 'Rules of the Road' ? 'Road Signs' : 'Rules of the Road'} Test
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
