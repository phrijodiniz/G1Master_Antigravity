"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./practice.module.css";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, AlertTriangle, Shuffle, Lock, Gem } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LimitModal from "@/components/LimitModal";

export default function PracticePage() {
    const { isPremium, practiceCredits, renewalDate } = useAuth();
    const router = useRouter();
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitVariant, setLimitVariant] = useState<'practice_limit' | 'progressbar_upgrade' | 'rules_road_limit' | 'road_signs_limit'>('practice_limit');

    const handleStart = (category: string) => {
        if (category === 'Mixed Practice') {
            // Mixed Practice is free for standard users with remaining credits
            if (isPremium || (practiceCredits ?? 0) > 0) {
                router.push(`/quiz/practice?category=${encodeURIComponent(category)}`);
            } else {
                setLimitVariant('practice_limit');
                setShowLimitModal(true);
            }
        } else {
            // Rules and Signs deep dives are premium-only
            if (isPremium) {
                router.push(`/quiz/practice?category=${encodeURIComponent(category)}`);
            } else {
                if (category === 'Rules of the Road') {
                    setLimitVariant('rules_road_limit');
                } else {
                    setLimitVariant('road_signs_limit');
                }
                setShowLimitModal(true);
            }
        }
    };

    return (
        <DashboardLayout>
            <h1 className={styles.title}>Practice Tests</h1>

            <div className={styles.grid}>
                {/* G1 Mixed Practice */}
                <div className={styles.card}>
                    <div className={styles.cardIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                        <Shuffle size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Mixed Practice</h2>
                    <p className={styles.cardDescription}>
                        A balanced 50/50 mix of Rules and Signs questions. Tracks your overall test-readiness.
                    </p>
                    <button
                        onClick={() => handleStart("Mixed Practice")}
                        className={styles.cardBtn}
                    >
                        Start Practice
                    </button>
                </div>

                {/* Rules of the Road */}
                <div className={`${styles.card} ${!isPremium ? styles.lockedCard : ''}`}>
                    <div className={styles.premiumBadge}>
                        <Gem size={10} className={styles.premiumBadgeGem} /> Premium
                    </div>
                    <div className={styles.cardIcon}>
                        <BookOpen size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Rules of the Road</h2>
                    <p className={styles.cardDescription}>
                        Practice questions about Ontario driving laws, demerit points, and regulations.
                    </p>
                    <button
                        onClick={() => handleStart("Rules of the Road")}
                        className={styles.cardBtn}
                        style={!isPremium ? { background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' } : {}}
                    >
                        {!isPremium ? "👑 Unlock Rules of The Road Test" : "Start Practice"}
                    </button>
                </div>

                {/* Road Signs */}
                <div className={`${styles.card} ${!isPremium ? styles.lockedCard : ''}`}>
                    <div className={styles.premiumBadge}>
                        <Gem size={10} className={styles.premiumBadgeGem} /> Premium
                    </div>
                    <div className={styles.cardIcon}>
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Road Signs</h2>
                    <p className={styles.cardDescription}>
                        Practice identifying Ontario traffic signs, signals, and pavement markings.
                    </p>
                    <button
                        onClick={() => handleStart("Road Signs")}
                        className={styles.cardBtn}
                        style={!isPremium ? { background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1' } : {}}
                    >
                        {!isPremium ? "👑 Unlock Road Signs Test" : "Start Practice"}
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
