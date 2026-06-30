"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { masteryTopics, getTopicState, TopicProgress } from '@/lib/masteryConfig';
import { supabase } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import { Check, X } from 'lucide-react';
import styles from '../shared_quiz_layout.module.css';
import DashboardLayout from '@/components/DashboardLayout'; // Changed from Sidebar
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import ExitModal from '@/components/ExitModal';
import LimitModal from '@/components/LimitModal';
import ParentShareModal from '@/components/ParentShareModal';
import { sendGTMEvent } from '@/lib/gtm';
import PricingCardGrid from '@/components/PricingCardGrid';

import { resultsConfig } from './resultsConfig';
import ScoreRevealSection from './components/ScoreRevealSection';
import ReadinessCheckSection from './components/ReadinessCheckSection';
import StakesSection from './components/StakesSection';
import BenefitsSection from './components/BenefitsSection';
import ProofSection from './components/ProofSection';
import PricingGridSection from './components/PricingGridSection';
import StickyCtaSection from './components/StickyCtaSection';

// Countdown component removed

interface ObservedSectionProps {
  sectionId: string;
  scoreBand: string;
  creditsRemaining?: number;
  children: React.ReactNode;
}

function ObservedSection({ sectionId, scoreBand, creditsRemaining, children }: ObservedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !trackedRef.current) {
          trackedRef.current = true;
          try {
            sendGTMEvent('section_view', {
              section_id: sectionId,
              score_band: scoreBand,
              credits_remaining: creditsRemaining ?? 0
            });
            console.log('Tracked section_view:', sectionId, scoreBand, 'credits:', creditsRemaining);
          } catch (e) {
            console.error('Error sending GTM event:', e);
          }
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.3
    });

    const el = ref.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, [sectionId, scoreBand]);

  return <div ref={ref}>{children}</div>;
}

function QuizContent() {
    const { user, isPremium, practiceCredits, refreshProfile, renewalDate, loading: authLoading, history, masteryProgress, isOfferActive, offerExpiryDate } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const category = searchParams.get('category'); // e.g., "Rules of the Road"
    const topicId = searchParams.get('topic'); // e.g., "traffic_lights"
    const topicConfig = useMemo(() => topicId ? masteryTopics.find(t => t.id === topicId) : null, [topicId]);

    const [topicAttempts, setTopicAttempts] = useState<number | null>(null);
    const [topicProgressData, setTopicProgressData] = useState<any>(null);

    const [questions, setQuestions] = useState<any[]>([]);
    const [currentindex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<any[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [limitVariant, setLimitVariant] = useState<'practice_limit' | 'all_limit' | 'chapter_quiz' | 'locked_test'>('practice_limit');
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [resultSaved, setResultSaved] = useState(false);
    const [savedRecord, setSavedRecord] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load Mastery Map progress for this topic
    useEffect(() => {
        if (!topicConfig) return;

        const loadProgress = async () => {
            let attempts = 0;
            let correct = 0;

            const mappedProgress: Record<string, TopicProgress> = {};
            // Pre-populate with all available topics as 0 progress
            masteryTopics.forEach(t => {
                mappedProgress[t.id] = {
                    topicId: t.id,
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
                    }
                } catch (err) {
                    console.error("Failed to query user_topic_progress table:", err);
                }
            } else {
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

            const currentProg = mappedProgress[topicConfig.id];
            if (currentProg) {
                attempts = currentProg.attempted;
                correct = currentProg.correct;
                setTopicProgressData(currentProg);
            }
            
            setTopicAttempts(attempts);
            setScore(correct);

            // Determine if this topic is unlocked
            const state = getTopicState(topicConfig, mappedProgress, isPremium);

            if (state === 'premium-locked') {
                setLimitVariant('chapter_quiz');
                setShowLimitModal(true);
            } else if (state === 'blocked') {
                setLimitVariant('locked_test');
                setShowLimitModal(true);
            }
        };

        if (!authLoading) {
            loadProgress();
        }
    }, [user, authLoading, topicConfig, isPremium, router]);

    // Initialize currentIndex to topicAttempts for topic-specific study
    useEffect(() => {
        if (topicConfig && questions.length > 0 && topicAttempts !== null) {
            if (topicAttempts >= questions.length) {
                setCompleted(true);
                setCurrentIndex(0); // Safely point to first question to avoid out of bounds in render lifecycle
            } else {
                setCurrentIndex(topicAttempts);
                setCompleted(false);
            }
        }
    }, [topicConfig, questions, topicAttempts]);

    const handleResetProgress = async () => {
        if (!topicConfig) return;
        setLoading(true);
        if (user) {
            await supabase
                .from('user_topic_progress')
                .delete()
                .eq('user_id', user.id)
                .eq('topic', topicConfig.name);
        } else {
            const localProgress = localStorage.getItem('g1_mastery_progress');
            if (localProgress) {
                try {
                    const parsed = JSON.parse(localProgress);
                    delete parsed[topicConfig.id];
                    localStorage.setItem('g1_mastery_progress', JSON.stringify(parsed));
                } catch (e) {
                    console.error(e);
                }
            }
        }
        setTopicAttempts(0);
        setQuestions([]);
        setCurrentIndex(0);
        setScore(0);
        setUserAnswers([]);
        setCompleted(false);
        setResultSaved(false);
        // re-fetch questions
        const { data } = await supabase
            .from('questions')
            .select('*')
            .in('chapter', topicConfig.dbChapters)
            .order('created_at', { ascending: true })
            .order('id', { ascending: true });
        const sliced = data ? data.slice(topicConfig.questionStartIndex, topicConfig.questionStartIndex + topicConfig.questionCount) : [];
        setQuestions(sliced);
        setLoading(false);
    };

    const handleShareWithParent = async () => {
        if (!user) {
            alert("Please log in again.");
            return;
        }
        setIsSharing(true);
        import('@/lib/gtm').then(({ sendGTMEvent }) => {
            sendGTMEvent('begin_checkout', { source: 'practice_results_exhausted_share' });
        });
        try {
            const shareLink = `${window.location.origin}/parents/pay?userId=${user.id}`;
            setShareUrl(shareLink);
            setIsShareOpen(true);
        } catch (err) {
            console.error(err);
            alert("Error generating checkout link.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleSelectTier = async (tier: '2_weeks' | '30_days' | 'lifetime') => {
        sendGTMEvent('begin_checkout', { source: `practice_results_exhausted_${tier}` });
        setIsUpgrading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Please log in again.");
                setIsUpgrading(false);
                return;
            }

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ tier, source: 'practice_results_exhausted' })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error(err);
            alert("Error initiating checkout.");
            setIsUpgrading(false);
        }
    };

    // Compute motivational quote
    const motivationQuote = useMemo(() => {
        if (!completed || questions.length === 0) return "";
        const percentage = (score / questions.length) * 100;

        let texts = [];
        if (percentage <= 40) {
            texts = [
                "Good news: improvement happens fast with practice."
            ];
        } else if (percentage <= 60) {
            texts = [
                "You’re halfway there — keep the momentum going.",
                "A few small improvements can make a big difference.",
                "Try again now and push it higher."
            ];
        } else if (percentage <= 80) {
            texts = [
                "You’re just a couple of questions away from passing.",
                "Close, but close doesn’t pass the real G1.",
                "A few more attempts could push you over the line."
            ];
        } else if (percentage < 100) {
            texts = [
                "Strong score. Can you make it consistent?",
                "That’s impressive. Can you do it again?",
                "That’s what almost test-ready looks like!"
            ];
        } else {
            texts = [
                "Perfect score. Can you do it again?",
                "That’s what test-ready looks like. Think you can repeat it?",
                "Prove it wasn’t luck and take another one."
            ];
        }

        return texts[Math.floor(Math.random() * texts.length)];
    }, [completed, score, questions.length]);

    // ===== NEW READINESS CALCULATION (Option A: Question-Volume Weighted Accuracy) =====
    // Aggregate question-level data from ALL study modes for the quiz results page
    const readinessStats = useMemo(() => {
        // 1. Mastery Map totals
        let masteryTotalAttempted = 0, masteryTotalCorrect = 0;
        let masteryRulesAttempted = 0, masteryRulesCorrect = 0;
        let masterySignsAttempted = 0, masterySignsCorrect = 0;

        // Copy the masteryProgress from auth
        const localMasteryProgress = { ...(masteryProgress || {}) };

        // If we just finished a topicConfig, overlay the updated numbers
        if (topicConfig) {
            const sessionCorrectCount = userAnswers.filter(a => a.isCorrect).length;
            
            const sessionRulesAttempted = userAnswers.filter(a => a.question?.category === 'Rules of the Road').length;
            const sessionRulesCorrect = userAnswers.filter(a => a.question?.category === 'Rules of the Road' && a.isCorrect).length;
            const sessionSignsAttempted = userAnswers.filter(a => a.question?.category === 'Road Signs').length;
            const sessionSignsCorrect = userAnswers.filter(a => a.question?.category === 'Road Signs' && a.isCorrect).length;

            const prevRulesAttempted = topicProgressData?.rulesAttempted || topicProgressData?.rules_attempted || 0;
            const prevRulesCorrect = topicProgressData?.rulesCorrect || topicProgressData?.rules_correct || 0;
            const prevSignsAttempted = topicProgressData?.signsAttempted || topicProgressData?.signs_attempted || 0;
            const prevSignsCorrect = topicProgressData?.signsCorrect || topicProgressData?.signs_correct || 0;

            localMasteryProgress[topicConfig.name] = {
                attempted: (topicAttempts || 0) + userAnswers.length,
                correct: (topicProgressData?.questions_correct || topicProgressData?.correct || 0) + sessionCorrectCount,
                rulesAttempted: prevRulesAttempted + sessionRulesAttempted,
                rulesCorrect: prevRulesCorrect + sessionRulesCorrect,
                signsAttempted: prevSignsAttempted + sessionSignsAttempted,
                signsCorrect: prevSignsCorrect + sessionSignsCorrect
            };
        }

        Object.values(localMasteryProgress).forEach((tp: any) => {
            masteryTotalAttempted += tp.attempted || 0;
            masteryTotalCorrect += tp.correct || 0;
            masteryRulesAttempted += tp.rulesAttempted || 0;
            masteryRulesCorrect += tp.rulesCorrect || 0;
            masterySignsAttempted += tp.signsAttempted || 0;
            masterySignsCorrect += tp.signsCorrect || 0;
        });

        // 2. Practice/Simulations totals
        let practiceTotalAttempted = 0, practiceTotalCorrect = 0;
        let practiceRulesAttempted = 0, practiceRulesCorrect = 0;
        let practiceSignsAttempted = 0, practiceSignsCorrect = 0;

        const currentScorePercent = completed && questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
        let currentRulesScoreVal = 0;
        let currentSignsScoreVal = 0;
        if (completed && questions.length > 0) {
            currentRulesScoreVal = userAnswers.filter(a => a?.question?.category === 'Rules of the Road' && a.isCorrect).length;
            currentSignsScoreVal = userAnswers.filter(a => a?.question?.category === 'Road Signs' && a.isCorrect).length;
        }

        const currentTest = {
            test_type: category,
            score: currentScorePercent,
            rules_score: category === 'Rules of the Road' ? score : (category === 'Mixed Practice' ? currentRulesScoreVal : 0),
            signs_score: category === 'Road Signs' ? score : (category === 'Mixed Practice' ? currentSignsScoreVal : 0)
        };

        const historyList = history || [];
        const isAlreadySaved = savedRecord && historyList.some((item: any) => item.id === savedRecord.id);
        const combinedHistory = (isAlreadySaved || !category || topicConfig) ? historyList : [currentTest, ...historyList];

        combinedHistory.forEach((test: any) => {
            if (test.test_type === 'Rules of the Road') {
                practiceTotalAttempted += 10;
                practiceTotalCorrect += Math.round((test.score / 100) * 10);
                practiceRulesAttempted += 10;
                practiceRulesCorrect += test.rules_score || Math.round((test.score / 100) * 10);
            } else if (test.test_type === 'Road Signs') {
                practiceTotalAttempted += 10;
                practiceTotalCorrect += Math.round((test.score / 100) * 10);
                practiceSignsAttempted += 10;
                practiceSignsCorrect += test.signs_score || Math.round((test.score / 100) * 10);
            } else if (test.test_type === 'Mixed Practice') {
                practiceTotalAttempted += 10;
                practiceTotalCorrect += Math.round((test.score / 100) * 10);
                practiceRulesAttempted += 5;
                practiceRulesCorrect += test.rules_score || 0;
                practiceSignsAttempted += 5;
                practiceSignsCorrect += test.signs_score || 0;
            } else if (test.test_type === 'Simulation') {
                practiceTotalAttempted += 40;
                practiceTotalCorrect += Math.round((test.score / 100) * 40);
                practiceRulesAttempted += 20;
                practiceRulesCorrect += test.rules_score || 0;
                practiceSignsAttempted += 20;
                practiceSignsCorrect += test.signs_score || 0;
            }
        });

        const totalAttempted = masteryTotalAttempted + practiceTotalAttempted;
        const totalCorrect = masteryTotalCorrect + practiceTotalCorrect;
        const overallAccuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
        const volumeWeight = Math.min(totalAttempted / 500, 1.0);
        const computedPassProb = totalAttempted > 0
            ? Math.round(40 + (overallAccuracy * 50) * volumeWeight)
            : 40;

        const totalRulesAttempted = masteryRulesAttempted + practiceRulesAttempted;
        const totalRulesCorrect = masteryRulesCorrect + practiceRulesCorrect;
        const totalSignsAttempted = masterySignsAttempted + practiceSignsAttempted;
        const totalSignsCorrect = masterySignsCorrect + practiceSignsCorrect;

        const rulesAvg = totalRulesAttempted > 0
            ? Math.round((totalRulesCorrect / totalRulesAttempted) * 100)
            : null;
        const signsAvg = totalSignsAttempted > 0
            ? Math.round((totalSignsCorrect / totalSignsAttempted) * 100)
            : null;

        return { rulesAvg, signsAvg, passProbability: computedPassProb, totalAttempted };
    }, [completed, score, questions.length, history, category, savedRecord, userAnswers, topicConfig, masteryProgress, topicAttempts, topicProgressData]);

    const { rulesAvg, signsAvg, passProbability, totalAttempted } = readinessStats;

    const STORAGE_KEY = `practice_session_${category}`;

    // Auth & Init
    useEffect(() => {
        if (authLoading) return; // Wait until the profile is fetched

        if (!user) {
            setShowLoginModal(true);
            setLoading(false);
        } else {
            setShowLoginModal(false);
            if (questions.length === 0 && !completed) {
                fetchQuestions();
            }
        }
    }, [user, category, authLoading, questions.length, completed]);

    async function fetchQuestions() {
        if (!category && !topicConfig) return;
        setLoading(true);

        // Check credits only for normal category practice
        if (!topicConfig && !isPremium && (practiceCredits ?? 0) <= 0) {
            setLoading(false);
            setLimitVariant('practice_limit');
            setShowLimitModal(true);
            return;
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && !topicConfig) {
            try {
                const parsed = JSON.parse(saved);
                if (Date.now() - parsed.timestamp < 3600000) {
                    setQuestions(parsed.questions);
                    setCurrentIndex(parsed.currentindex);
                    setScore(parsed.score);
                    setUserAnswers(parsed.userAnswers);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error(e);
            }
        }

        // Handle Topic-specific practice
        if (topicConfig) {
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .in('chapter', topicConfig.dbChapters)
                .order('created_at', { ascending: true })
                .order('id', { ascending: true }); // Fixed, stable order
            
            if (error || !data) {
                console.error("Error fetching topic questions:", error);
                setQuestions([]);
            } else {
                const sliced = data.slice(topicConfig.questionStartIndex, topicConfig.questionStartIndex + topicConfig.questionCount);
                setQuestions(sliced);
            }
            setLoading(false);
            return;
        }

        if (category === 'Mixed Practice') {
            const { data: rulesData } = await supabase.rpc('get_random_questions', {
                limit_count: 5,
                category_filter: 'Rules of the Road'
            });
            const { data: signsData } = await supabase.rpc('get_random_questions', {
                limit_count: 5,
                category_filter: 'Road Signs'
            });
            
            let finalQuestions = [...(rulesData || []), ...(signsData || [])];
            
            if (finalQuestions.length < 10) {
                const { data: fallbackRules } = await supabase.from('questions').select('*').eq('category', 'Rules of the Road').limit(5);
                const { data: fallbackSigns } = await supabase.from('questions').select('*').eq('category', 'Road Signs').limit(5);
                finalQuestions = [...(fallbackRules || []), ...(fallbackSigns || [])];
            }
            
            const shuffled = finalQuestions.sort(() => Math.random() - 0.5);
            setQuestions(shuffled);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.rpc('get_random_questions', {
            limit_count: 10,
            category_filter: category
        });
        if (error || !data) {
            const { data: fallback } = await supabase.from('questions').select('*').eq('category', category).limit(10);
            setQuestions(fallback || []);
        } else {
            setQuestions(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (!loading && questions.length > 0 && !completed) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                timestamp: Date.now(),
                questions, currentindex, score, userAnswers
            }));
        } else if (completed) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [questions, currentindex, score, userAnswers, loading, completed]);

    // Save Result to DB on completion

    useEffect(() => {
        if (topicConfig) return; // Do not save topic study quizzes to simulation_results
        if (completed && user && !resultSaved && questions.length > 0) {
            setResultSaved(true); // Prevent double save
            setIsSaving(true);
            const saveToDB = async () => {
                let rulesScoreDb = 0;
                let signsScoreDb = 0;
                let isPassed = false;
                
                if (category === 'Rules of the Road') {
                    rulesScoreDb = score;
                    isPassed = score >= 8;
                } else if (category === 'Road Signs') {
                    signsScoreDb = score;
                    isPassed = score >= 8;
                } else if (category === 'Mixed Practice') {
                    rulesScoreDb = userAnswers.filter(a => a?.question?.category === 'Rules of the Road' && a.isCorrect).length;
                    signsScoreDb = userAnswers.filter(a => a?.question?.category === 'Road Signs' && a.isCorrect).length;
                    isPassed = rulesScoreDb >= 4 && signsScoreDb >= 4;
                } else {
                    isPassed = Math.round((score / questions.length) * 100) >= 80;
                }

                const payload = {
                    user_id: user.id,
                    score: Math.round((score / questions.length) * 100),
                    rules_score: rulesScoreDb,
                    signs_score: signsScoreDb,
                    passed: isPassed,
                    test_type: category || 'Practice'
                };
                console.log('Attempting to save result:', payload);
                const { data, error } = await supabase.from('simulation_results').insert(payload).select();

                if (error) {
                    console.error('Error saving result:', error);
                    alert('Error saving result: ' + error.message);
                } else {
                    console.log('Result saved successfully:', data);
                    if (data && data.length > 0) {
                        setSavedRecord(data[0]);
                    }

                    try {
                        const scorePercent = Math.round((score / questions.length) * 100);
                        fetch('/api/activity', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                eventData: [
                                    new Date().toISOString(),
                                    user.email || 'unknown_email',
                                    user.user_metadata?.first_name || 'unknown_name',
                                    `Practice (${category}) Completed - Score: ${scorePercent}%`
                                ]
                            })
                        });
                    } catch (sheetError) {
                        console.error("Failed to append activity to sheet", sheetError);
                    }

                    // Consume Credit (Implicit) & Refresh History
                    await refreshProfile(true);
                }
                setIsSaving(false);
            };
            saveToDB();
        }
    }, [completed, user, category, score, questions.length, isPremium, refreshProfile]);

    // Scroll depth tracking on credit-exhausted results page
    useEffect(() => {
        if (!completed || questions.length === 0) return;
        const hasCredits = isPremium || (practiceCredits !== null && practiceCredits !== undefined && practiceCredits > 0);
        if (hasCredits) return;

        let trackedPercentages: number[] = [];

        const handleScrollTracking = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight <= 0) return;
            const scrollTop = window.scrollY;
            const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);

            const milestones = [25, 50, 75, 90];

            // Compute score band
            const percent = Math.round((score / questions.length) * 100);
            const scoreBand = percent >= 80 ? 'passing' : percent >= 60 ? 'borderline' : 'failing';

            milestones.forEach((milestone) => {
                if (scrollPercentage >= milestone && !trackedPercentages.includes(milestone)) {
                    trackedPercentages.push(milestone);
                    import('@/lib/gtm').then(({ sendGTMEvent }) => {
                        sendGTMEvent('scroll_depth', {
                            percentage: milestone,
                            page: 'practice_results',
                            score_band: scoreBand,
                            credits_remaining: 0
                        });
                    });
                    console.log('Tracked scroll_depth:', milestone, 'practice_results', scoreBand);
                }
            });
        };

        window.addEventListener('scroll', handleScrollTracking);
        // Fire initially in case the user has already scrolled
        handleScrollTracking();

        return () => window.removeEventListener('scroll', handleScrollTracking);
    }, [completed, questions.length, isPremium, practiceCredits, score]);

    const handleNext = async (wasCorrect: boolean, selectedIndex: number) => {
        const nextIndex = currentindex + 1;
        if (wasCorrect) setScore(p => p + 1);
        
        const updatedAnswers = [...userAnswers, {
            question: questions[currentindex],
            selectedIndex,
            isCorrect: wasCorrect
        }];
        setUserAnswers(updatedAnswers);

        // Record question attempt in database for authenticated users
        if (user) {
            supabase.from('question_responses').insert({
                user_id: user.id,
                question_id: questions[currentindex].id,
                is_correct: wasCorrect
            }).then(({ error }) => {
                if (error) console.error("Error saving question response:", error);
            });
        }

        if (topicConfig && topicAttempts !== null) {
            const newAttempted = topicAttempts + updatedAnswers.length;
            const sessionCorrectCount = updatedAnswers.filter(a => a.isCorrect).length;
            const newCorrect = (topicProgressData?.questions_correct || topicProgressData?.correct || 0) + sessionCorrectCount;
            
            // Compute per-category breakdowns for this session
            const sessionRulesAttempted = updatedAnswers.filter(a => a.question?.category === 'Rules of the Road').length;
            const sessionRulesCorrect = updatedAnswers.filter(a => a.question?.category === 'Rules of the Road' && a.isCorrect).length;
            const sessionSignsAttempted = updatedAnswers.filter(a => a.question?.category === 'Road Signs').length;
            const sessionSignsCorrect = updatedAnswers.filter(a => a.question?.category === 'Road Signs' && a.isCorrect).length;

            const prevRulesAttempted = topicProgressData?.rulesAttempted || topicProgressData?.rules_attempted || 0;
            const prevRulesCorrect = topicProgressData?.rulesCorrect || topicProgressData?.rules_correct || 0;
            const prevSignsAttempted = topicProgressData?.signsAttempted || topicProgressData?.signs_attempted || 0;
            const prevSignsCorrect = topicProgressData?.signsCorrect || topicProgressData?.signs_correct || 0;

            const newRulesAttempted = prevRulesAttempted + sessionRulesAttempted;
            const newRulesCorrect = prevRulesCorrect + sessionRulesCorrect;
            const newSignsAttempted = prevSignsAttempted + sessionSignsAttempted;
            const newSignsCorrect = prevSignsCorrect + sessionSignsCorrect;

            // Save to DB or localStorage
            if (user) {
                await supabase.from('user_topic_progress').upsert({
                    user_id: user.id,
                    topic: topicConfig.name,
                    questions_attempted: newAttempted,
                    questions_correct: newCorrect,
                    rules_attempted: newRulesAttempted,
                    rules_correct: newRulesCorrect,
                    signs_attempted: newSignsAttempted,
                    signs_correct: newSignsCorrect,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,topic'
                });
            } else {
                const localProgress = localStorage.getItem('g1_mastery_progress') || '{}';
                try {
                    const parsed = JSON.parse(localProgress);
                    parsed[topicConfig.id] = {
                        attempted: newAttempted,
                        correct: newCorrect,
                        rulesAttempted: newRulesAttempted,
                        rulesCorrect: newRulesCorrect,
                        signsAttempted: newSignsAttempted,
                        signsCorrect: newSignsCorrect
                    };
                    localStorage.setItem('g1_mastery_progress', JSON.stringify(parsed));
                } catch (e) {
                    console.error(e);
                }
            }

            // Paywall gating check
            const topicIndex = masteryTopics.findIndex(t => t.id === topicConfig.id);
            if (!isPremium && topicIndex >= 3 && newAttempted >= 10) {
                setLimitVariant('chapter_quiz');
                setShowLimitModal(true);
                return;
            }
        }

        if (nextIndex < questions.length) {
            setCurrentIndex(nextIndex);
        } else {
            setCompleted(true);
            if (topicConfig) {
                refreshProfile(true);
            }
        }
    };

    const [showExitModal, setShowExitModal] = useState(false);

    const handleExitClick = () => {
        setShowExitModal(true);
    };

    const confirmExit = () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = '/practice'; // Go back to selection
    };

    const handleRetake = (targetCategory: string) => {
        if (isPremium || (practiceCredits && practiceCredits > 0)) {
            localStorage.removeItem(STORAGE_KEY);
            setSavedRecord(null);
            if (targetCategory !== category) {
                window.location.href = `/quiz/practice?category=${encodeURIComponent(targetCategory)}`;
            } else {
                setQuestions([]);
                setCurrentIndex(0);
                setScore(0);
                setUserAnswers([]);
                setCompleted(false);
                setShowReview(false);
                setResultSaved(false);
            }
        } else {
            setLimitVariant('all_limit');
            setShowLimitModal(true);
        }
    };

    // --- Renders ---

    if (showLimitModal && !completed) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem', color: '#64748b' }}>Checking eligibility...</div>
            </div>
            <LimitModal
                isOpen={true}
                onClose={() => {
                    setShowLimitModal(false);
                    if (limitVariant === 'locked_test') {
                        router.push('/masterymap');
                    }
                }}
                variant={limitVariant}
                renewalDate={renewalDate}
            />
        </DashboardLayout>
    );

    if (loading) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem', color: '#64748b' }}>Loading questions...</div>
            </div>
        </DashboardLayout>
    );

    if (!user) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <LoginModal isOpen={true} onClose={() => setShowLoginModal(false)} />
            </div>
        </DashboardLayout>
    );

    if (error || (questions.length === 0)) return (
        <DashboardLayout>
            <div className={styles.contentWrapper}>
                <div style={{ padding: '2rem' }}>No questions found for {category}.</div>
            </div>
        </DashboardLayout>
    );

    if (completed) {
        if (topicConfig) {
            const scorePercent = Math.round((score / questions.length) * 100);
            const isPassed = scorePercent >= 80;

            return (
                <DashboardLayout>
                    <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            {isPassed ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#d1fae5', color: '#065f46', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <Check size={14} strokeWidth={3} />
                                    <span>Passed</span>
                                </div>
                            ) : (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fee2e2', color: '#991b1b', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <X size={14} strokeWidth={3} />
                                    <span>Failed</span>
                                </div>
                            )}
                        </div>

                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                            {isPassed ? '🏆 Test Level Cleared!' : '😢 Practice Score Failed'}
                        </h2>
                        
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: isPassed ? '#059669' : '#dc2626', margin: '1rem 0' }}>
                            {score} / {questions.length}
                        </div>

                        <p style={{ color: '#475569', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: '1.5' }}>
                            {isPassed 
                                ? `Congratulations! You scored ${scorePercent}% and cleared the 80% passing mark on the ${topicConfig.name} test level.` 
                                : `You scored ${scorePercent}%, which is below the 80% passing mark. Please practice again to unlock the next level.`}
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {isPassed && (
                                <button 
                                    onClick={() => router.push('/masterymap')}
                                    style={{ background: '#e1ff21', color: '#000000', border: '1px solid #e1ff21', padding: '1rem 2rem', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 255, 33, 0.25)' }}
                                >
                                    ➡️ Move to Next Test
                                </button>
                            )}
                            <button 
                                onClick={handleResetProgress}
                                style={{ background: '#0f172a', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                            >
                                🔄 Practice Again (Reset Progress)
                            </button>
                            <button 
                                onClick={() => router.push('/masterymap')}
                                style={{ background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', padding: '1rem 2rem', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                            >
                                Back to Mastery Map
                            </button>
                        </div>
                    </div>
                </DashboardLayout>
            );
        }

        // Results
        const hasCredits = isPremium || (practiceCredits !== null && practiceCredits !== undefined && practiceCredits > 0);
        const nextCategory = category === 'Rules of the Road' ? 'Road Signs' : 'Rules of the Road';

        const displayRenewal = renewalDate || (() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d;
        })();
        const formattedRenewal = displayRenewal.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });

        // Compute scores
        let rulesScoreVal = 0;
        let signsScoreVal = 0;
        if (category === 'Rules of the Road') {
            rulesScoreVal = score;
        } else if (category === 'Road Signs') {
            signsScoreVal = score;
        } else if (category === 'Mixed Practice') {
            rulesScoreVal = userAnswers.filter(a => a?.question?.category === 'Rules of the Road' && a.isCorrect).length;
            signsScoreVal = userAnswers.filter(a => a?.question?.category === 'Road Signs' && a.isCorrect).length;
        }

        const percentage = Math.round((score / questions.length) * 100);
        let scoreBand: 'passing' | 'borderline' | 'failing' = 'failing';
        if (percentage >= 80) {
            scoreBand = 'passing';
        } else if (percentage >= 60) {
            scoreBand = 'borderline';
        } else {
            scoreBand = 'failing';
        }

        const bandConfig = resultsConfig.scoreBands[scoreBand];

        const currentTestTmp = { test_type: category };
        const historyListTmp = history || [];
        const isAlreadySavedTmp = savedRecord && historyListTmp.some((item: any) => item.id === savedRecord.id);
        const combinedHistoryTmp = isAlreadySavedTmp ? historyListTmp : [currentTestTmp, ...historyListTmp];
        const practiceHistoryCount = combinedHistoryTmp.filter(
            (test: any) => test.test_type === 'Rules of the Road' || test.test_type === 'Road Signs' || test.test_type === 'Mixed Practice'
        ).length;

        const showTeaser = !isPremium && resultsConfig.toggles.showEarlyBenefitsTeaser && (practiceHistoryCount === 1 || practiceHistoryCount === 2);

        if (!hasCredits) {
            return (
                <DashboardLayout>
                    <div className={styles.mainWrapper} style={{ paddingBottom: '120px' }}>
                        {resultsConfig.sectionsOrder.map((sectionId) => {
                            let component: React.ReactNode = null;
                            if (sectionId === 'score') {
                                component = (
                                    <ScoreRevealSection
                                        score={score}
                                        totalQuestions={questions.length}
                                        rulesScore={rulesScoreVal}
                                        signsScore={signsScoreVal}
                                        band={scoreBand}
                                        config={bandConfig}
                                    />
                                );
                            } else if (sectionId === 'readiness') {
                                component = (
                                    <ReadinessCheckSection
                                        rulesAvg={rulesAvg}
                                        signsAvg={signsAvg}
                                        passProbability={passProbability}
                                        showWeakestName={resultsConfig.toggles.showWeakestSectionName}
                                        totalQuestionsAnswered={totalAttempted}
                                    />
                                );
                            } else if (sectionId === 'stakes') {
                                if (resultsConfig.toggles.showStakes) {
                                    component = (
                                        <StakesSection
                                            band={scoreBand}
                                            config={bandConfig}
                                        />
                                    );
                                }
                            } else if (sectionId === 'benefits') {
                                component = (
                                    <BenefitsSection
                                        band={scoreBand}
                                        config={bandConfig}
                                    />
                                );
                            } else if (sectionId === 'proof') {
                                if (resultsConfig.toggles.showProof) {
                                    component = <ProofSection />;
                                }
                            } else if (sectionId === 'pricing') {
                                component = (
                                    <PricingGridSection
                                        pricing={resultsConfig.pricing}
                                        onSelectTier={handleSelectTier}
                                        isSubmitting={isUpgrading}
                                    />
                                );
                            }

                            if (!component) return null;

                            return (
                                <ObservedSection key={sectionId} sectionId={sectionId} scoreBand={scoreBand}>
                                    {component}
                                </ObservedSection>
                            );
                        })}

                        {/* Extra non-sticky standard options for conversion landing page */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
                            <button
                                onClick={handleShareWithParent}
                                disabled={isSharing}
                                className={styles.parentPayBtn}
                                style={{ width: '100%' }}
                            >
                                {isSharing ? 'Generating link...' : '🔗 Ask Parent to Pay (Share Link)'}
                            </button>
                            
                            <button
                                onClick={() => {
                                    setLimitVariant('all_limit');
                                    setShowLimitModal(true);
                                }}
                                className={styles.lockedBtn}
                                style={{ width: '100%' }}
                            >
                                🔒 Retake {category} Test (0 Credits)
                            </button>
                            
                            <div
                                onClick={() => setShowReview(!showReview)}
                                style={{
                                    marginTop: '1rem',
                                    color: '#64748b',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    textAlign: 'center',
                                    userSelect: 'none'
                                }}
                            >
                                {showReview ? 'Hide My Answers' : 'Review My Answers'}
                            </div>
                        </div>

                        {/* Answers Review Section */}
                        {showReview && (
                            <div className={styles.reviewSection}>
                                <h2 style={{ paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>Review Answers</h2>
                                {userAnswers.map((ans, idx) => (
                                    <div key={idx} className={styles.reviewCard} style={{ borderLeft: `4px solid ${ans.isCorrect ? '#22c55e' : '#ef4444'}` }}>
                                        <h3 style={{ marginBottom: '1rem' }}>{idx + 1}. {ans.question.text}</h3>
                                        {ans.question.media_url && <img src={ans.question.media_url} style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }} />}

                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            {ans.question.options.map((opt: string, optIdx: number) => {
                                                let color = 'inherit';
                                                let weight = 'normal';
                                                if (optIdx === ans.question.correct_index) { color = '#15803d'; weight = '700'; }
                                                else if (optIdx === ans.selectedIndex && !ans.isCorrect) { color = '#b91c1c'; }

                                                return (
                                                    <div key={optIdx} style={{ color, fontWeight: weight }}>
                                                        {optIdx === ans.selectedIndex && (ans.isCorrect ? '✅ ' : '❌ ')}
                                                        {opt} {optIdx === ans.question.correct_index && optIdx !== ans.selectedIndex && '(Correct Answer)'}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <StickyCtaSection
                        onShareParent={handleShareWithParent}
                        onShowLimits={() => {
                            setLimitVariant('all_limit');
                            setShowLimitModal(true);
                        }}
                        category={category || ''}
                        nextCategory={nextCategory}
                        isSharing={isSharing}
                    />

                    <LimitModal
                        isOpen={showLimitModal}
                        onClose={() => {
                            setShowLimitModal(false);
                            if (limitVariant === 'locked_test') {
                                router.push('/masterymap');
                            }
                        }}
                        variant={limitVariant}
                        renewalDate={renewalDate}
                    />
                    
                    <ParentShareModal 
                        isOpen={isShareOpen}
                        onClose={() => setIsShareOpen(false)}
                        checkoutUrl={shareUrl}
                        isPromoActive={isOfferActive}
                    />
                </DashboardLayout>
            );
        }

        return (
            <DashboardLayout>
                <div className={styles.mainWrapper}>
                    <div className={styles.resultsContainer}>
                        <div style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500, marginBottom: '1rem' }}>
                            Score
                        </div>
                        <div style={{ fontSize: '5rem', fontWeight: 800, color: '#e1ff21', WebkitTextStroke: '2.5px black', lineHeight: 1 }}>
                            {score}/{questions.length}
                        </div>

                        {/* Status badge based on pass probability / score readiness */}
                        <div style={{ marginTop: '1.5rem', marginBottom: '0.2rem' }}>
                            {passProbability >= 80 ? (
                                <div className={`${styles.riskBadge} ${styles.riskBadgeReady}`} style={{ marginBottom: '0px' }}>
                                    <span className={`${styles.riskDot} ${styles.riskDotReady}`} />
                                    <span>G1 Ready ({passProbability}% Pass Probability)</span>
                                </div>
                            ) : (
                                <div className={`${styles.riskBadge} ${styles.riskBadgeNotReady}`} style={{ marginBottom: '0px' }}>
                                    <span>Not Test Ready ({100 - passProbability}% Failure Risk*)</span>
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem', fontWeight: 500 }}>
                            *Calculated based on your rolling average across all tests
                        </div>

                        {/* Double-80% Ontario warning */}
                        <div className={styles.doubleTrapBox}>
                            <div className={styles.doubleTrapTitle}>
                                ⚠️ Ontario G1 Separate Passing Requirement
                            </div>
                            <p className={styles.doubleTrapText}>
                                The official Ontario G1 exam requires scoring at least <strong>80% on Rules of the Road</strong> AND <strong>80% on Road Signs</strong> separately to pass. If you fail either section, you fail the whole test. Practice until both categories show safe margins.
                            </p>
                        </div>

                        <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0f172a', margin: '1.5rem 0' }}>
                            {motivationQuote}
                        </p>

                        <div className={styles.ctaStack}>
                            <button
                                onClick={() => handleRetake(category as string)}
                                disabled={isSaving}
                                style={{
                                    width: '100%',
                                    background: isSaving ? '#94a3b8' : '#0f172a', color: 'white', padding: '1rem',
                                    borderRadius: '8px', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem'
                                }}
                            >
                                {isSaving ? 'Processing...' : `Retake ${category} Test`}
                            </button>
                            {isPremium && (
                                <button
                                    onClick={() => {
                                        handleRetake(nextCategory);
                                    }}
                                    disabled={isSaving}
                                    style={{
                                        width: '100%',
                                        background: 'white', color: isSaving ? '#cbd5e1' : '#0f172a', padding: '1rem',
                                        borderRadius: '8px', border: '1px solid #e2e8f0', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem'
                                    }}
                                >
                                    Take {nextCategory} Test
                                </button>
                            )}
                            
                            <div
                                onClick={() => setShowReview(!showReview)}
                                style={{
                                    marginTop: '0.5rem',
                                    color: '#64748b',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '1rem',
                                    userSelect: 'none'
                                }}
                            >
                                {showReview ? 'Hide My Answers' : 'Review My Answers'}
                            </div>
                        </div>
                    </div>

                    {showTeaser && (
                        <ObservedSection 
                            sectionId="early_teaser_benefits" 
                            scoreBand={scoreBand} 
                            creditsRemaining={practiceCredits ?? undefined}
                        >
                            <BenefitsSection 
                                band={scoreBand} 
                                config={bandConfig} 
                                fullWidth={true}
                                onCtaClick={() => {
                                    setLimitVariant('practice_limit');
                                    setShowLimitModal(true);
                                    sendGTMEvent('teaser_cta_click', {
                                        test_number: practiceHistoryCount,
                                        credits_remaining: practiceCredits
                                    });
                                }}
                            />
                        </ObservedSection>
                    )}

                    {showReview && (
                        <div className={styles.reviewSection}>
                            <h2 style={{ paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>Review Answers</h2>
                            {userAnswers.map((ans, idx) => (
                                <div key={idx} className={styles.reviewCard} style={{ borderLeft: `4px solid ${ans.isCorrect ? '#22c55e' : '#ef4444'}` }}>
                                    <h3 style={{ marginBottom: '1rem' }}>{idx + 1}. {ans.question.text}</h3>
                                    {ans.question.media_url && <img src={ans.question.media_url} style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }} />}

                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {ans.question.options.map((opt: string, optIdx: number) => {
                                            let color = 'inherit';
                                            let weight = 'normal';
                                            if (optIdx === ans.question.correct_index) { color = '#15803d'; weight = '700'; }
                                            else if (optIdx === ans.selectedIndex && !ans.isCorrect) { color = '#b91c1c'; }

                                            return (
                                                <div key={optIdx} style={{ color, fontWeight: weight }}>
                                                    {optIdx === ans.selectedIndex && (ans.isCorrect ? '✅ ' : '❌ ')}
                                                    {opt} {optIdx === ans.question.correct_index && optIdx !== ans.selectedIndex && '(Correct Answer)'}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <LimitModal
                    isOpen={showLimitModal}
                    onClose={() => setShowLimitModal(false)}
                    variant={limitVariant}
                    renewalDate={renewalDate}
                />
                
                <ParentShareModal 
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    checkoutUrl={shareUrl}
                    isPromoActive={isOfferActive}
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout fullWidth={true} hideTopBar={true}>
            <div className={styles.mainWrapper}>
                <div className={styles.header}>
                    <div className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {topicConfig ? topicConfig.name : category}
                    </div>
                    {/* Stats removed to prevent duplication */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                        <button className={styles.exitBtn} onClick={handleExitClick}>Exit Practice</button>
                    </div>
                </div>

                <div className={styles.contentGrid} style={{ gridTemplateColumns: 'minmax(0, 1000px)', justifyContent: 'center' }}>
                    {/* Left Column: Question */}
                    <div>
                        {questions[currentindex] ? (
                            <QuestionCard
                                question={questions[currentindex]}
                                onNext={handleNext}
                                isLast={currentindex === questions.length - 1}
                                mode="practice"
                                selected={userAnswers.find(a => a.question?.id === questions[currentindex]?.id)?.selectedIndex}
                                onAnswer={() => { }}
                                progressLabel={`Question ${currentindex + 1} / ${questions.length}`}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: 500 }}>
                                Loading question details...
                            </div>
                        )}
                    </div>

                    {/* Right Column: Navigator REMOVED */}
                </div>
            </div>
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            <ExitModal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirm={confirmExit}
            />
            <LimitModal
                isOpen={showLimitModal}
                onClose={() => {
                    setShowLimitModal(false);
                    if (limitVariant === 'locked_test') {
                        router.push('/masterymap');
                        return;
                    }
                    const topicIndex = topicConfig ? masteryTopics.findIndex(t => t.id === topicConfig.id) : -1;
                    if (topicConfig && !isPremium && topicIndex >= 3 && ((topicAttempts || 0) + userAnswers.length >= 10)) {
                        router.push('/dashboard');
                    }
                }}
                variant={limitVariant}
                renewalDate={renewalDate}
            />

            <ParentShareModal 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                checkoutUrl={shareUrl}
                isPromoActive={isOfferActive}
            />
        </DashboardLayout>
    );
}

export default function PracticeQuiz() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <QuizContent />
        </Suspense>
    );
}
