"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import Sidebar from '@/components/Sidebar';
import styles from '../shared_quiz_layout.module.css';
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import ExitModal from '@/components/ExitModal';

function ChapterQuizContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const chapter = searchParams.get('chapter');

    const [questions, setQuestions] = useState([]);
    const [currentindex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    // ... (existing effects and fetchQuestions)

    // Auth Gate
    useEffect(() => {
        if (!user) {
            setShowLoginModal(true);
            setLoading(false);
        } else {
            setShowLoginModal(false);
            if (questions.length === 0) fetchQuestions();
        }
    }, [user]);

    async function fetchQuestions() {
        if (!chapter) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('chapter', chapter);

        if (error) console.error(error);
        else setQuestions(data || []);

        setLoading(false);
    }

    const handleNext = () => {
        if (currentindex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCompleted(true);
        }
    };

    const handleExitClick = () => {
        setShowExitModal(true);
    };

    const confirmExit = () => {
        window.location.href = '/chapter';
    };

    if (loading) return (
        <div className={styles.quizLayout}>
            <Sidebar />
            <div className={styles.mainWrapper}>
                <div style={{ padding: '3rem', color: '#64748b' }}>Loading questions...</div>
            </div>
        </div>
    );

    if (!user) {
        return (
            <div className={styles.quizLayout}>
                <Sidebar />
                <div className={styles.mainWrapper}>
                    <LoginModal isOpen={true} />
                </div>
            </div>
        )
    }

    if (!chapter) return (
        <div className={styles.quizLayout}>
            <Sidebar />
            <div className={styles.mainWrapper}>
                <div style={{ padding: '3rem', color: '#64748b' }}>No chapter selected.</div>
            </div>
        </div>
    );

    if (questions.length === 0) return (
        <div className={styles.quizLayout}>
            <Sidebar />
            <div className={styles.mainWrapper}>
                <div style={{ padding: '3rem', color: '#64748b' }}>No questions found for this chapter.</div>
            </div>
        </div>
    );

    if (completed) {
        return (
            <div className={styles.quizLayout}>
                <Sidebar />
                <div className={styles.mainWrapper}>
                    <div className={styles.resultsContainer}>
                        <h1>Chapter Complete!</h1>
                        <p style={{ marginTop: '1rem', marginBottom: '2rem', color: '#64748b' }}>
                            You have reviewed all {questions.length} questions in <strong>{chapter}</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className={styles.resultPrimaryBtn} onClick={() => window.location.reload()}>
                                Review Again
                            </button>
                            <button className={styles.secondaryBtn} onClick={() => window.location.href = '/chapter'}>
                                Choose Another Chapter
                            </button>
                        </div>
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
                        {chapter}
                    </div>
                    <div className={styles.stats}>
                        <span>Question {currentindex + 1} / {questions.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={styles.exitBtn} onClick={handleExitClick}>Exit</button>
                    </div>
                </div>

                <div className={styles.contentGrid} style={{ gridTemplateColumns: 'minmax(0, 1000px)', justifyContent: 'center' }}>
                    <div>
                        <QuestionCard
                            question={questions[currentindex]}
                            onNext={handleNext}
                            isLast={currentindex === questions.length - 1}
                            mode="practice"
                        />
                    </div>
                </div>
            </div>
            <LoginModal isOpen={showLoginModal} />
            <ExitModal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirm={confirmExit}
            />
        </div>
    );
}

export default function ChapterQuiz() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChapterQuizContent />
        </Suspense>
    );
}
