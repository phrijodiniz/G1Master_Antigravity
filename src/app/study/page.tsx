"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./study.module.css";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { FileText, Car, BookOpen, Lock, Gem, Map } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LimitModal from "@/components/LimitModal";

export default function StudyPage() {
    const { isPremium, simulationCredits, renewalDate } = useAuth();
    const router = useRouter();
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitVariant, setLimitVariant] = useState<'simulation_quiz' | 'chapter_quiz'>('simulation_quiz');

    const handleStartSimulation = () => {
        if (isPremium) {
            router.push("/quiz/simulation");
        } else {
            setLimitVariant("simulation_quiz");
            setShowLimitModal(true);
        }
    };

    const handleStartChapters = () => {
        if (isPremium) {
            router.push("/chapter");
        } else {
            setLimitVariant("chapter_quiz");
            setShowLimitModal(true);
        }
    };

    return (
        <DashboardLayout>
            <h1 className={styles.title}>Study Modes</h1>

            <div className={styles.grid}>
                {/* Practice Tests */}
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <FileText size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Practice Tests</h2>
                    <p className={styles.cardDescription}>
                        Over 1000 quick practice tests with instant feedback.
                    </p>
                    <Link href="/practice" className={styles.cardBtn}>
                        Choose Category
                    </Link>
                </div>

                {/* Mastery Map */}
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <Map size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Mastery Map</h2>
                    <p className={styles.cardDescription}>
                        Follow a step-by-step program to track and master every G1 topic.
                    </p>
                    <Link href="/masterymap" className={styles.cardBtn}>
                        Open Mastery Map
                    </Link>
                </div>

                {/* G1 Exam Simulator */}
                <div className={`${styles.card} ${!isPremium ? styles.lockedCard : ''}`}>
                    <div className={styles.premiumBadge}>
                        <Gem size={10} className={styles.premiumBadgeGem} /> Premium
                    </div>
                    <div className={styles.cardIcon}>
                        <Car size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>G1 Exam Simulator</h2>
                    <p className={styles.cardDescription}>
                        Experience the real G1 test under actual exam conditions.
                    </p>
                    <button
                        onClick={handleStartSimulation}
                        className={styles.cardBtn}
                        style={!isPremium ? { background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' } : {}}
                    >
                        {!isPremium ? '👑 Unlock Simulation' : 'Start Simulation'}
                    </button>
                </div>

                {/* Chapters */}
                <div className={`${styles.card} ${!isPremium ? styles.lockedCard : ''}`}>
                    <div className={styles.premiumBadge}>
                        <Gem size={10} className={styles.premiumBadgeGem} /> Premium
                    </div>
                    <div className={styles.cardIcon}>
                        <BookOpen size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Study by Chapter</h2>
                    <p className={styles.cardDescription}>
                        Learn rule-by-rule with bite-sized lessons and targeted quizzes.
                    </p>
                    <button
                        onClick={handleStartChapters}
                        className={styles.cardBtn}
                        style={!isPremium ? { background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' } : {}}
                    >
                        {!isPremium ? '👑 Unlock Chapters' : 'Choose Chapter'}
                    </button>
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
