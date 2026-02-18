"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginModal.module.css';

export default function LoginModal({ isOpen, onClose }) {
    const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();

    const [isSignUp, setIsSignUp] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (isSignUp) {
                // Check if email exists first
                const checkRes = await fetch('/api/auth/check-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const checkData = await checkRes.json();

                if (checkData.exists) {
                    setError("This email is already registered. Please log in instead.");
                    setLoading(false);
                    return;
                }

                await signupWithEmail(email, password, firstName, lastName);

                // Track Sign Up
                import('@/lib/gtm').then(({ sendGTMEvent }) => {
                    sendGTMEvent('sign_up', { method: 'email' });
                });

                setMessage('Check your email for the confirmation link!');
            } else {
                await loginWithEmail(email, password);
                // Login successful - modal will close via parent effect
            }
        } catch (err) {
            setError(err.message);
        } finally {
            // Only stop loading if we didn't return early (error case handles itself usually, but safe to set false)
            // If success signup, we might want to keep loading or show message
            if (!isSignUp || error) {
                setLoading(false);
            } else {
                // For signup success, we show message, maybe stop loading to let them close?
                setLoading(false);
            }
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={`glass-panel ${styles.modal}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
                    {onClose && (
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                    )}
                </div>

                <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', opacity: 0.9 }}>
                    Join to unlock unlimited practice tests and track your progress.
                </p>

                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', background: 'rgba(255,0,0,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
                {message && <div style={{ color: 'var(--success)', marginBottom: '1rem', background: 'rgba(0,255,0,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{message}</div>}

                <button
                    className="btn-primary"
                    onClick={() => {
                        import('@/lib/gtm').then(({ sendGTMEvent }) => {
                            sendGTMEvent('auth_google_init');
                        });
                        loginWithGoogle();
                    }}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: 'white', color: 'black', border: 'none', marginBottom: '1rem' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12.5S6.42 23 12.1 23c5.83 0 8.84-4.15 8.84-11.9z" fill="currentColor" />
                    </svg>
                    Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0', opacity: 0.5 }}>
                    <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
                    <span>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {isSignUp && (
                        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required={isSignUp}
                                style={{ flex: 1, minWidth: 0, padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required={isSignUp}
                                style={{ flex: 1, minWidth: 0, padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            />
                        </div>
                    )}
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    />
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up with Email' : 'Sign In with Email')}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', marginLeft: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
