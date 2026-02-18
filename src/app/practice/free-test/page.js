"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QuestionCard from '@/components/QuestionCard';
import UnlockModal from '@/components/UnlockModal';
import LoginModal from '@/components/LoginModal';
import ExitModal from '@/components/ExitModal';
import styles from '@/app/quiz/shared_quiz_layout.module.css'; // Reuse existing quiz styles
import landingStyles from '../../page.module.css'; // Reuse landing page styles for nav
import questionsData from '@/lib/freeTestQuestions.json';
import { sendGTMEvent } from '@/lib/gtm';

export default function FreeTestPage() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
    const [isCompleted, setIsCompleted] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    const currentQuestion = questionsData[currentIndex];
    const totalQuestions = questionsData.length;

    // Track Test Start
    useState(() => {
        sendGTMEvent('free_test_start');
    }, []);

    const handleNext = (correct, selectedOption) => {
        // Evaluate immediately although we don't show it
        const isCorrect = questionsData[currentIndex].correct_index === selectedOption;

        setAnswers(prev => ({
            ...prev,
            [currentIndex]: {
                selected: selectedOption,
                isCorrect,
                questionId: currentQuestion.id,
                category: currentQuestion.category
            }
        }));

        if (currentIndex < totalQuestions - 1) {
            sendGTMEvent('free_test_step', { step: currentIndex + 1, total: totalQuestions });
            setCurrentIndex(prev => prev + 1);
        } else {
            // Calculate final results for the event
            let correctCount = 0;
            // Re-calculate basic score since state update might lag or be complex to access synchronously here without refactor
            // Using current answers + the one just selected
            const allAnswers = { ...answers, [currentIndex]: { isCorrect } };
            Object.values(allAnswers).forEach(ans => {
                if (ans.isCorrect) correctCount++;
            });
            const score = Math.round((correctCount / totalQuestions) * 100);
            const passed = correctCount >= 8;

            sendGTMEvent('free_test_complete', { score, passed });
            setIsCompleted(true);
        }
    };

    // Calculate score for persistence (but don't show it)
    const calculateResults = () => {
        let correctCount = 0;
        let rulesScore = 0;
        let signsScore = 0;

        Object.values(answers).forEach(ans => {
            if (ans.isCorrect) {
                correctCount++;
                if (ans.category === 'Road Signs') signsScore++;
                if (ans.category === 'Rules of the Road') rulesScore++;
            }
        });

        return {
            score: Math.round((correctCount / totalQuestions) * 100),
            rules_score: rulesScore,
            signs_score: signsScore,
            total_questions: totalQuestions,
            passed: correctCount >= 8, // 80% pass
            answers: answers
        };
    };

    const handleExitCancel = () => {
        setShowExitModal(false);
    };

    const handleExitConfirm = () => {
        sendGTMEvent('free_test_abandon', { step: currentIndex + 1 });
        router.push('/');
    };

    return (
        <div className={styles.container} style={{ minHeight: '100vh', padding: '0', background: '#f8fafc' }}>
            {/* Nav Header - Reused from Landing Page */}
            <nav className={landingStyles.nav} style={{ position: 'sticky', top: 0 }}>
                <div>
                    <Link href="/">
                        <Image
                            src="/logo-new.png"
                            alt="G1 Master Logo"
                            width={225}
                            height={63}
                            className={landingStyles.navLogoImage}
                            priority
                        />
                    </Link>
                </div>
                <div className={landingStyles.navButtons}>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className={landingStyles.navLoginBtn}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className={landingStyles.navCtaBtn}
                    >
                        Start FREE
                    </button>
                </div>
            </nav>

            <div style={{ padding: '2rem 1rem' }}>
                {/* Header / Progress - visible above fold */}
                <div style={{ maxWidth: '800px', margin: '0 auto 2rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 600, color: '#64748b' }}>Free Practice Test</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>Question {currentIndex + 1} of {totalQuestions}</span>
                        <button
                            onClick={() => setShowExitModal(true)}
                            style={{
                                background: 'transparent',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '0.25rem 0.75rem',
                                color: '#64748b',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Exit
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ maxWidth: '800px', margin: '0 auto 2rem auto', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                        height: '100%',
                        background: '#000000',
                        transition: 'width 0.3s ease'
                    }}></div>
                </div>

                {/* Question Card */}
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <QuestionCard
                        question={currentQuestion}
                        mode="freetest"
                        onNext={handleNext}
                        isLast={currentIndex === totalQuestions - 1}
                        selected={answers[currentIndex]?.selected}
                    />
                </div>
            </div>

            {/* Login Modal */}
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

            {/* Unlock Dialog */}
            <UnlockModal
                isOpen={isCompleted}
                results={isCompleted ? calculateResults() : null}
            />

            {/* Exit Modal */}
            <ExitModal
                isOpen={showExitModal}
                onClose={handleExitCancel}
                onConfirm={handleExitConfirm}
            />
        </div>
    );
}
