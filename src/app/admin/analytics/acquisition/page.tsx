"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Users, DollarSign, MousePointerClick, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/services/analyticsExample';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsDatePicker from '@/components/admin/AnalyticsDatePicker';

export default function AcquisitionPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Default to last 30 days
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
        label: 'Last 30 Days'
    });

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Format dates as YYYY-MM-DD for the API (using Local Time, not UTC)
                const start = dateRange.startDate.toLocaleDateString('en-CA');
                const end = dateRange.endDate.toLocaleDateString('en-CA');

                console.log('Page Fetching Data:', {
                    dateRangeState: dateRange,
                    formattedStart: start,
                    formattedEnd: end
                });

                const res = await fetch(`/api/analytics/acquisition?startDate=${start}&endDate=${end}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [dateRange]);

    const handleDateChange = (range: { startDate: Date; endDate: Date; label: string }) => {
        setDateRange(range);
    };

    const summary = data?.summary || {};
    const funnelVariants = data?.funnelVariants || {};
    const currentFunnel = funnelVariants.all || {};
    const breakdownData = data?.breakdownData || {};
    const currentBreakdownData = breakdownData.day || [];

    return (
        <div style={{ padding: '2rem' }}>
            <button
                onClick={() => router.push('/admin/analytics')}
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
                Back to Analytics
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Acquisition Analytics</h1>

                {/* Date Picker */}
                <AnalyticsDatePicker onDateChange={handleDateChange} currentLabel={dateRange.label} />
            </div>

            {loading ? (
                <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Loading analytics...</div>
            ) : !data ? (
                <div style={{ padding: '2rem', color: 'rgba(255,50,50,0.8)', textAlign: 'center' }}>Failed to load data. Please check your Google Sheet integration.</div>
            ) : (
                <>
                    {/* KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <KpiCard
                            title="Total Ad Spent"
                            value={formatCurrency(summary.totalSpend)}
                            icon={DollarSign}
                        />
                        <KpiCard
                            title="Total Signups"
                            value={summary.totalSignups.toString()}
                            icon={Users}
                            color="#10B981"
                        />
                        <KpiCard
                            title="Cost per Sign Up"
                            value={formatCurrency(summary.totalSpend / (summary.totalSignups || 1))} // Avoid NaN if 0 signups
                            icon={TrendingUp}
                            color="#F59E0B"
                        />
                    </div>

                    {/* Funnel Section */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem' }}>Conversion Funnel</h3>

                        </div>

                        {/* Funnel Visualization - Always Visible */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                            <FunnelStep
                                label="Impressions (Ads)"
                                value={(currentFunnel?.impressions || 0).toLocaleString()}
                                color="#6366f1"
                            />
                            <FunnelConnector
                                percentage={((currentFunnel?.clicks && currentFunnel?.impressions) ? ((currentFunnel.clicks / currentFunnel.impressions) * 100).toFixed(2) + '%' : '0%')}
                                label="CTR"
                            />
                            <FunnelStep
                                label="Clicks (Ads)"
                                value={(currentFunnel?.clicks || 0).toLocaleString()}
                                color="#8b5cf6"
                            />
                            <FunnelConnector
                                percentage={((currentFunnel?.visits && currentFunnel?.clicks) ? ((currentFunnel.visits / currentFunnel.clicks) * 100).toFixed(1) + '%' : '0%')}
                                label="Drop-off"
                            />
                            <FunnelStep
                                label="Visits (GA4)"
                                value={(currentFunnel?.visits || 0).toLocaleString()}
                                color="#ec4899"
                            />
                            <FunnelConnector
                                percentage={((currentFunnel?.signups && currentFunnel?.visits) ? ((currentFunnel.signups / currentFunnel.visits) * 100).toFixed(1) + '%' : '0%')}
                                label="Sign Up Rate"
                            />
                            <FunnelStep
                                label="Signups (Supabase)"
                                value={(currentFunnel?.signups || 0).toLocaleString()}
                                color="#10b981"
                                isLast
                            />
                        </div>

                        {/* Breakdown Chart - Always Visible (Day) */}
                        <div style={{ overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                                Daily Trends
                            </h4>

                            <div style={{ height: '400px', width: '100%', minWidth: '600px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={currentBreakdownData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="segment"
                                            stroke="rgba(255,255,255,0.5)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                                            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="rgba(255,255,255,0.5)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                                            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                            label={{ value: 'Impressions', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="rgba(255,255,255,0.5)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                                            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            itemSorter={(item) => {
                                                const order: any = { 'Impressions': 1, 'Clicks': 2, 'Visits': 3, 'Signups': 4 };
                                                return order[item.name as string] || 100;
                                            }}
                                        />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#6366f1" activeDot={{ r: 8 }} name="Impressions" />
                                        <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#8b5cf6" name="Clicks" />
                                        <Line yAxisId="right" type="monotone" dataKey="visits" stroke="#ec4899" name="Visits" />
                                        <Line yAxisId="right" type="monotone" dataKey="signups" stroke="#10b981" name="Signups" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Sign Up Breakdown Card */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem' }}>Sign Up Breakdown</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <KpiCard
                                title="Google Sign In"
                                value={(summary.totalGoogleSignups || 0).toString()}
                                icon={Users}
                                color="#4285F4"
                            />
                            <KpiCard
                                title="Email Sign Up"
                                value={(summary.totalEmailSignups || 0).toString()}
                                icon={Users}
                                color="#10B981"
                            />
                        </div>

                        {/* Progress Bar Visual */}
                        {summary.totalSignups > 0 && (
                            <div style={{ width: '100%' }}>
                                <div style={{
                                    width: '100%',
                                    height: '12px',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    overflow: 'hidden',
                                    marginBottom: '0.75rem'
                                }}>
                                    <div style={{ width: `${(summary.totalGoogleSignups / summary.totalSignups) * 100}%`, backgroundColor: '#4285F4' }}></div>
                                    <div style={{ width: `${(summary.totalEmailSignups / summary.totalSignups) * 100}%`, backgroundColor: '#10B981' }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4285F4' }}></div>
                                        {Math.round((summary.totalGoogleSignups / summary.totalSignups) * 100)}% Google
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {Math.round((summary.totalEmailSignups / summary.totalSignups) * 100)}% Email
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function FunnelStep({ label, value, color, isLast }: any) {
    return (
        <div style={{ flex: 1, minWidth: '150px', textAlign: 'left', position: 'relative' }}>
            <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: color,
                marginBottom: '0.5rem'
            }}>
                {value}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                {label}
            </div>
            {!isLast && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-50%',
                    width: '100%',
                    height: '2px',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'none' // Hidden for now, using connector component instead
                }}></div>
            )}
        </div>
    );
}

function FunnelConnector({ percentage, label }: any) {
    return (
        <div style={{
            flex: 1,
            minWidth: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.25rem',
            opacity: 0.6
        }}>
            <ArrowRight size={24} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <div style={{ fontSize: '0.75rem' }}>{percentage}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{label}</div>
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, color, subtitle }: any) {
    return (
        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{title}</span>
                <div style={{ padding: '0.5rem', background: `${color}20`, borderRadius: '8px', color: color }}>
                    <Icon size={18} />
                </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{value}</div>
            {subtitle && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>{subtitle}</div>}
        </div>
    );
}
