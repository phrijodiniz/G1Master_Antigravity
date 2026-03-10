"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginModal.module.css'; // Reuse login styles
import { useRouter } from 'next/navigation';
import { sendGTMEvent } from '@/lib/gtm';

export const SHOW_VALUE_REVEAL = false;

export default function UnlockModal({ isOpen, results }) {
    const { loginWithGoogle, signupWithEmail, loginWithEmail } = useAuth();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const correctAnswers = results?.answers ? Object.values(results.answers).filter(ans => ans.isCorrect).length : 0;
    const totalQuestions = results?.total_questions || 0;
    const passProbability = results?.score ? Math.round(results.score * 0.9) : 0;

    if (!isOpen) return null;

    const handleAction = async (actionFn) => {
        setError('');
        setMessage('');
        setLoading(true);

        // Save results to localStorage before auth redirect/action
        if (results) {
            localStorage.setItem('pending_freetest_results', JSON.stringify({
                ...results,
                timestamp: Date.now()
            }));
        }

        try {
            const data = await actionFn();

            // If we have a session immediately (email confirm off), redirect
            if (data?.session) {
                router.push('/dashboard');
                return;
            }

            // If we have a user but no session (email confirm likely on), show message
            if (data?.user && !data.session) {
                setMessage('Account created! Please check your email to confirm.');
                setLoading(false);
                return;
            }

            // For Google login which might redirect
            if (!data) {
                // Might be void if it's the Google redirect flow
                // Let it hang or maybe show "Redirecting..."
            }

        } catch (err) {
            let msg = err.message;
            if (msg.includes('rate limit') || msg.includes('already registered')) {
                msg = "Email found in our database. Log in instead.";
            }
            setError(msg);
            setLoading(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        // For simplicity reusing signup logic or add login toggle if needed
        // Requirement says: "Allow Google sign-in + Email signup."
        if (isSignUp) {
            sendGTMEvent('free_test_conversion', { method: 'email' }); // Fire before action like Google
            handleAction(async () => {
                // Check if email exists first
                const checkRes = await fetch('/api/auth/check-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const checkData = await checkRes.json();

                if (checkData.exists) {
                    throw new Error("This email is already registered. Please log in instead.");
                }

                return await signupWithEmail(email, password, '', '');
            });
        } else {
            handleAction(() => loginWithEmail(email, password));
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={`glass-panel ${styles.modal}`} style={{ maxWidth: '400px', textAlign: 'center', padding: '2.5rem 1.5rem', borderRadius: '16px' }}>
                {step === 1 ? (
                    <>
                        {results && (
                            <>
                                <h2 style={{ fontSize: '3rem', marginBottom: '0.5rem', lineHeight: '1.2', fontWeight: 800, color: '#e1ff21' }}>
                                    Score:{' '}
                                    <span style={{ filter: !SHOW_VALUE_REVEAL ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}>
                                        {correctAnswers}/{totalQuestions}
                                    </span>
                                </h2>

                                <p style={{ marginBottom: '1.5rem', opacity: 0.9, fontSize: '1rem' }}>
                                    <strong>
                                        Chance of Passing Today:{' '}
                                        <span style={{ filter: !SHOW_VALUE_REVEAL ? 'blur(5px)' : 'none', transition: 'filter 0.3s ease' }}>
                                            {passProbability}%
                                        </span>
                                    </strong>
                                </p>

                                <p style={{ marginBottom: '1rem', fontWeight: 100 }}>
                                    {SHOW_VALUE_REVEAL
                                        ? "You’re almost there, but almost doesn’t pass the real G1."
                                        : "Create your FREE account to unlock your exact score."
                                    }
                                </p>

                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.2)', margin: '1.5rem 0' }} />

                                <p style={{ marginBottom: '1rem', fontWeight: 600 }}>
                                    {SHOW_VALUE_REVEAL ? "Create your FREE account to:" : "Included with free account:"}
                                </p>

                                <ul style={{ textAlign: 'left', display: 'inline-block', marginBottom: '1.5rem', opacity: 0.9, lineHeight: '1.6', listStyleType: 'none', padding: 0 }}>
                                    <li style={{ marginBottom: '0.4rem' }}>✅ Access +1000 new practice tests</li>
                                    <li style={{ marginBottom: '0.4rem' }}>✅ Review all correct & incorrect answers</li>
                                    <li>✅ Track your real G1 Readiness</li>
                                </ul>
                            </>
                        )}

                        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                            It takes 10 seconds. FREE. No Spam.
                        </p>

                        <button
                            className="btn-primary"
                            onClick={() => setStep(2)}
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                background: '#D4FF00',
                                color: 'black',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Create FREE Account
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
                            <button
                                onClick={() => setStep(1)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    position: 'absolute',
                                    left: 0,
                                    padding: '0.5rem',
                                    opacity: 0.8
                                }}
                            >
                                ← Back
                            </button>
                        </div>

                        {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
                        {message && <div style={{ color: 'var(--success)', marginBottom: '1rem', background: 'rgba(0,255,0,0.1)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>{message}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    sendGTMEvent('free_test_conversion', { method: 'google' }); // Fire before redirect
                                    handleAction(loginWithGoogle);
                                }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    background: 'white',
                                    color: 'black',
                                    border: '1px solid #e2e8f0',
                                    width: '100%',
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12.5S6.42 23 12.1 23c5.83 0 8.84-4.15 8.84-11.9z" fill="currentColor" />
                                </svg>
                                Sign Up with Google
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.4, margin: '0.5rem 0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
                                <span style={{ fontSize: '0.8rem' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
                            </div>

                            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                />
                                <input
                                    type="password"
                                    placeholder="Create Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                />
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        background: '#D4FF00',
                                        color: 'black',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {loading ? 'Creating Account...' : 'Sign Up with Email'}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
