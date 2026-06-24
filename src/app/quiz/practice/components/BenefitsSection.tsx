"use client";

import React from 'react';
import styles from './Sections.module.css';

interface BenefitsSectionProps {
  band: 'passing' | 'borderline' | 'failing';
  config: {
    benefitsFocus: string;
  };
}

export default function BenefitsSection({ band, config }: BenefitsSectionProps) {
  const benefits = [
    'Unlimited practice tests — road signs and rules of the road',
    'All 700+ handbook questions, not just a sample',
    'Exam-like G1 simulations (40 questions, 16/20 to pass each section)',
    'Topic quizzes covering all handbook subjects',
    'Progress tracking across all your tests',
    'One-time payment — no subscription'
  ];

  return (
    <div className={styles.sectionContainer} id="benefits-section">
      <h3 className={styles.benefitsTitle}>👑 Upgrade to G1 Master Premium</h3>
      <p className={styles.benefitsSub}>Your Recommended Focus: {config.benefitsFocus}</p>
      
      <div className={styles.benefitList}>
        {benefits.map((benefit, idx) => (
          <div key={idx} className={styles.benefitItem}>
            <span className={styles.benefitIcon}>✓</span>
            <span className={styles.benefitText}>{benefit}</span>
          </div>
        ))}
      </div>
      
      <p style={{
        fontSize: '0.85rem',
        color: '#64748b',
        marginTop: '1.25rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e2e8f0',
        fontWeight: 500,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 0
      }}>
        Premium gives you focused prep — not a 200-page manual to memorize.
      </p>
    </div>
  );
}
