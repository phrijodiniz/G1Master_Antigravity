"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import styles from "./page.module.css";
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useRouter } from 'next/navigation';

import Testimonials from '@/components/Testimonials';
import ContactSection from '@/components/ContactSection';

import { sendGTMEvent } from '@/lib/gtm';

export default function Home() {
    const { user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const router = useRouter();
    const scrollRef = useRef(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const whyWorksScrollRef = useRef(null);
    const [whyWorksActiveSlide, setWhyWorksActiveSlide] = useState(0);

    const features = [
        {
            title: "Practice Mode",
            subtitle: "Target your G1 knowledge. Pick a category like Rules of the Road or Road Signs and practice what you need.",
            image: "/practice-mode.png"
        },
        {
            title: "Exam Simulation",
            subtitle: "Endless G1 test simulations. Full-length, exam-style practice questions built from official questions",
            image: "/simulation-mode.png"
        },
        {
            title: "Chapter Mode",
            subtitle: "Learn straight from the official handbook. Pick any chapter and practice its questions for focused study.",
            image: "/chapter-mode.png"
        }
    ];

    const whyWorksFeatures = [
        {
            icon: "🛡️",
            title: "Pass Your G1 With Confidence",
            text: "Practice with real G1-style questions and walk into your test knowing exactly what to expect. 95% of our users pass on their first attempt."
        },
        {
            icon: "🚗",
            title: "Never Run Out of Practice",
            text: "Access 700+ questions based on the official MTO Driver’s Handbook. Every test is unique, so you’re always challenged."
        },
        {
            icon: "📈",
            title: "Know When You’re Ready",
            text: "Our smart dashboard shows what you’ve mastered and what needs more practice — so there are no surprises on test day."
        }
    ];

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const width = scrollRef.current.offsetWidth;
            const index = Math.round(scrollLeft / width);
            setActiveSlide(index);
        }
    };

    const handleWhyWorksScroll = () => {
        if (whyWorksScrollRef.current) {
            const scrollLeft = whyWorksScrollRef.current.scrollLeft;
            const width = whyWorksScrollRef.current.offsetWidth;
            const index = Math.round(scrollLeft / width);
            setWhyWorksActiveSlide(index);
        }
    };

    // Auto-redirect to Dashboard if logged in
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    // Scroll Tracking
    useEffect(() => {
        let trackedPercentages = [];

        const handleScrollTracking = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollTop = window.scrollY;
            const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);

            const milestones = [25, 50, 75, 90];

            milestones.forEach((milestone) => {
                if (scrollPercentage >= milestone && !trackedPercentages.includes(milestone)) {
                    trackedPercentages.push(milestone);
                    sendGTMEvent('scroll_depth', { percentage: milestone });
                }
            });
        };

        window.addEventListener('scroll', handleScrollTracking);
        return () => window.removeEventListener('scroll', handleScrollTracking);
    }, []);

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
                        onClick={() => {
                            setShowLoginModal(true);
                            sendGTMEvent('cta_click', { location: 'nav', label: 'start_free' });
                        }}
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
                            Free Ontario G1 Practice Tests
                        </h1>

                        <ul className={styles.heroList}>
                            <li>👉 Real exam‑style questions</li>
                            <li>👉 Know instantly if you would pass</li>
                            <li>👉 Track your progress and readiness</li>
                        </ul>

                        <div className={styles.heroButtons}>
                            <button
                                onClick={() => {
                                    sendGTMEvent('cta_click', { location: 'hero', label: 'start_practice' });
                                    router.push('/practice/free-test');
                                }}
                                className={styles.ctaBtn}
                            >
                                Start Free Practice Now
                            </button>
                            <button
                                onClick={() => {
                                    sendGTMEvent('cta_click', { location: 'hero', label: 'how_it_works' });
                                    const featuresSection = document.getElementById('simple-ways');
                                    if (featuresSection) featuresSection.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={styles.secondaryBtn}
                            >
                                How It Works
                            </button>
                        </div>
                        <p className={styles.heroTrustText}>
                            100% FREE • Ontario Specific • Pass Guaranteed
                        </p>
                    </div>

                    <div className={styles.heroImageWrapper}>
                        {/* Mobile Image */}
                        <div className={styles.mobileOnly}>
                            <Image
                                src="/hero-mobile-v2.png"
                                alt="G1 Master App Mobile Interface"
                                width={600}
                                height={600}
                                style={{ width: '100%', height: 'auto' }}
                                priority
                            />
                        </div>

                        {/* Desktop Image */}
                        <div className={styles.desktopOnly}>
                            <Image
                                src="/hero-product-shot-v4.png"
                                alt="G1 Master App Interface"
                                width={1024}
                                height={1024}
                                style={{ width: '100%', height: 'auto' }}
                                priority
                            />
                        </div>
                    </div>
                </div>
            </section>



            <div className={styles.separatorLine}></div>

            {/* Three Simple Ways Section */}
            <section id="simple-ways" className={`${styles.section} ${styles.lightSection}`}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitleLight}>3 Smart Ways to Master Your G1</h2>
                    <p className={styles.sectionSubtitleLight}>
                        Take full tests, practice specific topics, or study by handbook chapter—all in one app.
                    </p>
                </div>

                <div
                    className={styles.featuresGrid}
                    ref={scrollRef}
                    onScroll={handleScroll}
                >
                    {features.map((feature, index) => (
                        <div key={index} className={styles.featureCard}>
                            <h3 className={styles.featureCardTitle}>{feature.title}</h3>
                            <p className={styles.featureCardSubtitle}>{feature.subtitle}</p>

                            <div className={styles.featureImageContainer}>
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    width={300}
                                    height={500}
                                    className={styles.featureCardImage}
                                    unoptimized
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mobile Pagination Dots */}
                <div className={styles.carouselDots}>
                    {features.map((_, index) => (
                        <span
                            key={index}
                            className={`${styles.dot} ${activeSlide === index ? styles.activeDot : ''}`}
                            onClick={() => {
                                if (scrollRef.current) {
                                    const width = scrollRef.current.offsetWidth;
                                    scrollRef.current.scrollTo({
                                        left: width * index,
                                        behavior: 'smooth'
                                    });
                                }
                            }}
                        />
                    ))}
                </div>

                <div className={styles.centeredCta}>
                    <p style={{ opacity: 0.8, fontSize: '1rem', maxWidth: '800px', margin: '2rem auto 1.5rem auto', lineHeight: '1.6', textAlign: 'center' }}>
                        Think you're ready for the Ontario G1? Take a quick 10-question test and find out.
                    </p>
                    <button
                        onClick={() => {
                            sendGTMEvent('cta_click', { location: 'middle_section', label: 'try_practice' });
                            router.push('/practice/free-test');
                        }}
                        className={styles.ctaBtnLimited}
                    >
                        Try a Free Practice Test
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
                            onClick={() => {
                                sendGTMEvent('cta_click', { location: 'progress_section', label: 'take_test' });
                                router.push('/practice/free-test');
                            }}
                            className={styles.ctaBtnLimited}
                        >
                            Take a Free G1 Test Now!
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

                <div
                    className={styles.featuresGrid}
                    ref={whyWorksScrollRef}
                    onScroll={handleWhyWorksScroll}
                >
                    {whyWorksFeatures.map((feature, index) => (
                        <div key={index} className={`${styles.featureCard} ${styles.featureCardWithPadding}`}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.text}</p>
                        </div>
                    ))}
                </div>

                {/* Mobile Pagination Dots for Why Works */}
                <div className={styles.carouselDots}>
                    {whyWorksFeatures.map((_, index) => (
                        <span
                            key={index}
                            className={`${styles.dot} ${whyWorksActiveSlide === index ? styles.activeDot : ''}`}
                            onClick={() => {
                                if (whyWorksScrollRef.current) {
                                    const width = whyWorksScrollRef.current.offsetWidth;
                                    whyWorksScrollRef.current.scrollTo({
                                        left: width * index,
                                        behavior: 'smooth'
                                    });
                                }
                            }}
                        />
                    ))}
                </div>

                <div className={styles.centeredCta}>
                    <p style={{ opacity: 0.8, fontSize: '1rem', maxWidth: '800px', margin: '2rem auto 1.5rem auto', lineHeight: '1.6', textAlign: 'center', color: '#cccccc' }}>
                        Thousands of questions. Real exam logic. Clear progress tracking. Everything you need to pass your G1, without overpriced subscriptions.
                    </p>
                    <button
                        onClick={() => {
                            setShowLoginModal(true);
                            sendGTMEvent('cta_click', { location: 'features_section', label: 'create_account' });
                        }}
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

            {/* Contact Section */}
            <ContactSection />

            {/* Footer */}
            <div className={styles.footer}>
                &copy; {new Date().getFullYear()} G1 Master App. Unofficial study aid. Not affiliated with the MTO.
            </div>
        </main >
    );
}
