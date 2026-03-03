"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AnalyticsDatePicker from '@/components/admin/AnalyticsDatePicker';

type TestFilter = 'All Tests' | 'Free Test' | 'Rules of the Road' | 'Road Signs' | 'Simulation';

export default function ScorePerformancePage() {
    const router = useRouter();
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
        label: 'Last 30 Days'
    });
    const [distributionFilter, setDistributionFilter] = useState<TestFilter>('All Tests');
    const [engagementFilter, setEngagementFilter] = useState<TestFilter>('All Tests');
    const [loading, setLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [distributionData, setDistributionData] = useState<Record<string, any>>({});
    const [engagementData, setEngagementData] = useState<Record<string, any>>({});
    const [lifespanData, setLifespanData] = useState<Record<string, any>>({});

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const start = dateRange.startDate.toLocaleDateString('en-CA');
                const end = dateRange.endDate.toLocaleDateString('en-CA');

                const res = await fetch(`/api/analytics/score-performance?startDate=${start}&endDate=${end}`);
                if (res.ok) {
                    const json = await res.json();
                    setPerformanceData(json.performanceData || []);
                    setDistributionData(json.distributionData || {});
                    setEngagementData(json.engagementData || {});
                    setLifespanData(json.lifespanData || {});
                } else {
                    console.error("Failed to fetch score performance data");
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

    const currentChartData = distributionData[distributionFilter];
    const currentEngagementData = engagementData[engagementFilter];
    const currentLifespanData = lifespanData['All Tests'];

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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Score Performance</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                        Understand user average scores by test type and performance buckets.
                    </p>
                </div>

                {/* Date Picker */}
                <AnalyticsDatePicker onDateChange={handleDateChange} currentLabel={dateRange.label} />
            </div>

            {/* Section 1: Performance Overview */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Performance Overview</h2>
                    <div style={{ position: 'relative', cursor: 'help', display: 'flex' }} className="group">
                        <Info size={16} color="rgba(255,255,255,0.4)" />
                        <div className="tooltip-text" style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '10px',
                            background: '#1F2937',
                            color: '#fff',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            width: '250px',
                            zIndex: 10,
                            pointerEvents: 'none',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            High-level metrics for user performance. Aggregated across the selected date range. Median score represents the middle value of all tests taken.
                        </div>
                    </div>
                </div>
                {/* Adding tooltip hover CSS dynamically since we can't easily add global CSS from here */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .group:hover .tooltip-text { opacity: 1 !important; }
                `}} />
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                                <th style={{ padding: '1rem', fontWeight: 'normal' }}>Test Type</th>
                                <th style={{ padding: '1rem', fontWeight: 'normal' }}>Average Score</th>
                                <th style={{ padding: '1rem', fontWeight: 'normal' }}>Tests Taken</th>
                                <th style={{ padding: '1rem', fontWeight: 'normal' }}>Unique Users</th>
                                <th style={{ padding: '1rem', fontWeight: 'normal' }}>Median Score</th>
                                <th style={{ padding: '1rem', fontWeight: 'normal' }}>% ≥ 80%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                        Loading analytics...
                                    </td>
                                </tr>
                            ) : performanceData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                        No data available for this date range.
                                    </td>
                                </tr>
                            ) : (
                                performanceData.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{row.type}</td>
                                        <td style={{ padding: '1rem', color: '#8B5CF6', fontWeight: 'bold' }}>{row.avgScore}</td>
                                        <td style={{ padding: '1rem' }}>{row.testsTaken.toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>{row.uniqueUsers.toLocaleString()}</td>
                                        <td style={{ padding: '1rem' }}>{row.medianScore}</td>
                                        <td style={{ padding: '1rem', color: parseInt(row.over80) > 50 ? '#10B981' : '#F59E0B' }}>{row.over80}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Score Distribution */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Score Distribution</h2>
                        <div style={{ position: 'relative', cursor: 'help', display: 'flex' }} className="group">
                            <Info size={16} color="rgba(255,255,255,0.4)" />
                            <div className="tooltip-text" style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginBottom: '10px',
                                background: '#1F2937',
                                color: '#fff',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                width: '250px',
                                zIndex: 10,
                                pointerEvents: 'none',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                Shows how many tests resulted in a specific score range. Helps identify if users are generally passing or failing.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '8px' }}>
                        {(['All Tests', 'Free Test', 'Rules of the Road', 'Road Signs', 'Simulation'] as TestFilter[]).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setDistributionFilter(filter)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: distributionFilter === filter ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                                    color: distributionFilter === filter ? '#C4B5FD' : 'rgba(255,255,255,0.6)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: distributionFilter === filter ? '500' : 'normal',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Loading distribution chart...</div>
                ) : (
                    <div style={{ height: '350px', width: '100%', minWidth: '600px', overflowX: 'auto' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={currentChartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis
                                    dataKey="bucket"
                                    stroke="rgba(255,255,255,0.4)"
                                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.4)"
                                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                    tickLine={false}
                                    label={{ value: 'Number of Tests', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Number of Tests"
                                    fill="#8B5CF6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Section 3: User Engagement (Tests Taken) */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>User Engagement (Tests Taken)</h2>
                        <div style={{ position: 'relative', cursor: 'help', display: 'flex' }} className="group">
                            <Info size={16} color="rgba(255,255,255,0.4)" />
                            <div className="tooltip-text" style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginBottom: '10px',
                                background: '#1F2937',
                                color: '#fff',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                width: '250px',
                                zIndex: 10,
                                pointerEvents: 'none',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                Shows how many times unique users take tests. A high concentration in '1 Test' indicates users are leaving quickly, while higher values mean active study sessions.
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '8px' }}>
                        {(['All Tests', 'Free Test', 'Rules of the Road', 'Road Signs', 'Simulation'] as TestFilter[]).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setEngagementFilter(filter)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: engagementFilter === filter ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                    color: engagementFilter === filter ? '#93C5FD' : 'rgba(255,255,255,0.6)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: engagementFilter === filter ? '500' : 'normal',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Loading engagement chart...</div>
                ) : (
                    <div style={{ height: '350px', width: '100%', minWidth: '600px', overflowX: 'auto' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={currentEngagementData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis
                                    dataKey="bucket"
                                    stroke="rgba(255,255,255,0.4)"
                                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.4)"
                                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                    tickLine={false}
                                    label={{ value: 'Number of Users', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Number of Users"
                                    fill="#3B82F6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Section 4: User Lifespan */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>User Lifespan (First vs. Last Test)</h2>
                        <div style={{ position: 'relative', cursor: 'help', display: 'flex' }} className="group">
                            <Info size={16} color="rgba(255,255,255,0.4)" />
                            <div className="tooltip-text" style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginBottom: '10px',
                                background: '#1F2937',
                                color: '#fff',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                width: '250px',
                                zIndex: 10,
                                pointerEvents: 'none',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                Shows the time elapsed between a user's absolute first test and their most recent test. 'Same Day' indicates single cram sessions, while longer times indicate multi-day studying behavior.
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Loading lifespan chart...</div>
                ) : (
                    <div style={{ height: '350px', width: '100%', minWidth: '600px', overflowX: 'auto' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={currentLifespanData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis
                                    dataKey="bucket"
                                    stroke="rgba(255,255,255,0.4)"
                                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.4)"
                                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13 }}
                                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                    tickLine={false}
                                    label={{ value: 'Number of Users', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.4)' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Number of Users"
                                    fill="#10B981"
                                    radius={[4, 4, 0, 0]}
                                    barSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
