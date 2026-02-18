'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './Testimonials.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TESTIMONIALS = [
    {
        id: 1,
        text: "I failed my G1 twice before finding this app. The simulation mode is exactly like the real thing. Passed with 100%!",
        name: "Sarah J.",
        location: "Toronto"
    },
    {
        id: 2,
        text: "The chapter breakdowns helped me understand the rules, not just memorize answers. Highly recommend.",
        name: "Mike T.",
        location: "Ottawa"
    },
    {
        id: 3,
        text: "Worth every penny. The progress tracking gave me the confidence I needed to finally book my test.",
        name: "Priya K.",
        location: "Brampton"
    },
    {
        id: 4,
        text: "Questions were identical to the real test. I finished in 10 minutes and got every single one right.",
        name: "David L.",
        location: "Mississauga"
    },
    {
        id: 5,
        text: "Love the simulation mode. It felt just like sitting in the DriveTest centre, but less stressful!",
        name: "Emily R.",
        location: "Hamilton"
    },
    {
        id: 6,
        text: "Best app for G1 prep. Hands down. The explanations for wrong answers helped me learn fast.",
        name: "Ahmed H.",
        location: "London"
    },
    {
        id: 7,
        text: "Quick quizzes fit perfectly into my schedule. I practiced on the bus to work every day.",
        name: "Jessica M.",
        location: "Ottawa"
    },
    {
        id: 8,
        text: "Simple, effective, and free to start. Can't beat it. Definitely tell your friends.",
        name: "Chris P.",
        location: "Windsor"
    }
];

export default function Testimonials() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Number of items visible depends on screen width, but we'll manage 'pages' or simple sliding window
    // For simplicity with "Display 3 at a time", we'll increment by 1 but show a window of 3.
    // However, to make it "rotate", we need to handle wrapping logic carefully.

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % TESTIMONIALS.length);
    }, []);

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    };

    // Auto-rotate
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(nextSlide, 5000); // 5 seconds per slide
        return () => clearInterval(interval);
    }, [isPaused, nextSlide]);

    // getVisibleItems
    const getVisibleItems = () => {
        const items = [];
        for (let i = 0; i < 3; i++) {
            const index = (currentIndex + i) % TESTIMONIALS.length;
            items.push(TESTIMONIALS[index]);
        }
        return items;
    };

    const visibleTestimonials = getVisibleItems();

    return (
        <section className={styles.section} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            <div className={styles.container}>
                <h2 className={styles.title}>1000+ Drivers Passed With G1 Master</h2>

                <div className={styles.carouselContainer}>
                    <div className={styles.track}>
                        {/* We map the 3 visible items. 
                            Note: For a true smooth sliding animation we usually render more items or use a library, 
                            but for this implementation, we will replace the contents.
                            If "slide" animation is strictly required between independent cards, we can do it, 
                            but replacing the 3 cards with fade/slide effect is often acceptable for "Slide or auto-rotate".
                            Given constraints, I'll implement a clean CSS animation keyframe if possible, 
                            or just state update which is instant. 
                            
                            To make it feel like a carousel, keeping the cards stable and shifting content is tricky without a library.
                            Let's rely on the state update.
                        */}
                        {visibleTestimonials.map((item, index) => (
                            <div key={`${item.id}-${index}`} className={styles.card}>
                                <p className={styles.quote}>"{item.text}"</p>
                                <div>
                                    <span className={styles.author}>{item.name}</span>
                                    <span className={styles.location}>{item.location}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.controls}>
                    <button className={styles.navButton} onClick={prevSlide} aria-label="Previous testimonial">
                        <ChevronLeft size={24} />
                    </button>

                    <div className={styles.indicators}>
                        {TESTIMONIALS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''}`}
                                onClick={() => setCurrentIndex(idx)}
                            />
                        ))}
                    </div>

                    <button className={styles.navButton} onClick={nextSlide} aria-label="Next testimonial">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
        </section>
    );
}
