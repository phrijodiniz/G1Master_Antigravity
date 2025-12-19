"use client";

import styles from "./practice.module.css";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { BookOpen, AlertTriangle } from "lucide-react";

export default function PracticePage() {
    return (
        <div className={styles.practiceLayout}>
            <Sidebar />
            <div className={styles.contentWrapper}>
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
                        <Link href="/quiz/practice?category=Rules of the Road" className={styles.cardBtn}>
                            Start Practice
                        </Link>
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
                        <Link href="/quiz/practice?category=Road Signs" className={styles.cardBtn}>
                            Start Practice
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
