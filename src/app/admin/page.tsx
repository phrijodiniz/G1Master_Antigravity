"use client";

import { useRouter } from 'next/navigation';
import { BookOpen, Users, BarChart } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();

    const cards = [
        {
            title: "Questions Review",
            description: "Review, edit, and validate question bank.",
            icon: BookOpen,
            href: "/admin/questions",
            color: "var(--primary)",
            active: true
        },
        {
            title: "App Users",
            description: "Manage registered users and subscriptions.",
            icon: Users,
            href: "/admin/users",
            color: "#10B981",
            active: true // Placeholder
        },
        {
            title: "Analytics",
            description: "View app usage and performance metrics.",
            icon: BarChart,
            href: "/admin/analytics",
            color: "#F59E0B",
            active: true // Placeholder
        }
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Dashboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>Welcome to the G1 Master internal tooling.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            onClick={() => router.push(card.href)}
                            className="glass-panel"
                            style={{
                                padding: '1.5rem',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, border-color 0.2s',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = card.color;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: `${card.color}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: card.color
                            }}>
                                <Icon size={24} />
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{card.title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>{card.description}</p>
                            </div>

                            {!card.active && (
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                }}>
                                    Soon
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
