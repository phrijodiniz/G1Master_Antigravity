"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './FreeMockTestResultModal.module.css';

interface FreeMockTestResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    results: {
        score: number;
        total_questions?: number;
        passed: boolean;
        answers?: any;
        rules_score?: number;
        signs_score?: number;
    } | null;
}

export default function FreeMockTestResultModal({ isOpen, results, onClose }: FreeMockTestResultModalProps) {
    const router = useRouter();
    const { isPremium } = useAuth();

    if (!isOpen || !results) return null;

    const { score, passed } = results;
    const tq = results.total_questions || 10;
    const correctAnswers = Math.round((score / 100) * tq);

    const rulesScore = results.rules_score ?? 0;
    const signsScore = results.signs_score ?? 0;

    let totalRules = 5;
    let totalSigns = 5;

    if (results.answers) {
        const answersList = Object.values(results.answers);
        const rulesQuestions = answersList.filter((a: any) => a.category === 'Rules of the Road').length;
        const signsQuestions = answersList.filter((a: any) => a.category === 'Road Signs').length;
        if (rulesQuestions > 0) totalRules = rulesQuestions;
        if (signsQuestions > 0) totalSigns = signsQuestions;
    }

    const rulesPercentage = Math.round((rulesScore / totalRules) * 100);
    const signsPercentage = Math.round((signsScore / totalSigns) * 100);

    const handleContinueToDashboard = () => {
        onClose();
        router.push('/dashboard');
    };

    return (
        <div className={styles.container}>
            <div className={styles.gradientBg}></div>
            
            <div className={styles.content}>
                {/* Close Button top-right */}
                <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">×</button>

                {/* Result Title */}
                <h2 className={styles.title} style={{ fontSize: '2rem', marginBottom: '1.2rem', fontWeight: 800 }}>
                    G1 Test Diagnostic
                </h2>

                {/* Status and Score Display */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    {/* Highlighted Status */}
                    <div style={{ 
                        fontSize: '1.6rem', 
                        fontWeight: 800, 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px', 
                        color: passed ? '#22c55e' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                    }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: passed ? '#22c55e' : '#ef4444' }}></span>
                        {passed ? 'Passed' : 'Failed'}
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: passed ? '#22c55e' : '#ef4444' }}></span>
                    </div>

                    {/* Secondary Score Display */}
                    <div style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: 600 }}>
                        Score: {correctAnswers}/{tq}
                    </div>
                </div>

                <div className={styles.diagnosticBox}>
                    <p className={styles.diagnosticMessage}>
                        {passed ? (
                            <><strong>Great job!</strong> You passed this practice test. However, the official Ontario G1 exam requires scoring at least 80% on both sections separately to pass. Keep practicing to make sure you pass on your first try!</>
                        ) : (
                            <><strong>You wouldn't pass the real G1 today.</strong> Avoid the $16 retake fee and weeks of waiting—keep practicing now</>
                        )}
                    </p>

                    {/* Dynamic suggestion and CTAs based on premium status */}
                    {isPremium ? (
                        <>
                            {/* Supporting subline */}
                            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', textAlign: 'center' }}>
                                You’ve finished your diagnostic. Choose any of the 4 unlocked study modes on your dashboard to start prepping.
                            </p>

                            {/* CTAs Stack */}
                            <div className={styles.ctaWrapper}>
                                <button 
                                    onClick={handleContinueToDashboard} 
                                    className={styles.primaryPulseBtn}
                                >
                                    Go to Study Dashboard
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Supporting subline */}
                            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6', textAlign: 'center' }}>
                                You’ve finished your diagnostic. Now choose from 4 smart preps: Practice, Mastery Map, Chapters, or Simulations.
                            </p>

                            {/* CTAs Stack */}
                            <div className={styles.ctaWrapper}>
                                <button 
                                    onClick={handleContinueToDashboard} 
                                    className={styles.primaryPulseBtn}
                                >
                                    Go to Study Dashboard
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
