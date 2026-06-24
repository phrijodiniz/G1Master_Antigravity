"use client";

import React from 'react';
import styles from './Sections.module.css';

interface StakesSectionProps {
  band: 'passing' | 'borderline' | 'failing';
  config: {
    stakesCopy: string;
  };
}

export default function StakesSection({ band, config }: StakesSectionProps) {
  const cardClass = band === 'failing' 
    ? `${styles.stakesCard} ${styles.stakesCardRed}` 
    : `${styles.stakesCard} ${styles.stakesCardAmber}`;

  return (
    <div className={styles.sectionContainer} id="stakes-section">
      <h3 className={styles.benefitsTitle} style={{ marginBottom: '0.75rem' }}>⚠️ What is at stake?</h3>
      <div className={cardClass}>
        {config.stakesCopy}
      </div>
    </div>
  );
}
