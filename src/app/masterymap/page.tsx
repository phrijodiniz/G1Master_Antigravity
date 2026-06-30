"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./masterymap.module.css";
import DashboardLayout from "@/components/DashboardLayout";
import { Map } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LimitModal from "@/components/LimitModal";
import MasteryMap from "@/components/MasteryMap";
import { TopicNode, TopicProgress, masteryTopics, getTopicState, NodeState } from "@/lib/masteryConfig";
import { supabase } from "@/lib/supabaseClient";

export default function MasteryMapPage() {
    const { user, isPremium, renewalDate, loading, history } = useAuth();
    const router = useRouter();

    const [progressData, setProgressData] = useState<Record<string, TopicProgress>>({});
    const [progressLoading, setProgressLoading] = useState(true);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitVariant, setLimitVariant] = useState<'default' | 'chapter_quiz' | 'practice_limit' | 'simulation_quiz' | 'all_limit' | 'progressbar_upgrade' | 'locked_test'>('default');

    useEffect(() => {
        const fetchProgress = async () => {
            setProgressLoading(true);
            const mappedProgress: Record<string, TopicProgress> = {};
            
            // Pre-populate with all available topics as 0 progress
            masteryTopics.forEach(topic => {
                mappedProgress[topic.id] = {
                    topicId: topic.id,
                    attempted: 0,
                    correct: 0,
                    rulesAttempted: 0,
                    rulesCorrect: 0,
                    signsAttempted: 0,
                    signsCorrect: 0
                };
            });

            if (user) {
                try {
                    const { data, error } = await supabase
                        .from('user_topic_progress')
                        .select('*')
                        .eq('user_id', user.id);
                    if (data && !error) {
                        data.forEach((row: any) => {
                            const topic = masteryTopics.find(t => t.name === row.topic);
                            if (topic) {
                                mappedProgress[topic.id] = {
                                    topicId: topic.id,
                                    attempted: row.questions_attempted,
                                    correct: row.questions_correct,
                                    rulesAttempted: row.rules_attempted || 0,
                                    rulesCorrect: row.rules_correct || 0,
                                    signsAttempted: row.signs_attempted || 0,
                                    signsCorrect: row.signs_correct || 0
                                };
                            }
                        });
                    } else if (error) {
                        console.error("Error fetching database topic progress:", error);
                    }
                } catch (err) {
                    console.error("Failed to query user_topic_progress table:", err);
                }
            } else {
                // Anonymous guest user
                const localProgress = localStorage.getItem('g1_mastery_progress');
                if (localProgress) {
                    try {
                        const parsed = JSON.parse(localProgress);
                        Object.keys(parsed).forEach(topicId => {
                            if (mappedProgress[topicId]) {
                                mappedProgress[topicId] = {
                                    topicId: topicId,
                                    attempted: parsed[topicId].attempted || 0,
                                    correct: parsed[topicId].correct || 0,
                                    rulesAttempted: parsed[topicId].rulesAttempted || 0,
                                    rulesCorrect: parsed[topicId].rulesCorrect || 0,
                                    signsAttempted: parsed[topicId].signsAttempted || 0,
                                    signsCorrect: parsed[topicId].signsCorrect || 0
                                };
                            }
                        });
                    } catch (e) {
                        console.error("Error parsing local mastery progress:", e);
                    }
                }
            }

            // Map final simulation test node based on their simulation history
            if (history) {
                const simulationTests = history.filter((test: any) => 
                    test.test_type === 'Simulation' || 
                    test.test_type?.includes('Simulation') || 
                    test.test_type?.includes('Final')
                );
                const hasPassedSimulation = simulationTests.some((test: any) => test.passed);
                mappedProgress['final_simulation'] = {
                    topicId: 'final_simulation',
                    attempted: simulationTests.length,
                    correct: hasPassedSimulation ? 1 : 0,
                    rulesAttempted: 0,
                    rulesCorrect: 0,
                    signsAttempted: 0,
                    signsCorrect: 0
                };
            }

            setProgressData(mappedProgress);
            setProgressLoading(false);
        };

        if (!loading) {
            fetchProgress();
        }
    }, [user, loading, history]);

    const handleStartTopic = (topic: TopicNode, state: NodeState) => {
        if (state === 'blocked') {
            setLimitVariant('locked_test');
            setShowLimitModal(true);
            return;
        }

        if (topic.id === 'final_simulation') {
            if (state === 'premium-locked') {
                setLimitVariant('simulation_quiz');
                setShowLimitModal(true);
            } else {
                router.push('/quiz/simulation');
            }
            return;
        }

        if (state === 'premium-locked') {
            setLimitVariant('chapter_quiz');
            setShowLimitModal(true);
        } else {
            router.push(`/quiz/practice?topic=${topic.id}`);
        }
    };

    const handleResetSingleTopic = async (topicId: string) => {
        if (topicId === 'final_simulation') {
            alert("Simulation history cannot be reset individually from the Mastery Map. Please delete individual tests in your history page.");
            return;
        }
        const topic = masteryTopics.find(t => t.id === topicId);
        if (!topic) return;

        if (user) {
            try {
                await supabase
                    .from('user_topic_progress')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('topic', topic.name);
            } catch (err) {
                console.error("Failed to reset single topic progress:", err);
            }
        } else {
            const localProgress = localStorage.getItem('g1_mastery_progress');
            if (localProgress) {
                try {
                    const parsed = JSON.parse(localProgress);
                    delete parsed[topicId];
                    localStorage.setItem('g1_mastery_progress', JSON.stringify(parsed));
                } catch (e) {
                    console.error(e);
                }
            }
        }

        // Update local state
        setProgressData(prev => ({
            ...prev,
            [topicId]: {
                topicId,
                attempted: 0,
                correct: 0,
                rulesAttempted: 0,
                rulesCorrect: 0,
                signsAttempted: 0,
                signsCorrect: 0
            }
        }));
    };

    const handleResetAllProgress = async () => {
        if (window.confirm("Are you sure you want to reset all topic progress on the map?")) {
            if (user) {
                try {
                    await supabase
                        .from('user_topic_progress')
                        .delete()
                        .eq('user_id', user.id);
                } catch (err) {
                    console.error("Failed to reset all progress:", err);
                }
            } else {
                localStorage.removeItem('g1_mastery_progress');
            }

            // Reset local state to empty progress for all nodes
            const resetProgress: Record<string, TopicProgress> = {};
            masteryTopics.forEach(topic => {
                resetProgress[topic.id] = {
                    topicId: topic.id,
                    attempted: 0,
                    correct: 0,
                    rulesAttempted: 0,
                    rulesCorrect: 0,
                    signsAttempted: 0,
                    signsCorrect: 0
                };
            });
            setProgressData(resetProgress);
        }
    };

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleBlock}>
                        <h1 className={styles.title}>Mastery Map</h1>
                        <p className={styles.subtitle}>
                            Your step-by-step path to G1 readiness. Work through 11 progressive tests (divided into 4 themed milestones) using fixed-order questions to build accuracy.
                        </p>
                    </div>
                    <button className={styles.resetBtn} onClick={handleResetAllProgress}>
                        Reset Map Progress
                    </button>
                </div>

                <div className={styles.mapCard}>
                    {progressLoading ? (
                        <div className={styles.mapLoading}>Loading learning path...</div>
                    ) : (
                        <MasteryMap
                            progress={progressData}
                            isPremium={isPremium}
                            onStartTopic={handleStartTopic}
                            onResetTopic={handleResetSingleTopic}
                        />
                    )}
                </div>
            </div>

            <LimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                variant={limitVariant}
                renewalDate={renewalDate}
            />
        </DashboardLayout>
    );
}
