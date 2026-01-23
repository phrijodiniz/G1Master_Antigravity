"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from "./page.module.css";
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useRouter } from 'next/navigation';
import QuizDemo from '@/components/QuizDemo';
import Testimonials from '@/components/Testimonials';

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
                    <Image
                        src="/logo-new.png"
                        alt="G1 Master Logo"
                        width={225}
                        height={63}
                        className={styles.navLogoImage}
                        priority
                    />
                </div>
                <div className={styles.navButtons}>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className={styles.navLoginBtn}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className={styles.navCtaBtn}
                    >
                        Start FREE
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

                        <div className={styles.heroButtons}>
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
                                    const featuresSection = document.getElementById('simple-ways');
                                    if (featuresSection) featuresSection.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={styles.secondaryBtn}
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
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        Start Your FREE 2026 Ontario G1 Practice Test Now
                    </h2>
                    <p className={styles.sectionSubtitle}>
                        Take a quick 10-question quiz based on the official MTO handbook and check your readiness in minutes.
                    </p>
                </div>
                <QuizDemo onUnlock={() => setShowLoginModal(true)} />
            </section>

            {/* Three Simple Ways Section */}
            {/* Three Simple Ways Section */}
            <section id="simple-ways" className={`${styles.section} ${styles.lightSection}`}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitleLight}>3 Simple Ways to Master Your G1</h2>
                    <p className={styles.sectionSubtitleLight}>
                        Take full tests, practice specific topics, or study by handbook chapter—all in one app.
                    </p>
                </div>

                <div className={styles.featuresGrid}>
                    {/* Card 1 */}
                    <div className={styles.featureCard}>
                        <h3>Take a Full G1 Simulation</h3>
                        <p>
                            Endless G1 test simulations. Full-length, exam-style practice built from official questions
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className={styles.featureCard}>
                        <h3>Choose a Practice Mode</h3>
                        <p>
                            Target your G1 knowledge. Pick Rules of the Road or Road Signs and practice exactly what you need.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className={styles.featureCard}>
                        <h3>Study by Chapter</h3>
                        <p>
                            Learn straight from the handbook. Pick any chapter and practice its questions for focused, step-by-step study.
                        </p>
                    </div>
                </div>

                <div className={styles.imageWrapperFull}>
                    <Image
                        src="/three-ways-mockup.png"
                        alt="G1 Master App Simulation Interface"
                        width={1200}
                        height={800}
                    />
                </div>

                <div className={styles.centeredCta}>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className={styles.ctaBtnLimited}
                    >
                        Start Practicing for FREE
                    </button>
                </div>
            </section>

            {/* Social Proof / Testimonials */}
            <Testimonials />

            {/* Track Your Progress Section */}
            <section className={styles.splitSection}>
                <div className={styles.splitContent}>
                    <div className={styles.splitText}>
                        <h2 className={styles.sectionTitleLight} style={{ textAlign: 'left', marginBottom: '1rem' }}>
                            Track Your G1 Study Journey
                        </h2>
                        <p className={styles.sectionSubtitleLight} style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                            See how far you’ve come and know exactly when you’re ready.
                        </p>
                        <p style={{ fontSize: '1rem', opacity: 0.8, lineHeight: 1.8, marginBottom: '2rem' }}>
                            Stay on top of your learning with your <strong>history page</strong> and <strong>readiness meter</strong>. Review every test you’ve taken, track which topics you’ve <strong>mastered</strong>, and see your overall readiness at a glance. Know exactly where you stand and what to <strong>focus</strong> on next.
                        </p>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className={styles.ctaBtnLimited}
                        >
                            Start Practicing for FREE
                        </button>
                    </div>
                    <div className={styles.splitImage}>
                        <Image
                            src="/progress-tracking-v2.png"
                            alt="G1 Master Progress Tracking Dashboard"
                            width={800}
                            height={600}
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className={`${styles.section} ${styles.darkSection}`}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Why G1 Master Works</h2>
                    <p className={styles.sectionSubtitle}>
                        Built to match the real G1 test, G1 Master helps you practice smarter, feel confident, and know exactly when you’re ready.
                    </p>
                </div>

                <div className={styles.featuresGrid}>
                    <div className={styles.featureCard}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
                        <h3>Pass Your G1 With Confidence</h3>
                        <p>
                            Practice with real G1-style questions and walk into your test knowing exactly what to expect. 95% of our users pass on their first attempt.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚗</div>
                        <h3>Never Run Out of Practice</h3>
                        <p>
                            Access 700+ questions based on the official MTO Driver’s Handbook. Every test is unique, so you’re always challenged.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
                        <h3>Know When You’re Ready</h3>
                        <p>
                            Our smart dashboard shows what you’ve mastered and what needs more practice — so there are no surprises on test day.
                        </p>
                    </div>
                </div>

                <div className={styles.centeredCta}>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className={styles.ctaBtnLimited}
                    >
                        Create a FREE Account
                    </button>
                </div>
            </section>

            {/* Final CTA */}
            <section className={`${styles.section} ${styles.whiteSection}`}>
                <h2 className={`${styles.sectionTitleLight} ${styles.finalCtaTitle}`}>Don't Risk Failing.</h2>
                <p className={`${styles.sectionSubtitleLight} ${styles.finalCtaText}`}>
                    Re-taking the test costs time and money. Prepare with G1 Master and pass on your first try.
                </p>
            </section>

            {/* Footer */}
            <div className={styles.footer}>
                &copy; {new Date().getFullYear()} G1 Master App. Unofficial study aid. Not affiliated with the MTO.
            </div>
        </main >
    );
}
