"use client";

import { useEffect, useState } from 'react';
import { Calendar, Tag, Info, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Event {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    category: 'Feature Release' | 'Marketing Campaign' | 'Pricing Change' | 'Product Update' | 'Other';
}

interface EventTimelineWidgetProps {
    startDate: Date;
    endDate: Date;
}

export default function EventTimelineWidget({ startDate, endDate }: EventTimelineWidgetProps) {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const startStr = startDate.toLocaleDateString('en-CA');
    const endStr = endDate.toLocaleDateString('en-CA');

    useEffect(() => {
        async function fetchEvents() {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/analytics/events?startDate=${startStr}&endDate=${endStr}`);
                if (res.ok) {
                    const json = await res.json();
                    setEvents(json.events || []);
                }
            } catch (err) {
                console.error('Error fetching active events:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, [startStr, endStr]);

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Feature Release':
                return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' };
            case 'Marketing Campaign':
                return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' };
            case 'Pricing Change':
                return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' };
            case 'Product Update':
                return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' };
            default:
                return { bg: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' };
        }
    };

    const formatDateDisplay = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="glass-panel report-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Active Business Events ({events.length})</h3>
                </div>
                <button
                    onClick={() => router.push('/admin/analytics/events')}
                    className="no-print"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    <Settings size={14} />
                    Manage Events
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '1rem 0', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem' }}>
                    Loading event context...
                </div>
            ) : events.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', margin: 0 }}>
                        No business events or product launches registered during this period.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {events.map((event) => {
                        const style = getCategoryStyles(event.category);
                        return (
                            <div
                                key={event.id}
                                style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff', margin: 0 }}>{event.name}</h4>
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                            borderRadius: '100px',
                                            backgroundColor: style.bg,
                                            color: style.color,
                                            border: style.border
                                        }}
                                    >
                                        {event.category}
                                    </span>
                                </div>

                                {event.description && (
                                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.4 }}>
                                        {event.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                                    <Tag size={12} />
                                    <span>
                                        {formatDateDisplay(event.start_date)}
                                        {event.end_date ? ` to ${formatDateDisplay(event.end_date)}` : ' (Ongoing)'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
