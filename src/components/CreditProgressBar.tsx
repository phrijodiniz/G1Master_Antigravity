"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./CreditProgressBar.module.css";
import LimitModal from "./LimitModal";
import { useState, useEffect } from "react";

function Countdown({ targetDate }: { targetDate: Date }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        function updateTimer() {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                setTimeLeft('00h 00m 00s');
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const parts = [];
            if (days > 0) {
                parts.push(`${days}d`);
            }
            parts.push(`${hours.toString().padStart(2, '0')}h`);
            parts.push(`${minutes.toString().padStart(2, '0')}m`);
            parts.push(`${seconds.toString().padStart(2, '0')}s`);

            setTimeLeft(parts.join(' '));
        }

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return <span className={styles.countdownText}>{timeLeft}</span>;
}

const TARGET_ROUTES = ["/dashboard", "/account", "/history", "/study", "/practice"];

export default function CreditProgressBar() {
    // Temporarily hidden
    return null;

    const pathname = usePathname();
    const { user, loading, isPremium, practiceCredits, renewalDate } = useAuth();
    const [showLimitModal, setShowLimitModal] = useState(false);

    // Hide if loading, premium, no user, or on a non-targeted route
    if (loading || isPremium || !user || !TARGET_ROUTES.includes(pathname || "")) {
        return null;
    }

    // Calculations based on 3 practice credits total
    const totalCredits = 3;
    const remaining = practiceCredits ?? 0;
    const used = totalCredits - remaining;
    const percentage = Math.min((used / totalCredits) * 100, 100);
    const isExhausted = remaining <= 0;

    let message: any;
    if (isExhausted) {
        if (renewalDate) {
            message = (
                <span>
                    ⏱️ Next free practice test unlocks in: <Countdown targetDate={renewalDate!} />
                </span>
            );
        } else {
            message = "You’ve reached your free limit.";
        }
    } else {
        message = `${used} of ${totalCredits} free credits used.`;
    }

    return (
        <div className={styles.barContainer}>
            <div className={styles.content}>
                <div className={styles.textRow}>
                    <p className={styles.message}>{message}</p>
                    {/* 
                    {isExhausted ? (
                        <button onClick={() => setShowLimitModal(true)} className={styles.upgradeBtn}>
                            Upgrade Now
                        </button>
                    ) : (
                        <p className={styles.upgradeText} onClick={() => setShowLimitModal(true)}>
                            Upgrade to Premium
                        </p>
                    )} 
                    */}
                </div>

                <div className={styles.track}>
                    <div
                        className={`${styles.fill} ${isExhausted ? styles.fillExhausted : ''}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            <LimitModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                variant={isExhausted ? "all_limit" : "progressbar_upgrade"}
                renewalDate={renewalDate}
            />
        </div>
    );
}
