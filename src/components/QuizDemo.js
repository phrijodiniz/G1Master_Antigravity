"use client";

import { useState } from 'react';
import QuestionCard from './QuestionCard';
import styles from '../app/page.module.css';

const DEMO_QUESTIONS = [
    {
        id: 'd1',
        text: "When a streetcar is stopped to pick up or let off passengers and there is no safety island, what must you do?",
        options: [
            "Stop 2 meters behind the rearmost door where passengers are getting on or off.",
            "Pass on the left side.",
            "Sound your horn and pass with caution.",
            "Pass on the right side."
        ],
        correct_index: 0,
        explanation: "You must stop at least 2 meters behind the rear door to ensure passenger safety."
    },
    {
        id: 'd2',
        text: "If you are involved in an accident in which someone is injured, you must:",
        options: [
            "Report the accident to the Ministry of Transportation within 48 hours.",
            "Report the accident to the police immediately.",
            "Report the accident to your insurance company only.",
            "Exchange information and leave."
        ],
        correct_index: 1,
        explanation: "Any accident involving injury must be reported to the police immediately."
    },
    {
        id: 'd3',
        text: "A solid line at the left of your lane means:",
        options: [
            "It is unsafe to pass.",
            "You may pass if the way is clear.",
            "You are in a passing zone.",
            "You must stop."
        ],
        correct_index: 0,
        explanation: "Solid lines indicate that it is unsafe to pass. Broken lines indicate passing is permitted."
    },
    {
        id: 'd4',
        text: "When lights are required, drivers must switch from high beam to low beam when following another vehicle within:",
        options: [
            "60 meters (200 feet).",
            "30 meters (100 feet).",
            "120 meters (400 feet).",
            "150 meters (500 feet)."
        ],
        correct_index: 0,
        explanation: "Use low beams within 60 meters of following another vehicle to avoid blinding the driver."
    },
    {
        id: 'd5',
        text: "If you miss an expressway exit, what should you do?",
        options: [
            "Back up on the shoulder.",
            "Make a U-turn.",
            "Stop and wait for a gap in traffic.",
            "Go to the next exit."
        ],
        correct_index: 3,
        explanation: "Never reverse on an expressway. Continue to the next exit."
    },
    {
        id: 'd6',
        text: "When are you required to use low-beam headlights?",
        options: [
            "At all times at night.",
            "Within 150 meters of an oncoming vehicle.",
            "Only in the city.",
            "Only when it is raining."
        ],
        correct_index: 1,
        explanation: "You must switch to low beams within 150 meters of an oncoming vehicle."
    },
    {
        id: 'd7',
        text: "If a police officer signals you to pull over, you must:",
        options: [
            "Slow down and stop on the right shoulder as far as possible from traffic.",
            "Stop immediately in your lane.",
            "Drive to the next exit.",
            "Speed up to find a safe spot."
        ],
        correct_index: 0,
        explanation: "Pull over safely to the right shoulder and come to a complete stop."
    },
    {
        id: 'd8',
        text: "Drivers responsible for their passengers must ensure seatbelts are worn by:",
        options: [
            "Only front seat passengers.",
            "Passengers under 16 years of age.",
            "Only themselves.",
            "Everyone in the car."
        ],
        correct_index: 1,
        explanation: "Drivers are legally responsible for ensuring passengers under 16 are secured."
    },
    {
        id: 'd9',
        text: "When approaching a school bus with flashing red lights, you must:",
        options: [
            "Slow down and pass if clear.",
            "Stop at least 20 meters away if on an undivided road.",
            "Honk and proceed.",
            "Stop only if you are behind it."
        ],
        correct_index: 1,
        explanation: "You must stop at least 20 meters away when a school bus has flashing red lights."
    },
    {
        id: 'd10',
        text: "Using a cellular phone while driving is:",
        options: [
            "Allowed if you are careful.",
            "Prohibited unless using a hands-free device.",
            "Allowed at red lights.",
            "Allowed for texting only."
        ],
        correct_index: 1,
        explanation: "Handheld devices are prohibited while driving. Use hands-free only."
    }
];

export default function QuizDemo({ onUnlock }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    // Track score and advance
    const handleNext = (wasCorrect, selectedIndex) => {
        if (wasCorrect) setScore(prev => prev + 1);

        // Wait a moment for user to read explanation? 
        // QuestionCard handles the "Next" click inside itself (showing explanation first), 
        // then calls this onNext. So we just advance immediately here.
        if (currentIndex < DEMO_QUESTIONS.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setFinished(true);
        }
    };

    if (finished) {
        return (
            <div className={styles.quizCard}>
                <h3 className={styles.quizCardTitle}>Quiz Complete!</h3>
                <div className={styles.quizCardScore}>
                    {score}/{DEMO_QUESTIONS.length}
                </div>
                <p className={styles.quizCardText}>
                    {score === DEMO_QUESTIONS.length
                        ? "Perfect score! You're ready to master the road."
                        : "Good practice! Keep going to reach perfection."}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1rem auto' }}>
                        Join G1 Master for unlimited practice tests, detailed tracking, and smart study tools.
                    </p>
                    <button
                        onClick={onUnlock}
                        className={styles.ctaBtn}
                        style={{ width: 'auto', minWidth: '200px' }}
                    >
                        Create Free Account
                    </button>

                </div>
            </div>
        );
    }


    // Pass the current question to the card
    return (
        <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <QuestionCard
                question={DEMO_QUESTIONS[currentIndex]}
                onNext={handleNext}
                isLast={currentIndex === DEMO_QUESTIONS.length - 1}
                mode="practice"
                progressLabel={`Question ${currentIndex + 1} of ${DEMO_QUESTIONS.length}`}
            />
        </div>
    );
}
