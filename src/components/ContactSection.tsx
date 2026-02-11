"use client";

import { useState } from 'react';
import styles from '../app/page.module.css'; // Reusing landing page styles for consistency

export default function ContactSection() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    source: 'public'
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            setStatus('error');
            setErrorMessage('Something went wrong. Please try again later.');
        }
    };

    return (
        <section id="contact" className={`${styles.section} ${styles.darkSection}`}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Contact Us</h2>
                <p className={styles.sectionSubtitle}>
                    Have questions or feedback? We'd love to hear from you.
                </p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem', width: '100%' }}>
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
                        <p>Thanks for reaching out. We'll get back to you shortly.</p>
                        <button
                            onClick={() => setStatus('idle')}
                            style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: '#166534',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Send another message
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '1rem'
                                }}
                                placeholder="Your Name"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '1rem'
                                }}
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={5}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit'
                                }}
                                placeholder="How can we help you?"
                            />
                        </div>

                        {status === 'error' && (
                            <div style={{ color: '#dc2626', fontSize: '0.9rem' }}>{errorMessage}</div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className={styles.ctaBtn}
                            style={{
                                width: '100%',
                                marginTop: '0.5rem',
                                opacity: status === 'loading' ? 0.7 : 1
                            }}
                        >
                            {status === 'loading' ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}
