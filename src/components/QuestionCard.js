"use client";

import { useState, useEffect } from 'react';
import styles from './QuestionCard.module.css';

export default function QuestionCard({ question, onNext, isLast, mode = 'practice', selected, onAnswer, progressLabel }) {
    const [selectedOption, setSelectedOption] = useState(selected ?? null);
    const [isAnswered, setIsAnswered] = useState(selected !== undefined && selected !== null);

    // Sync state when question or selected prop changes (e.g. navigation)
    useEffect(() => {
        if (selected !== undefined && selected !== null) {
            setSelectedOption(selected);
            setIsAnswered(true);
        } else {
            setSelectedOption(null);
            setIsAnswered(false);
        }
    }, [question, selected]);

    const handleOptionClick = (index) => {
        if (mode === 'practice' && isAnswered) return;

        setSelectedOption(index);

        if (mode === 'simulation' && onAnswer) {
            const correct = index === question.correct_index;
            onAnswer(correct, index);
        }

        if (mode === 'practice') setIsAnswered(true);
    };

    const isCorrect = (index) => index === question.correct_index;

    return (
        <div className={styles.card}>
            {/* Headers ... (omitted for brevity in replacement if unchanged, keeping context) */}
            <div className={styles.header}>
                {/* Category removed for practice as requested */}
                {question.chapter && <span className={styles.chapter}>Chapter: {question.chapter}</span>}
                {progressLabel && <span style={{ fontWeight: 600, color: '#0f172a' }}>{progressLabel}</span>}
            </div>

            <h3 className={styles.questionText}>{question.text}</h3>

            {question.media_url && (
                <div className={styles.mediaContainer}>
                    <img src={question.media_url} alt="Question Diagram" className={styles.image} />
                </div>
            )}

            <div className={styles.optionsGrid}>
                {question.options.map((opt, index) => {
                    let optionClass = styles.option;

                    if (mode === 'practice' && isAnswered) {
                        if (isCorrect(index)) optionClass += ` ${styles.correct}`;
                        else if (selectedOption === index) optionClass += ` ${styles.incorrect}`;
                    } else if (selectedOption === index) {
                        optionClass += ` ${styles.selected}`;
                    }

                    return (
                        <button
                            key={index}
                            className={optionClass}
                            onClick={() => handleOptionClick(index)}
                            disabled={mode === 'practice' && isAnswered}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>

            {mode === 'practice' && isAnswered && (
                <div className={styles.feedback}>
                    <p className={styles.explanation}>
                        <strong>Explanation: </strong> {question.explanation}
                    </p>
                    <button className={styles.primaryBtn} onClick={() => {
                        setIsAnswered(false);
                        setSelectedOption(null);
                        onNext(selectedOption === question.correct_index, selectedOption);
                    }}>
                        {isLast ? 'Finish Test' : 'Next Question'}
                    </button>
                </div>
            )}

            {mode === 'simulation' && (
                <div style={{ marginTop: '2rem', textAlign: 'right', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                    <button
                        className={styles.primaryBtn}
                        disabled={isLast && selectedOption === null}
                        onClick={() => {
                            // Just trigger navigation. State is already saved via onAnswer.
                            // Passing nulls to onNext to signify "check logic based on current state"
                            onNext(null, null);
                        }}
                    >
                        {isLast ? 'Finish Simulation' : (selectedOption === null ? 'Skip Question' : 'Next Question')}
                    </button>
                </div>
            )}
        </div>
    );
}
