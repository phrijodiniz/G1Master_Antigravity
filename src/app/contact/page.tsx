"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/app/dashboard/dashboard.module.css'; // Reusing dashboard styles
import DashboardLayout from "@/components/DashboardLayout";

export default function ContactPage() {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setErrorMessage('You must be logged in to send a message.');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    source: 'authenticated',
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : '',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            setStatus('success');
            setMessage('');
        } catch (error) {
            setStatus('error');
            setErrorMessage('Something went wrong. Please try again later.');
        }
    };

    return (
        <DashboardLayout>
            <div className={styles.dashboardGrid}>
                {/* Main Content Area - Full Width for Contact Form */}
                <div style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    <div className={styles.banner}>
                        <div>
                            <h1 className={styles.bannerTitle}>Contact Support</h1>
                            <p className={styles.bannerSubtitle}>
                                We're here to help. Send us a message and we'll get back to you as soon as possible.
                            </p>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
                        {status === 'success' ? (
                            <div style={{
                                padding: '2rem',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '8px',
                                textAlign: 'center',
                                color: '#166534'
                            }}>
                                <h3 style={{ marginBottom: '0.5rem' }}>Message Sent!</h3>
                                <p>Thanks for reaching out. We'll be in touch shortly.</p>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className={styles.actionBtn}
                                    style={{ marginTop: '1rem', width: 'auto', display: 'inline-block' }}
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Your Email</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            backgroundColor: '#f1f5f9',
                                            color: '#64748b',
                                            cursor: 'not-allowed'
                                        }}
                                    />
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        We'll reply to this email address.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#334155' }}>Message</label>
                                    <textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                        rows={8}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '1rem',
                                            fontFamily: 'inherit',
                                            resize: 'vertical'
                                        }}
                                        placeholder="Type your message here..."
                                    />
                                </div>

                                {status === 'error' && (
                                    <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                        {errorMessage}
                                    </div>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className={styles.actionBtn}
                                        style={{ width: '100%', opacity: status === 'loading' ? 0.7 : 1 }}
                                    >
                                        {status === 'loading' ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
