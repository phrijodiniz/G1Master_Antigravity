"use client";

import React from 'react';
import styles from '@/components/PricingCardGrid.module.css';

interface PricingTier {
  id: '2_weeks' | '30_days' | 'lifetime';
  price: string;
  durationLabel: string;
  details: string;
  isPopular?: boolean;
}

interface PricingGridSectionProps {
  pricing: PricingTier[];
  onSelectTier: (tier: '2_weeks' | '30_days' | 'lifetime') => void;
  isSubmitting: boolean;
}

export default function PricingGridSection({ pricing, onSelectTier, isSubmitting }: PricingGridSectionProps) {
  const getTagline = (id: string) => {
    switch (id) {
      case '2_weeks': return '⚡ Quick study push';
      case '30_days': return '🏆 Perfect preparation window';
      case 'lifetime': return '💎 Best value & pass guarantee';
      default: return '';
    }
  };

  return (
    <div className={`${styles.grid} ${styles.stackedGrid}`} id="pricing-grid-section">
      {pricing.map((tier) => {
        const isPopular = tier.isPopular;
        return (
          <div
            key={tier.id}
            className={`${styles.card} ${isPopular ? styles.popularCard : ''}`}
          >
            {isPopular && <div className={styles.badge}>Most Popular</div>}
            <h3 className={`${styles.title} ${isPopular ? styles.popularTitle : ''}`}>
              {tier.durationLabel}
            </h3>
            <p className={styles.tagline}>{getTagline(tier.id)}</p>
            <div className={styles.priceContainer}>
              <span className={styles.currency}>$</span>
              <span className={`${styles.price} ${isPopular ? styles.popularPrice : ''}`}>
                {tier.price}
              </span>
              <span className={styles.duration}> CAD</span>
            </div>
            <div className={styles.paymentNote}>One-time payment • No subscription</div>
            <p className={styles.details}>{tier.details}</p>
            <div className={styles.guaranteeTag}>
              🛡️ Pass Guarantee: Pass on your first try or get 100% refund.
            </div>
            <button
              type="button"
              onClick={() => onSelectTier(tier.id)}
              disabled={isSubmitting}
              className={`${styles.button} ${isPopular ? styles.popularButton : ''}`}
            >
              {isSubmitting ? 'Connecting...' : 'Select Plan'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
