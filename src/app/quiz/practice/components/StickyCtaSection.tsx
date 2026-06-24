"use client";

import React from 'react';
import styles from './Sections.module.css';

interface StickyCtaSectionProps {
  onShareParent: () => void;
  onShowLimits: () => void;
  category: string;
  nextCategory: string;
  isSharing: boolean;
}

export default function StickyCtaSection({
  onShareParent,
  onShowLimits,
  category,
  nextCategory,
  isSharing
}: StickyCtaSectionProps) {
  const handleUnlockClick = () => {
    const el = document.getElementById('pricing-grid-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.stickyCtaBar}>
      <button 
        type="button" 
        onClick={handleUnlockClick} 
        className={styles.ctaBtnPrimary}
      >
        Unlock G1 Master Premium
      </button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.5rem' }}>
        <button 
          type="button" 
          onClick={onShareParent} 
          disabled={isSharing} 
          className={styles.ctaBtnSecondary}
          style={{ flex: 1, padding: '0.6rem 0.5rem', margin: 0, height: 'auto', lineHeight: 1.2 }}
        >
          {isSharing ? 'Generating...' : '👪 Ask Parent'}
        </button>
        
        <button 
          type="button" 
          onClick={onShowLimits} 
          className={styles.ctaLinkBtn}
          style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 0.5rem', textDecoration: 'none', fontWeight: 600, border: '1px solid #e2e8f0', borderRadius: '10px' }}
        >
          🔒 Retake Test
        </button>
      </div>
    </div>
  );
}
