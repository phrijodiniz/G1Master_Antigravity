"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./practice.module.css";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import LimitModal from "@/components/LimitModal";

export default function PracticePage() {
    const { isPremium, practiceCredits, renewalDate } = useAuth();
    const router = useRouter();
    const [showLimitModal, setShowLimitModal] = useState(false);

    const handleStart = (category: string) => {
        if (isPremium || (practiceCredits ?? 0) > 0) {
            router.push(`/quiz/practice?category=${category}`);
        } else {
            setShowLimitModal(true);
        }
    };

    return (
        <DashboardLayout>
            <h1 className={styles.title}>Practice Tests</h1>

            <div className={styles.grid}>
                {/* Rules of the Road */}
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <BookOpen size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Rules of the Road</h2>
                    <p className={styles.cardDescription}>
                        Practice questions about driving laws, demerit points, and regulations.
                    </p>
                    <button
                        onClick={() => handleStart("Rules of the Road")}
                        className={styles.cardBtn}
                    >
                        Start Practice
                    </button>
                </div>

                {/* Road Signs */}
                <div className={styles.card}>
                    <div className={styles.cardIcon}>
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className={styles.cardTitle}>Road Signs</h2>
                    <p className={styles.cardDescription}>
                        Practice identifying traffic signs, lights, and pavement markings.
                    </p>
                    <button
                        onClick={() => handleStart("Road Signs")}
                        className={styles.cardBtn}
                    >
                        Start Practice
                    </button>
                </div>
            </div>

            <LimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                variant="practice_limit"
                renewalDate={renewalDate}
            />
        </DashboardLayout>
    );
}
