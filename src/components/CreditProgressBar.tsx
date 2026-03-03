"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./CreditProgressBar.module.css";
import LimitModal from "./LimitModal";
import { useState } from "react";

const TARGET_ROUTES = ["/dashboard", "/account", "/history", "/study", "/practice"];

export default function CreditProgressBar() {
    const pathname = usePathname();
    const { user, loading, isPremium, practiceCredits, renewalDate } = useAuth();
    const [showLimitModal, setShowLimitModal] = useState(false);

    // Hide if loading, premium, no user, or on a non-targeted route
    if (loading || isPremium || !user || !TARGET_ROUTES.includes(pathname || "")) {
        return null;
    }

    // Calculations based on 5 practice credits total
    const totalCredits = 5;
    const remaining = practiceCredits ?? 0;
    const used = totalCredits - remaining;
    const percentage = Math.min((used / totalCredits) * 100, 100);
    const isExhausted = remaining <= 0;

    let message;
    if (isExhausted) {
        if (renewalDate) {
            const formattedDate = renewalDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            message = `You’ve reached your free limit. Credits renew on ${formattedDate}.`;
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
                    {isExhausted ? (
                        <button onClick={() => setShowLimitModal(true)} className={styles.upgradeBtn}>
                            Upgrade Now
                        </button>
                    ) : (
                        <p className={styles.upgradeText} onClick={() => setShowLimitModal(true)}>
                            Upgrade to Premium
                        </p>
                    )}
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
