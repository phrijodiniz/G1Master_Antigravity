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

    // Smart Suggestion Logic
    let suggestionText = "";
    if (rulesScore < totalRules && rulesScore < signsScore) {
        suggestionText = "You should focus on Rules of the Road next. Try a targeted practice test to improve your score.";
    } else if (signsScore < totalSigns && signsScore < rulesScore) {
        suggestionText = "You should focus on Road Signs next. Try a targeted practice test to improve your score.";
    } else {
        suggestionText = "Both sections need steady practice. Keep taking tests to build confidence and reach a 100% pass guarantee.";
    }

    return (
        <div className={styles.container}>
            <div className={styles.gradientBg}></div>
            
            <div className={styles.content}>
                {/* Result Title */}
                <h2 className={styles.title} style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                    G1 Test Diagnostic
                </h2>
                
                <p className={styles.subtitle} style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>
                    Here is the breakdown of your first practice test.
                </p>

                {/* Status Indicator */}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.6rem 1.2rem', borderRadius: '30px', background: passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: passed ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)', marginBottom: '2rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: passed ? '#22c55e' : '#ef4444' }}></span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: passed ? '#22c55e' : '#ef4444' }}>
                        {passed ? 'Passed Standard' : 'Failed Standard'}
                    </span>
                </div>

                <div className={styles.diagnosticBox}>
                    <p style={{ color: '#e2e8f0', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        {passed ? (
                            <><strong>Great job!</strong> You passed this practice test. However, the official Ontario G1 exam requires scoring at least 80% on both sections separately to pass. Keep practicing to make sure you pass on your first try!</>
                        ) : (
                            <><strong>Test Result: Fail.</strong> You did not reach the passing standard today. The official G1 test requires scoring at least 80% in both Rules of the Road and Road Signs separately.</>
                        )}
                    </p>

                    {/* Section Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                        {/* Rules card */}
                        <div className={styles.scoreCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600, color: 'white' }}>Rules of the Road</span>
                                <span style={{ fontWeight: 700, color: '#e1ff21' }}>{rulesScore}/{totalRules} correct</span>
                            </div>
                            <div className={styles.progressTrack}>
                                <div className={styles.progressBar} style={{ width: `${rulesPercentage}%` }} />
                            </div>
                        </div>

                        {/* Signs card */}
                        <div className={styles.scoreCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600, color: 'white' }}>Road Signs</span>
                                <span style={{ fontWeight: 700, color: '#e1ff21' }}>{signsScore}/{totalSigns} correct</span>
                            </div>
                            <div className={styles.progressTrack}>
                                <div className={styles.progressBar} style={{ width: `${signsPercentage}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Smart suggestion bubble */}
                    <div style={{ display: 'flex', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>💡</span>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                            <strong>Recommendation:</strong> {suggestionText}
                        </p>
                    </div>

                    {/* CTAs */}
                    <p style={{ marginBottom: '1rem', fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>Select a category to practice next:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
                        <button 
                            onClick={() => handlePracticeClick('Rules of the Road')} 
                            className={styles.upgradeBtn} 
                            style={{ flex: 1, minWidth: '200px', margin: 0, padding: '0.9rem', fontSize: '0.95rem', borderRadius: '8px', boxShadow: 'none' }}
                        >
                            Practice Rules of the Road {!isPremium ? '(Free)' : ''}
                        </button>
                        <button 
                            onClick={() => handlePracticeClick('Road Signs')} 
                            className={styles.upgradeBtn} 
                            style={{ flex: 1, minWidth: '200px', margin: 0, padding: '0.9rem', fontSize: '0.95rem', borderRadius: '8px', boxShadow: 'none' }}
                        >
                            Practice Road Signs {!isPremium ? '(Free)' : ''}
                        </button>
                    </div>

                    <button 
                        onClick={onClose} 
                        className={styles.skipLink}
                        style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
                    >
                        Go to Dashboard →
                    </button>
                </div>
            </div>
        </div>
    );
}
