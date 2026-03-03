"use client";

import { useState, useEffect } from 'react';
import styles from './QuestionCard.module.css';

export default function QuestionCard({ question, onNext, isLast, mode = 'practice', selected, onAnswer, progressLabel }) {
    const [selectedOption, setSelectedOption] = useState(selected ?? null);
    const [isAnswered, setIsAnswered] = useState(selected !== undefined && selected !== null);
    const [shuffledOptions, setShuffledOptions] = useState([]);

    // Sync state when question or selected prop changes (e.g. navigation)
    useEffect(() => {
        if (selected !== undefined && selected !== null) {
            setSelectedOption(selected);
            setIsAnswered(true);
        } else {
            setSelectedOption(null);
            setIsAnswered(false);
        }

        // Shuffle options and retain their original index for correctness checking
        if (question && question.options) {
            const optionsWithOriginalIndex = question.options.map((opt, index) => ({ text: opt, originalIndex: index }));
            // Fisher-Yates shuffle
            for (let i = optionsWithOriginalIndex.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [optionsWithOriginalIndex[i], optionsWithOriginalIndex[j]] = [optionsWithOriginalIndex[j], optionsWithOriginalIndex[i]];
            }
            setShuffledOptions(optionsWithOriginalIndex);
        }
    }, [question, selected]);

    const handleOptionClick = (originalIndex) => {
        if (mode === 'practice' && isAnswered) return;

        setSelectedOption(originalIndex);

        if (mode === 'simulation' && onAnswer) {
            const correct = originalIndex === question.correct_index;
            onAnswer(correct, originalIndex);
        }

        if (mode === 'practice') {
            setIsAnswered(true);
        } else if (mode === 'freetest') {
            // In free test, we just select the option. 
            // We don't show correct/incorrect.
            // Parent component will handle "Next" button or we render a specific one here.
        }
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
                {shuffledOptions.map((optObj, shuffledIndex) => {
                    const originalIndex = optObj.originalIndex;
                    let optionClass = styles.option;

                    if (mode === 'practice' && isAnswered) {
                        if (isCorrect(originalIndex)) optionClass += ` ${styles.correct}`;
                        else if (selectedOption === originalIndex) optionClass += ` ${styles.incorrect}`;
                    } else if (selectedOption === originalIndex) {
                        optionClass += ` ${styles.selected}`;
                    } else if (mode === 'freetest' && selectedOption === originalIndex) {
                        optionClass += ` ${styles.selected}`;
                    }

                    return (
                        <button
                            key={shuffledIndex}
                            className={optionClass}
                            onClick={() => handleOptionClick(originalIndex)}
                            disabled={mode === 'practice' && isAnswered}
                        >
                            {optObj.text}
                        </button>
                    );
                })}
            </div>

            {mode === 'practice' && isAnswered && (
                <div className={styles.feedback}>
                    {/* Explanation temporarily hidden per request */}
                    {/* <p className={styles.explanation}>
                        <strong>Explanation: </strong> {question.explanation}
                    </p> */}
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

            {mode === 'freetest' && (
                <div style={{ marginTop: '2rem', textAlign: 'right', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                    <button
                        className={styles.primaryBtn}
                        disabled={selectedOption === null}
                        onClick={() => {
                            const correct = selectedOption === question.correct_index;
                            onNext(correct, selectedOption);
                            setSelectedOption(null);
                        }}
                    >
                        {isLast ? 'See My Results' : 'Next Question'}
                    </button>
                </div>
            )}
        </div>
    );
}
