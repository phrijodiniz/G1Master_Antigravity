"use client";

import React, { useState } from 'react';
import styles from './Sections.module.css';

interface ReadinessCheckSectionProps {
  rulesAvg: number | null;
  signsAvg: number | null;
  passProbability: number;
  showWeakestName: boolean;
  practiceCount?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

const GaugeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 2a10 10 0 0 1 10 10c0 2.2-.7 4.3-2 6" />
    <path d="M4 18A10 10 0 0 1 12 2" />
    <path d="m12 13 4-4" />
    <circle cx="12" cy="13" r="1" />
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export default function ReadinessCheckSection({
  rulesAvg,
  signsAvg,
  passProbability,
  showWeakestName,
  practiceCount = 3,
  className,
  style,
  title
}: ReadinessCheckSectionProps) {
  const [showMathInfo, setShowMathInfo] = useState(false);

  // 1. Calculate Score Band and Label
  let scoreBandLabel = 'Not ready';
  let scoreBandColor = '#64748b'; // Grey
  if (passProbability >= 80) {
    scoreBandLabel = 'Ready';
    scoreBandColor = '#059669'; // Green
  } else if (passProbability >= 70) {
    scoreBandLabel = 'Almost there';
    scoreBandColor = '#ca8a04'; // Yellow
  } else if (passProbability >= 50) {
    scoreBandLabel = 'Getting close';
    scoreBandColor = '#ea580c'; // Orange
  }

  // 2. Segmented Progress Bar Math (Zones: 0-50% Grey, 50-70% Orange, 70-80% Yellow, 80-100% Green)
  const fillWidth1 = passProbability >= 50 ? 100 : (passProbability / 50) * 100;
  const fillWidth2 = passProbability <= 50 ? 0 : (passProbability >= 70 ? 100 : ((passProbability - 50) / 20) * 100);
  const fillWidth3 = passProbability <= 70 ? 0 : (passProbability >= 80 ? 100 : ((passProbability - 70) / 10) * 100);
  const fillWidth4 = passProbability <= 80 ? 0 : ((passProbability - 80) / 20) * 100;

  // 3. Category Pass/Fail Caption
  let captionText = 'Vertical line = pass line.';
  if (rulesAvg !== null && signsAvg !== null) {
    if (rulesAvg < 80 && signsAvg < 80) {
      captionText = 'Vertical line = pass line. Both sections are below it.';
    } else if (rulesAvg < 80) {
      captionText = 'Vertical line = pass line. Rules of the road is below it.';
    } else if (signsAvg < 80) {
      captionText = 'Vertical line = pass line. Road signs is below it.';
    } else {
      captionText = 'Vertical line = pass line. Both sections are above it.';
    }
  } else if (rulesAvg !== null && rulesAvg < 80) {
    captionText = 'Vertical line = pass line. Rules of the road is below it.';
  } else if (signsAvg !== null && signsAvg < 80) {
    captionText = 'Vertical line = pass line. Road signs is below it.';
  }

  // 4. Dynamic Reliability Calculations
  let reliabilityText = 'low';
  let filledSegments = 2;
  let segmentColorClass = styles.reliabilityBarActiveOrange;

  if (practiceCount <= 1) {
    reliabilityText = 'very low';
    filledSegments = 1;
    segmentColorClass = styles.reliabilityBarActiveRed;
  } else if (practiceCount <= 3) {
    reliabilityText = 'low';
    filledSegments = 2;
    segmentColorClass = styles.reliabilityBarActiveOrange;
  } else if (practiceCount <= 6) {
    reliabilityText = 'medium';
    filledSegments = 3;
    segmentColorClass = styles.reliabilityBarActiveAmber;
  } else if (practiceCount <= 9) {
    reliabilityText = 'good';
    filledSegments = 4;
    segmentColorClass = styles.reliabilityBarActiveGreenBlue;
  } else {
    reliabilityText = 'high';
    filledSegments = 5;
    segmentColorClass = styles.reliabilityBarActiveGreen;
  }

  return (
    <div 
      className={`${styles.sectionContainer} ${className || ''}`} 
      style={style} 
      id="readiness-check-section"
    >
      {/* Title & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
        <h3 className={styles.scoreTitle} style={{ fontSize: '1.4rem', margin: 0 }}>
          {title || "How ready are you, really?"}
        </h3>
        <button 
          className={styles.infoIconBtn}
          onClick={() => setShowMathInfo(!showMathInfo)}
          title="Explain how readiness is calculated"
          aria-label="Explain how readiness is calculated"
          type="button"
        >
          <InfoIcon />
        </button>
      </div>
      <p className={styles.scoreSub} style={{ marginBottom: '1.25rem' }}>
        {practiceCount >= 3 
          ? `${practiceCount === 3 ? 'Three' : practiceCount} tests gives us a rough idea. A few more, and you'll know for sure.`
          : 'Complete at least 3 practice tests to fully calibrate your G1 Readiness check.'}
      </p>

      {/* Math Explanation Info Card */}
      {showMathInfo && (
        <div className={styles.mathInfoCard}>
          <h4 className={styles.mathInfoTitle}>
            <InfoIcon /> G1 Readiness Pass Probability
          </h4>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            Your pass probability is computed using a baseline adjusted by your active practice averages:
          </p>
          <div className={styles.mathFormula}>
            Readiness = 40% + (Average Practice Score × 0.5) × Confidence Weight
          </div>
          <ul className={styles.mathInfoList}>
            <li><strong>Baseline Probability:</strong> Starts at 40% before taking practice tests.</li>
            <li><strong>Performance Weight:</strong> Up to 50% additional probability is earned based on your performance.</li>
            <li><strong>Confidence Weighting:</strong> To guarantee readiness is based on consistent success, scores are balanced by the number of practice tests you have completed (at least 10 completed tests are required to unlock the "Ready" status band).</li>
            <li><strong>Ontario Passing Rule:</strong> Passing the official Ontario G1 exam requires scoring at least 80% on both Rules of the Road and Road Signs separately.</li>
          </ul>
        </div>
      )}

      {/* Large Score Indicator */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '2.25rem', fontWeight: 800, color: scoreBandColor, lineHeight: 1 }}>
          ~{passProbability}%
        </span>
        <span style={{ fontSize: '1.15rem', fontWeight: 700, color: scoreBandColor }}>
          {scoreBandLabel}
        </span>
      </div>

      {/* Segmented Horizontal Progress Bar Wrapper */}
      <div style={{ position: 'relative', width: '100%', marginTop: '1.5rem' }}>
        <div className={styles.segmentedTrack} style={{ marginTop: 0 }}>
          {/* Segment 1: Grey Zone (50% width) */}
          <div className={`${styles.segmentedZone} ${styles.segmentedZoneGrey}`} style={{ width: '50%' }}>
            <div className={styles.segmentedFillGrey} style={{ width: `${fillWidth1}%`, height: '100%' }} />
          </div>
          {/* Segment 2: Orange Zone (20% width) */}
          <div className={`${styles.segmentedZone} ${styles.segmentedZoneOrange}`} style={{ width: '20%' }}>
            <div className={styles.segmentedFillOrange} style={{ width: `${fillWidth2}%`, height: '100%' }} />
          </div>
          {/* Segment 3: Yellow Zone (10% width) */}
          <div className={`${styles.segmentedZone} ${styles.segmentedZoneYellow}`} style={{ width: '10%' }}>
            <div className={styles.segmentedFillYellow} style={{ width: `${fillWidth3}%`, height: '100%' }} />
          </div>
          {/* Segment 4: Green Zone (20% width) */}
          <div className={`${styles.segmentedZone} ${styles.segmentedZoneGreen}`} style={{ width: '20%' }}>
            <div className={styles.segmentedFillGreen} style={{ width: `${fillWidth4}%`, height: '100%' }} />
          </div>
        </div>

        {/* Current Readiness Tick Mark */}
        <div 
          className={styles.readinessMarkTick} 
          style={{ left: `${passProbability}%` }} 
        />
      </div>

      {/* Labels below Segmented Bar */}
      <div className={styles.trackLabels}>
        <span className={styles.trackLabelItem} style={{ width: '50%', textAlign: 'left' }}>Not ready</span>
        <span className={styles.trackLabelItem} style={{ width: '30%', textAlign: 'center' }}>Almost</span>
        <span className={styles.trackLabelItem} style={{ width: '20%', textAlign: 'right' }}>Ready</span>
      </div>

      {/* Category Level Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', margin: 0 }}>
          By section — you need 80% (16/20) in each to pass
        </h4>

        {/* Road Signs */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
            <span>Road signs</span>
            <span style={{ color: (signsAvg !== null && signsAvg >= 80) ? '#059669' : '#d97706' }}>
              {signsAvg !== null ? `${signsAvg}%` : 'Not practiced'}
            </span>
          </div>
          <div className={styles.categoryTrack}>
            <div 
              className={`${styles.categoryFill} ${(signsAvg !== null && signsAvg >= 80) ? styles.categoryFillGreen : styles.categoryFillOrange}`}
              style={{ width: `${signsAvg ?? 0}%` }}
            />
            <div className={styles.passTick} style={{ left: '80%' }} />
          </div>
        </div>

        {/* Rules of the Road */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
            <span>Rules of the road</span>
            <span style={{ color: (rulesAvg !== null && rulesAvg >= 80) ? '#059669' : '#d97706' }}>
              {rulesAvg !== null ? `${rulesAvg}%` : 'Not practiced'}
            </span>
          </div>
          <div className={styles.categoryTrack}>
            <div 
              className={`${styles.categoryFill} ${(rulesAvg !== null && rulesAvg >= 80) ? styles.categoryFillGreen : styles.categoryFillOrange}`}
              style={{ width: `${rulesAvg ?? 0}%` }}
            />
            <div className={styles.passTick} style={{ left: '80%' }} />
          </div>
        </div>

        {/* Vertical Ticks Caption */}
        <div className={styles.passCaption}>
          {captionText}
        </div>
      </div>

      {/* Reliability Badge Container */}
      <div className={styles.reliabilityCard}>
        <div className={styles.reliabilityLeft}>
          <GaugeIcon />
          <div>
            <h5 className={styles.reliabilityTitle}>Reliability: {reliabilityText}</h5>
            <p className={styles.reliabilitySubtext}>
              Based on {practiceCount} {practiceCount === 1 ? 'test' : 'tests'} — sharpens with every test you take
            </p>
          </div>
        </div>
        <div className={styles.reliabilityBars}>
          {[...Array(5)].map((_, idx) => {
            const isActive = idx < filledSegments;
            return (
              <div 
                key={idx} 
                className={`${styles.reliabilityBar} ${isActive ? segmentColorClass : ''}`} 
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
