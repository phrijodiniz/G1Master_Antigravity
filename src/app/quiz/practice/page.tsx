"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import styles from '../shared_quiz_layout.module.css';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import ExitModal from '@/components/ExitModal';

function QuizContent() {
    const { user, isPremium, practiceCredits, refreshProfile } = useAuth();
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

    const STORAGE_KEY = `practice_session_${category}`;

    // Auth & Init
    useEffect(() => {
        if (!user) {
            setShowLoginModal(true);
            setLoading(false);
        } else {
            setShowLoginModal(false);
            if (questions.length === 0 && !completed) {
                fetchQuestions();
            }
        }
    }, [user, category]);

    async function fetchQuestions() {
        if (!category) return;
        setLoading(true);

        // Check credits
        if (!isPremium && practiceCredits <= 0) {
            alert("You have no practice credits remaining. Please upgrade to Premium.");
            window.location.href = '/dashboard';
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
            limit_count: 20,
            category_filter: category
        });
        if (error || !data) {
            const { data: fallback } = await supabase.from('questions').select('*').eq('category', category).limit(20);
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
    useEffect(() => {
        if (completed && user && !resultSaved && questions.length > 0) {
            setResultSaved(true); // Prevent double save
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

                    // Consume Credit (Implicit)
                    if (!isPremium) {
                        refreshProfile();
                    }
                }
            };
            saveToDB();
        }
    }, [completed, user, category, score, questions.length, isPremium, practiceCredits, refreshProfile]);

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

    // --- Renders ---

    if (loading) return (
        <div className={styles.quizLayout}>
            <Sidebar />
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem', color: '#64748b' }}>Loading questions...</div>
            </div>
        </div>
    );

    if (!user) return (
        <div className={styles.quizLayout}>
            <Sidebar />
            <div className={styles.contentWrapper}>
                <LoginModal isOpen={true} onClose={() => setShowLoginModal(false)} />
            </div>
        </div>
    );

    if (error || (questions.length === 0)) return (
        <div className={styles.quizLayout}>
            <Sidebar />
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem' }}>No questions found for {category}.</div>
            </div>
        </div>
    );

    if (completed) {
        // Results
        return (
            <div className={styles.quizLayout}>
                <Sidebar />
                <div className={styles.mainWrapper}>
                    <div className={styles.resultsContainer}>
                        <h1>Practice Complete</h1>
                        <div className={styles.scoreLarge} style={{ color: score >= 16 ? '#16a34a' : '#dc2626' }}>
                            {score} / {questions.length}
                        </div>

                        {/* Save Trigger */}
                        {/* Results displayed below */}

                        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                            {score >= 16 ? 'Great job! You passed.' : 'Keep practicing! Minimum 16 to pass.'}
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    background: '#0f172a', color: 'white', padding: '0.8rem 1.5rem',
                                    borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/practice'}
                                style={{
                                    background: 'white', color: '#0f172a', padding: '0.8rem 1.5rem',
                                    borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                Back to Menu
                            </button>
                        </div>
                    </div>

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
                </div>
            </div>
        );
    }

    return (
        <div className={styles.quizLayout}>
            <Sidebar />
            <div className={styles.mainWrapper}>
                <div className={styles.header}>
                    <div className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {category}
                    </div>
                    <div className={styles.stats}>
                        <span>Question {currentindex + 1} / {questions.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        </div>
    );
}

export default function PracticeQuiz() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <QuizContent />
        </Suspense>
    );
}
