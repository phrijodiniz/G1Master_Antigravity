"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from "./page.module.css";
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useRouter } from 'next/navigation';
import QuizDemo from '@/components/QuizDemo';

export default function Home() {
    const { user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const router = useRouter();

    // Auto-redirect to Dashboard if logged in
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    // If user is logged in, show nothing (or a spinner) while redirecting to avoid flash
    if (user) {
        return (
            <main className={styles.main} style={{ justifyContent: 'center' }}>
                <div style={{ opacity: 0.7 }}>Loading Dashboard...</div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            {/* Nav Header */}
            <nav className={styles.nav}>
                <div>
                    <Image src="/logo-new.png" alt="G1 Master Logo" width={225} height={225} style={{ width: 'auto', height: '63px' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', opacity: 0.9, fontSize: '1.1rem', fontWeight: '500' }}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        style={{ background: 'white', color: 'black', padding: '0.8rem 1.8rem', borderRadius: '30px', cursor: 'pointer', border: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}
                    >
                        Start Free
                    </button>
                </div>
            </nav>

            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.heroTitle}>
                            The Smartest Way to Pass Your G1 Test.<br />
                        </h1>

                        <p className={styles.heroSubtitle}>
                            Join thousands of Ontario drivers who prepared for their G1 Knowledge Test with endless exam-style practice tests created from the Official MTO Handbook.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <button
                                onClick={() => {
                                    const quizSection = document.getElementById('quiz-section');
                                    if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={styles.ctaBtn}
                            >
                                Start Practicing Now
                            </button>
                            <button
                                onClick={() => {
                                    const featuresSection = document.getElementById('features');
                                    if (featuresSection) featuresSection.scrollIntoView({ behavior: 'smooth' });
                                }}
                                style={{
                                    background: 'transparent',
                                    border: '2px solid white',
                                    color: 'white',
                                    padding: '1rem 2rem',
                                    borderRadius: '50px',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                How It Works
                            </button>
                        </div>
                        <p className={styles.heroTrustText}>
                            Real Exam-Style Questions · Pass Guaranteed · Free Sign-Up
                        </p>
                    </div>

                    <div className={styles.heroImageWrapper}>
                        <Image
                            src="/hero-product-shot-v2.png"
                            alt="G1 Master App Interface"
                            width={1024}
                            height={1024}
                            style={{ width: '100%', height: 'auto' }}
                            priority
                        />
                    </div>
                </div>
            </section>

            {/* Quiz Section */}
            <section id="quiz-section" className={styles.quizSection}>
                <div style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '1200px' }}>
                    <h2 style={{ fontSize: '4.0rem', marginBottom: '1rem', color: 'white' }}>
                        Start Your FREE 2025 Ontario G1 Practice Test Now
                    </h2>
                    <p style={{ fontSize: '1.3rem', opacity: 0.8, color: '#cccccc' }}>
                        Take a quick 10-question quiz based on the official MTO handbook and check your readiness in minutes.
                    </p>
                </div>
                <QuizDemo onUnlock={() => setShowLoginModal(true)} />
            </section>

            {/* Features Section */}
            <section id="features" className={styles.section} style={{ background: '#f6f6f6', color: '#000000', width: '100%', maxWidth: '100%' }}>
                <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>Why G1 Master?</h2>
                    <p style={{ textAlign: 'center', opacity: 0.7, maxWidth: '600px' }}>The smartest way to prepare for your Ontario DriveTest.</p>

                    <div className={styles.featuresGrid}>
                        <div className={styles.featureCard}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
                            <h3 style={{ marginBottom: '0.8rem', fontSize: '1.4rem' }}>Pass Your G1 With Confidence</h3>
                            <p style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.6 }}>
                                Practice real G1-style questions so you feel calm, prepared, and confident on test day.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚗</div>
                            <h3 style={{ marginBottom: '0.8rem', fontSize: '1.4rem' }}>Never Run Out of Practice</h3>
                            <p style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.6 }}>
                                Access 700+ official handbook questions with endlessly fresh practice tests.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
                            <h3 style={{ marginBottom: '0.8rem', fontSize: '1.4rem' }}>Know When You’re Ready</h3>
                            <p style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.6 }}>
                                Track your progress and instantly see what to improve before the real exam.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem' }}>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className={styles.ctaBtn}
                            style={{ padding: '1.2rem 3rem', fontSize: '1.2rem' }}
                        >
                            Create a Free Account
                        </button>
                        <p className={styles.microcopy}>Start practicing instantly — no credit card required.</p>
                    </div>
                </div>
            </section>

            {/* Social Proof / Testimonials */}
            <section className={styles.section}>
                <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>Join thousands of new drivers</h2>
                <div className={styles.grid} style={{ marginTop: 0 }}>
                    <div className={styles.testimonialCard}>
                        <p style={{ marginBottom: '1rem' }}>"I failed my G1 twice before finding this app. The simulation mode is exactly like the real thing. Passed with 100%!"</p>
                        <strong style={{ display: 'block', opacity: 0.9 }}>— Sarah J., Toronto</strong>
                    </div>
                    <div className={styles.testimonialCard}>
                        <p style={{ marginBottom: '1rem' }}>"The chapter breakdowns helped me understand the rules, not just memorize answers. Highly recommend."</p>
                        <strong style={{ display: 'block', opacity: 0.9 }}>— Mike T., Ottawa</strong>
                    </div>
                    <div className={styles.testimonialCard}>
                        <p style={{ marginBottom: '1rem' }}>"Worth every penny. The progress tracking gave me the confidence I needed to finally book my test."</p>
                        <strong style={{ display: 'block', opacity: 0.9 }}>— Priya K., Brampton</strong>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className={styles.section} style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Don't Risk Failing.</h2>
                <p style={{ fontSize: '1.2rem', opacity: 0.7, marginBottom: '2rem', maxWidth: '600px' }}>
                    Re-taking the test costs time and money. Prepare with G1 Master and pass on your first try.
                </p>
                <button
                    onClick={() => setShowLoginModal(true)}
                    className={styles.primaryBtn}
                    style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}
                >
                    Create Free Account
                </button>
            </section>

            {/* Footer */}
            <div style={{ padding: '2rem', opacity: 0.4, fontSize: '0.8rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                &copy; {new Date().getFullYear()} G1 Master App. Unofficial study aid. Not affiliated with the MTO.
            </div>
        </main>
    );
}
