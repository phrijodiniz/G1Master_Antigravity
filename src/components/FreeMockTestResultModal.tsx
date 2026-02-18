"use client";

import styles from './LoginModal.module.css'; // Reuse glass panel styles

export default function FreeMockTestResultModal({ isOpen, results, onClose }) {
    if (!isOpen || !results) return null;

    const { score, passed } = results;
    // Assuming 10 questions total (5 rules, 5 signs) or similar small number for free test
    // Adjust logic if free test size varies. The prompt implies "Question 1 of 10", so 10 total.

    return (
        <div className={styles.overlay}>
            <div className={`glass-panel ${styles.modal}`} style={{
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center',
                padding: '2rem',
                borderRadius: '16px',
                background: '#0f172a', // Darker background (slate-900)
                color: '#f8fafc', // Light text (slate-50)
                border: '1px solid #334155'
            }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 800 }}>
                    Practice Test Results
                </h2>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        fontSize: '4rem',
                        fontWeight: 900,
                        color: passed ? '#4ade80' : '#f87171', // Brighter green/red
                        lineHeight: 1
                    }}>
                        {score}%
                    </div>
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: passed ? '#4ade80' : '#f87171',
                        textTransform: 'uppercase',
                        marginTop: '0.5rem'
                    }}>
                        {passed ? 'Passed' : 'Failed'}
                    </div>
                </div>



                <p style={{ marginBottom: '2rem', opacity: 0.9, lineHeight: '1.6', color: '#e2e8f0' }}>
                    {passed
                        ? "Great job! You're on the right track. Keep practicing to maintain your streak."
                        : "Don't worry, that's why we practice!"}
                </p>

                <button
                    onClick={onClose}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: 'white',
                        color: 'black',
                        border: 'none',
                        borderRadius: '8px'
                    }}
                >
                    Continue to Dashboard
                </button>
            </div>
        </div>
    );
}
