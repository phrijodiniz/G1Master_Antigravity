"use client";

import styles from './LoginModal.module.css'; // Reuse glass panel styles
import { useRouter } from 'next/navigation';
import { SHOW_VALUE_REVEAL } from './UnlockModal';

interface FreeMockTestResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    results: {
        score: number;
        total_questions?: number;
        passed: boolean;
        answers?: any;
    } | null;
}

export default function FreeMockTestResultModal({ isOpen, results, onClose }: FreeMockTestResultModalProps) {
    const router = useRouter();

    if (!isOpen || !results) return null;

    const { score, passed } = results;
    // Interpret out of whatever total_questions is provided, default to 10 if not present.
    const tq = results.total_questions || 10;
    const correctAnswers = Math.round((score / 100) * tq);

    const handlePracticeClick = (category: string) => {
        onClose();
        router.push(`/quiz/practice?category=${encodeURIComponent(category)}`);
    };

    return (
        <div className={styles.overlay}>
            <div className={`glass-panel ${styles.modal}`} style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem 1.5rem', borderRadius: '16px' }}>
                {!SHOW_VALUE_REVEAL ? (
                    <>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', lineHeight: '1.2', fontWeight: 800, color: '#e1ff21' }}>
                            You scored {correctAnswers}/{tq} on your first practice test.
                        </h2>
                    </>
                ) : (
                    <>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', lineHeight: '1.2', fontWeight: 800, color: '#e1ff21' }}>
                            Welcome to the G1 Master App!
                        </h2>
                    </>
                )}

                <p style={{ marginBottom: '1.5rem', opacity: 0.9, fontSize: '1rem', color: 'white' }}>
                    With a little more practice, you can walk into the real G1 fully confident.
                </p>

                <p style={{ marginBottom: '1rem', fontWeight: 600, color: 'white' }}>
                    Choose what you want to practice next:
                </p>

                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem' }}>
                    <button
                        onClick={() => handlePracticeClick('Rules of the Road')}
                        className="btn-primary"
                        style={{
                            flex: 1,
                            padding: '0.8rem',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: '#D4FF00',
                            color: 'black',
                            border: 'none',
                            borderRadius: '8px'
                        }}
                    >
                        Rules of the Road
                    </button>
                    <button
                        onClick={() => handlePracticeClick('Road Signs')}
                        className="btn-primary"
                        style={{
                            flex: 1,
                            padding: '0.8rem',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: '#D4FF00',
                            color: 'black',
                            border: 'none',
                            borderRadius: '8px'
                        }}
                    >
                        Road Signs
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '0.8rem',
                            background: 'transparent',
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            opacity: 0.8
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
