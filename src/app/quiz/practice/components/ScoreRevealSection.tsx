"use client";

import React from 'react';
import styles from './Sections.module.css';

interface ScoreRevealSectionProps {
  score: number;
  totalQuestions: number;
  rulesScore: number;
  signsScore: number;
  band: 'passing' | 'borderline' | 'failing';
  config: {
    title: string;
    subtitle: string;
  };
}

export default function ScoreRevealSection({
  score,
  totalQuestions,
  rulesScore,
  signsScore,
  band,
  config
}: ScoreRevealSectionProps) {
  return (
    <div className={styles.sectionContainer} id="score-reveal-section">
      <h2 className={styles.scoreTitle}>{config.title}</h2>
      <p className={styles.scoreSub}>{config.subtitle}</p>
      <div className={styles.scoreNumber}>
        {score}/{totalQuestions}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Rules Score</div>
          <div style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>{rulesScore}/5</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Signs Score</div>
          <div style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>{signsScore}/5</div>
        </div>
      </div>
    </div>
  );
}
