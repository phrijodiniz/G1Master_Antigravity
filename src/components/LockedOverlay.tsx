"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import LimitModal from "@/components/LimitModal";

export default function LockedOverlay() {
    const { user, isPremium, practiceCredits, simulationCredits, loading } = useAuth();
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (!loading && user && !isPremium) {
            // Lock ONLY if ALL credits are 0
            if (practiceCredits <= 0 && simulationCredits <= 0) {
                setIsLocked(true);
            } else {
                setIsLocked(false);
            }
        } else {
            setIsLocked(false);
        }
    }, [user, isPremium, practiceCredits, simulationCredits, loading]);

    if (!isLocked) return null;

    return (
        <LimitModal
            isOpen={isLocked}
            variant="all_limit"
            onClose={() => { }}
        />
    );
}
