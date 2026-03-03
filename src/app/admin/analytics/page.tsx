"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AdminAnalyticsPage() {
    const router = useRouter();

    const cards = [
        {
            title: "📈 Acquisition",
            description: "Monitor traffic, cost, and signup performance.",
            href: "/admin/analytics/acquisition",
            color: "var(--primary)" // Using primary color from admin dashboard
        },
        {
            title: "🚀 Activation & Behavior",
            description: "Measure app user engagement and upgrade behavior.",
            href: "/admin/analytics/activation", // Activated route
            color: "#10B981" // Green
        },
        {
            title: "🎯 Score Performance",
            description: "Understand user average scores by test type and performance buckets.",
            href: "/admin/analytics/score-performance",
            color: "#8B5CF6" // Purple
        },
        {
            title: "💰 Revenue",
            description: "Monitor premium sales, revenue growth, and customer acquisition cost.",
            href: "#", // Placeholder
            color: "#F59E0B" // Amber
        }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <button
                onClick={() => router.push('/admin')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    padding: 0
                }}
            >
                <ArrowLeft size={16} />
                Back to Dashboard
            </button>

            <h1 style={{ marginBottom: '2rem' }}>Analytics</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {cards.map((card, index) => (
                    <div
                        key={index}
                        onClick={() => router.push(card.href)}
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            borderTop: `4px solid ${card.color}`,
                            minHeight: '150px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{card.title}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            {card.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
