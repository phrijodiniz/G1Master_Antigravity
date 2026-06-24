"use client";

import React from 'react';
import styles from './Sections.module.css';

export default function ProofSection() {
  return (
    <div className={`${styles.sectionContainer} ${styles.proofCard}`} id="proof-section">
      <div className={styles.proofStat}>🛡️ 100% Pass Guarantee</div>
      <div className={styles.proofText} style={{ marginBottom: '1rem', fontSize: '0.925rem', color: '#334155' }}>
        Pass on your first try, or get a full refund of your upgrade cost. No questions asked.
      </div>
      <div className={styles.proofStat} style={{ fontSize: '1.25rem' }}>🚗 10,000+ Prepared</div>
      <div className={styles.proofText}>
        Over 10,000 Ontario drivers prepared for their G1 exam with G1 Master.
      </div>
    </div>
  );
}
