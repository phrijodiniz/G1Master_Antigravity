"use client";

import React, { useState } from 'react';
import { Lock, Gem, Check } from 'lucide-react';
import { TopicNode, TopicProgress, masteryTopics, getTopicState, NodeState, categoryMeta } from '@/lib/masteryConfig';
import styles from './MasteryMap.module.css';

interface MasteryMapProps {
  progress: Record<string, TopicProgress>;
  isPremium: boolean;
  onStartTopic: (topic: TopicNode, state: NodeState) => void;
  onResetTopic: (topicId: string) => void;
}

const CATEGORIES = [
  'Foundational Pass-Triggers',
  'Complex Road Operations',
  'Demerit & Penalty Zones',
  'Official Registry Simulator'
] as const;

export default function MasteryMap({ progress, isPremium, onStartTopic, onResetTopic }: MasteryMapProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Find the user's active "next" test node to display the "Next" badge overlay
  const nextTopic = masteryTopics.find((topic) => {
    if (topic.id === 'final_simulation') return false; // Simulation is final
    const state = getTopicState(topic, progress, isPremium);
    return state === 'available' || state === 'in-progress';
  });
  const nextTopicId = nextTopic?.id || null;

  return (
    <div className={styles.mapContainer}>
      {CATEGORIES.map((category) => {
        const categoryTopics = masteryTopics.filter(t => t.category === category);
        if (categoryTopics.length === 0) return null;

        const meta = categoryMeta[category];

        return (
          <div key={category} className={styles.categorySection}>
            {/* 1. Category Header Area */}
            <div className={styles.categoryHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.unitBadge}>
                  {meta.unitNumber}
                </div>
                <div className={styles.titleBlock}>
                  <h3 className={styles.categoryTitle}>{meta.name}</h3>
                  <p className={styles.categorySubtitle}>{meta.subtitle}</p>
                </div>
              </div>
              <div className={styles.headerRight}>
                <span className={styles.totalQuestionsText}>{meta.totalQuestionsLabel}</span>
              </div>
            </div>

            {/* Vertical connector line (timeline snake) running behind the nodes */}
            <div className={styles.sectionConnectorLine} />

            {/* 2. Nodes list (Desktop: Row of Cards, Mobile: Vertical list) */}
            <div className={styles.nodesWrapper}>
              {categoryTopics.map((topic, index) => {
                const topicProgress = progress[topic.id];
                const state = getTopicState(topic, progress, isPremium);
                const attempted = topicProgress?.attempted ?? 0;
                const correct = topicProgress?.correct ?? 0;
                
                const limitMax = topic.questionCount;
                const progressPercentage = Math.min(100, Math.round((attempted / limitMax) * 100));
                const accuracyPercentage = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
                const isNextNode = topic.id === nextTopicId;

                const topicIndex = masteryTopics.findIndex(t => t.id === topic.id);
                const isPremiumTopic = topicIndex >= 3;

                // Alternate connector lines alignment
                const isFirst = index === 0;
                const isLast = index === categoryTopics.length - 1;

                return (
                  <div 
                    key={topic.id} 
                    className={`${styles.nodeCard} ${styles[`card_${state}`]} ${isNextNode ? styles.cardNextActive : ''}`}
                    onClick={() => onStartTopic(topic, state)}
                    onMouseEnter={() => setActiveTooltip(topic.id)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    {/* Thumbnail Image Wrapper */}
                    <div className={styles.thumbnailWrapper}>
                      <img 
                        src={topic.image} 
                        alt={topic.name} 
                        className={styles.thumbnailImg} 
                      />
                      
                      {/* Dark overlay for locked or blocked nodes */}
                      {(state === 'premium-locked' || state === 'blocked') && (
                        <div className={styles.lockedOverlay}>
                          <Lock size={20} className={styles.lockIcon} />
                        </div>
                      )}

                      {/* Premium badge corner overlay */}
                      {isPremiumTopic && (
                        <div className={styles.premiumBadgeCorner}>
                          <Gem size={10} className={styles.premiumBadgeGem} />
                          <span>Premium</span>
                        </div>
                      )}

                      {/* Next badge overlay */}
                      {isNextNode && (
                        <div className={styles.nextOverlayBadge}>
                          Next
                        </div>
                      )}

                      {/* Radial Progress indicator on the thumbnail corners for active practice */}
                      {state === 'in-progress' && (
                        <div 
                          className={styles.miniProgressBadge}
                          style={attempted >= topic.questionCount ? { 
                            background: '#fee2e2', 
                            color: '#991b1b', 
                            borderColor: 'rgba(153, 27, 27, 0.3)' 
                          } : {}}
                        >
                          {attempted >= topic.questionCount ? `Failed (${accuracyPercentage}%)` : `${progressPercentage}%`}
                        </div>
                      )}

                      {/* Checkmark badge for mastered nodes */}
                      {state === 'mastered' && (
                        <div className={styles.masteredBadge}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className={styles.cardDetails}>
                      <div className={styles.cardTextGroup}>
                        <h4 className={styles.nodeName}>{topic.name}</h4>
                        <p className={styles.nodeCountLabel}>
                          {topic.id === 'final_simulation' ? 'Exam Simulation' : `${topic.questionCount} questions`}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Tooltip (Desktop only) */}
                    {activeTooltip === topic.id && (
                      <div className={styles.tooltip}>
                        <h4 className={styles.tooltipTitle}>{topic.name}</h4>
                        <div className={styles.tooltipStats}>
                          <div className={styles.statRow}>
                            <span>Status:</span>
                            <span className={`${styles.statusText} ${styles[`status_${state}`]}`}>
                              {state.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                          {topic.id === 'final_simulation' ? (
                            <div className={styles.statRow}>
                              <span>Simulations:</span>
                              <span>{attempted} taken</span>
                            </div>
                          ) : (
                            <div className={styles.statRow}>
                              <span>Progress:</span>
                              <span>{attempted} / {limitMax} Qs</span>
                            </div>
                          )}
                          {attempted > 0 && (
                            <div className={styles.statRow}>
                              <span>{topic.id === 'final_simulation' ? 'Pass Count' : 'Accuracy'}:</span>
                              <span>{topic.id === 'final_simulation' ? `${correct} passed` : `${accuracyPercentage}%`}</span>
                            </div>
                          )}
                        </div>

                        {attempted > 0 && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResetTopic(topic.id);
                            }}
                            className={styles.tooltipResetBtn}
                          >
                            Reset Progress
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
