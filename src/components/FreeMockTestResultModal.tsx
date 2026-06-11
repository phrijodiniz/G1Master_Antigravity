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

    const handlePracticeClick = (category: string) => {
        onClose();
        router.push(`/quiz/practice?category=${encodeURIComponent(category)}`);
    };

    // Dynamic Recommendation & CTAs
    const recommendedCategory = rulesScore < signsScore ? 'Rules of the Road' : 'Road Signs';
    const secondaryCategory = recommendedCategory === 'Rules of the Road' ? 'Road Signs' : 'Rules of the Road';

    // Smart Suggestion Logic
    let suggestionText = "";
    if (rulesScore < totalRules && rulesScore < signsScore) {
        suggestionText = "You should focus on Rules of the Road next. Try a targeted practice test to improve your score. Click the button below to start immediately.";
    } else if (signsScore < totalSigns && signsScore < rulesScore) {
        suggestionText = "You should focus on Road Signs next. Try a targeted practice test to improve your score. Click the button below to start immediately.";
    } else {
        suggestionText = "Both sections need steady practice. Click the recommended test below to build confidence and guarantee a first-time pass.";
    }

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

                {/* Step Tracker */}
                <div className={styles.stepTracker}>
                    <span className={styles.stepDone}>Step 1: Diagnostic Completed ✓</span>
                    <span className={styles.stepDivider}>→</span>
                    <span className={styles.stepPending}>Step 2: Start Practice Test</span>
                </div>

                {/* Status and Score Badges */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    {/* Status Indicator */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.2rem', borderRadius: '30px', background: passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: passed ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: passed ? '#22c55e' : '#ef4444' }}></span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: passed ? '#22c55e' : '#ef4444' }}>
                            {passed ? 'Passed' : 'Failed'}
                        </span>
                    </div>

                    {/* Score Indicator */}
                    <div className={styles.scoreBadge}>
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

                    {/* Smart suggestion bubble */}
                    <div className={styles.suggestionBubble}>
                        <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>💡</span>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                            <strong>Recommendation:</strong> {suggestionText}
                        </p>
                    </div>

                    {/* CTAs Stack */}
                    <div className={styles.ctaWrapper}>
                        <button 
                            onClick={() => handlePracticeClick(recommendedCategory)} 
                            className={styles.primaryPulseBtn}
                        >
                            ⚡ Start Recommended: {recommendedCategory} {!isPremium ? '(Free)' : ''}
                        </button>
                        <button 
                            onClick={() => handlePracticeClick(secondaryCategory)} 
                            className={styles.secondaryGhostBtn}
                        >
                            Or, Practice {secondaryCategory} {!isPremium ? '(Free)' : ''}
                        </button>
                    </div>

                    <button 
                        onClick={onClose} 
                        className={styles.dashboardTextLink}
                    >
                        I'll explore the dashboard first
                    </button>
                </div>
            </div>
        </div>
    );
}
