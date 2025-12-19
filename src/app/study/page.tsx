"use client";

import styles from "./study.module.css";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { FileText, Car, BookOpen } from "lucide-react";

export default function StudyPage() {
    return (
        <div className={styles.studyLayout}>
            <Sidebar />
            <div className={styles.contentWrapper}>
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
                    <div className={styles.card}>
                        <div className={styles.cardIcon}>
                            <Car size={32} />
                        </div>
                        <h2 className={styles.cardTitle}>Simulations</h2>
                        <p className={styles.cardDescription}>
                            Take a realistic G1 mock exam. Timed, mixed questions with no hints allowed.
                        </p>
                        <Link href="/quiz/simulation" className={styles.cardBtn}>
                            Start Simulation
                        </Link>
                    </div>

                    {/* Chapters */}
                    <div className={styles.card}>
                        <div className={styles.cardIcon}>
                            <BookOpen size={32} />
                        </div>
                        <h2 className={styles.cardTitle}>Chapters</h2>
                        <p className={styles.cardDescription}>
                            Study the G1 handbook chapter by chapter. Learn the material before testing.
                        </p>
                        <Link href="/chapter" className={styles.cardBtn}>
                            Choose Chapter
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
