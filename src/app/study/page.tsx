"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./study.module.css";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { FileText, Car, BookOpen, Lock } from "lucide-react";
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
            <h1 className={styles.title}>Study Now</h1>

            <div className={styles.grid}>
                {/* Practice Tests */}
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <FileText size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Practice Tests</h2>
                    <p className={styles.cardDescription}>
                        Focus on specific topics. Choose between Road Signs or Rules of the Road questions.
                    </p>
                    <Link href="/practice" className={styles.cardBtn}>
                        Choose Category
                    </Link>
                </div>

                {/* Simulations */}
                <div className={`${styles.card} ${!isPremium ? styles.lockedCard : ''}`}>
                    {!isPremium && (
                        <div className={styles.premiumBadge}>
                            <Lock size={12} /> Premium
                        </div>
                    )}
                    <div className={styles.cardIcon}>
                        <Car size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Simulations</h2>
                    <p className={styles.cardDescription}>
                        Take a realistic G1 mock exam. Timed, mixed questions with no hints allowed.
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
                    {!isPremium && (
                        <div className={styles.premiumBadge}>
                            <Lock size={12} /> Premium
                        </div>
                    )}
                    <div className={styles.cardIcon}>
                        <BookOpen size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Chapters</h2>
                    <p className={styles.cardDescription}>
                        Study the G1 handbook chapter by chapter. Learn the material before testing.
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
