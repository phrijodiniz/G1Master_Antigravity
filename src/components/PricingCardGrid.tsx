"use client";

import React from "react";
import styles from "./PricingCardGrid.module.css";

interface PricingCard {
    id: "2_weeks" | "30_days" | "lifetime";
    title: string;
    tagline: string;
    price: string;
    duration: string;
    description: string;
    isPopular?: boolean;
    guarantee?: string;
}

interface PricingCardGridProps {
    onSelectTier: (tier: "2_weeks" | "30_days" | "lifetime") => void;
    isSubmitting?: boolean;
    selectedTier?: "2_weeks" | "30_days" | "lifetime" | null;
    stacked?: boolean;
}

export default function PricingCardGrid({
    onSelectTier,
    isSubmitting = false,
    selectedTier = null,
    stacked = false,
}: PricingCardGridProps) {
    const cards: PricingCard[] = [
        {
            id: "2_weeks",
            title: "2 Weeks Access",
            tagline: "⚡ Quick study push",
            price: "5.97",
            duration: "for 14 days",
            description: "Unlock all features, unlimited practice tests, and timed G1 simulations for 14 days.",
            guarantee: "Pass Guarantee: Pass on your first try or get 100% refund."
        },
        {
            id: "30_days",
            title: "1 Month Access",
            tagline: "🏆 Perfect preparation window",
            price: "9.97",
            duration: "for 1 month",
            description: "Unlock all features, unlimited practice tests, and timed G1 simulations for 1 month.",
            isPopular: true,
            guarantee: "Pass Guarantee: Pass on your first try or get 100% refund."
        },
        {
            id: "lifetime",
            title: "Lifetime Access",
            tagline: "💎 Best value & pass guarantee",
            price: "19.97",
            duration: "forever",
            description: "Unlock all features, unlimited practice tests, and timed G1 simulations with lifetime access.",
            guarantee: "Pass Guarantee: Pass on your first try or get 100% refund."
        },
    ];

    return (
        <div className={`${styles.grid} ${stacked ? styles.stackedGrid : ""}`}>
            {cards.map((card) => {
                const isSelected = selectedTier === card.id;
                return (
                    <div
                        key={card.id}
                        className={`${styles.card} ${card.isPopular ? styles.popularCard : ""}`}
                    >
                        {card.isPopular && <div className={styles.badge}>Most Popular</div>}
                        <h3 className={`${styles.title} ${card.isPopular ? styles.popularTitle : ""}`}>
                            {card.title}
                        </h3>
                        <p className={styles.tagline}>{card.tagline}</p>
                        <div className={styles.priceContainer}>
                            <span className={styles.currency}>$</span>
                            <span className={`${styles.price} ${card.isPopular ? styles.popularPrice : ""}`}>
                                {card.price}
                            </span>
                            <span className={styles.duration}> CAD</span>
                        </div>
                        <div className={styles.paymentNote}>One-time payment • No subscription</div>
                        <p className={styles.details}>{card.description}</p>
                        {card.guarantee && (
                            <div className={styles.guaranteeTag}>
                                🛡️ {card.guarantee}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => onSelectTier(card.id)}
                            disabled={isSubmitting}
                            className={`${styles.button} ${card.isPopular ? styles.popularButton : ""}`}
                        >
                            {isSubmitting && isSelected ? "Connecting..." : `Select Plan`}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
