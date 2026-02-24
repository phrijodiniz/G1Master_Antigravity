"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MousePointerClick, PlayCircle, XCircle, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AnalyticsDatePicker from '@/components/admin/AnalyticsDatePicker';

export default function ActivationPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Default to last 30 days
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date(),
        label: 'Last 30 Days'
    });
    const [selectedUsers, setSelectedUsers] = useState<{ label: string, ids: string[] } | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                // Format dates as YYYY-MM-DD for the API
                const start = dateRange.startDate.toLocaleDateString('en-CA');
                const end = dateRange.endDate.toLocaleDateString('en-CA');

                const res = await fetch(`/api/analytics/activation?startDate=${start}&endDate=${end}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    console.error("Failed to fetch activation data");
                    setData(null);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
                setData(null);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [dateRange]);

    const handleDateChange = (range: { startDate: Date; endDate: Date; label: string }) => {
        setDateRange(range);
    };

    const landingPage = data?.landingPage || {};
    const freeTest = data?.freeTest || {};
    const dailyTrends = data?.dailyTrends || [];
    const creditFunnel = data?.creditFunnel || {};

    // Format scroll depth for BarChart
    const scrollDepthData = landingPage.scrollDepth ? [
        { name: '25%', value: landingPage.scrollDepth['25%'] },
        { name: '50%', value: landingPage.scrollDepth['50%'] },
        { name: '75%', value: landingPage.scrollDepth['75%'] },
        { name: '100%', value: landingPage.scrollDepth['100%'] },
    ] : [];

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
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Activation & Behavior</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>Monitor landing page and free test engagement.</p>
                </div>

                {/* Date Picker */}
                <AnalyticsDatePicker onDateChange={handleDateChange} currentLabel={dateRange.label} />
            </div>

            {loading ? (
                <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Loading analytics...</div>
            ) : !data ? (
                <div style={{ padding: '2rem', color: 'rgba(255,50,50,0.8)', textAlign: 'center' }}>Failed to load data.</div>
            ) : (
                <>
                    {/* Free Test Engagement Section */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Free Test Engagement</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <KpiCard
                                title="Started Test"
                                value={(freeTest.started || 0).toLocaleString()}
                                icon={PlayCircle}
                                color="#6366f1"
                            />
                            <KpiCard
                                title="Abandoned Test"
                                value={(freeTest.abandoned || 0).toLocaleString()}
                                icon={XCircle}
                                color="#ef4444"
                            />
                            <KpiCard
                                title="Completed Test"
                                value={(freeTest.completed || 0).toLocaleString()}
                                icon={CheckCircle}
                                color="#10b981"
                                subtitle={`${((freeTest.completionRate) * 100 || 0).toFixed(1)}% Completion Rate`}
                            />
                        </div>

                        {/* Funnel Section */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'rgba(255,255,255,0.7)' }}>
                                Free Test Funnel
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <FunnelStep
                                    label="Start"
                                    value={(freeTest.started || 0).toLocaleString()}
                                    color="#6366f1"
                                />
                                <FunnelConnector
                                    percentage={((freeTest.completed && freeTest.started) ? ((freeTest.completed / freeTest.started) * 100).toFixed(1) + '%' : '0%')}
                                    label="Completed"
                                />
                                <FunnelStep
                                    label="Complete"
                                    value={(freeTest.completed || 0).toLocaleString()}
                                    color="#ec4899"
                                />
                                <FunnelConnector
                                    percentage={((freeTest.conversions && freeTest.completed) ? ((freeTest.conversions / freeTest.completed) * 100).toFixed(1) + '%' : '0%')}
                                    label="Sign Up Rate"
                                />
                                <FunnelStep
                                    label="Initiate Sign Up"
                                    value={(freeTest.conversions || 0).toLocaleString()}
                                    color="#10b981"
                                    isLast
                                />
                            </div>
                        </div>

                        {/* Breakdown Chart */}
                        <div style={{ overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                                Daily Trends
                            </h4>

                            <div style={{ height: '400px', width: '100%', minWidth: '600px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={dailyTrends}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="rgba(255,255,255,0.5)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                                            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                        />
                                        <YAxis
                                            stroke="rgba(255,255,255,0.5)"
                                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                                            tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            itemSorter={(item) => {
                                                if (item.name === 'Test Starts') return 1;
                                                if (item.name === 'Test Completes') return 2;
                                                if (item.name === 'Initiate Sign Up') return 3;
                                                return 4;
                                            }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="testStarts" stroke="#6366f1" name="Test Starts" />
                                        <Line type="monotone" dataKey="testCompletes" stroke="#ec4899" name="Test Completes" />
                                        <Line type="monotone" dataKey="testConversions" stroke="#10b981" name="Initiate Sign Up" activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div> {/* End Free Test Engagement */}

                    {/* Credit Usage Funnel Card */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Credit Usage Journey (Free Limit = 6)</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <FunnelStep
                                label="Sign Up"
                                value={(creditFunnel.signUp?.length || 0).toLocaleString()}
                                color="#6366f1"
                                onClick={() => setSelectedUsers({ label: 'Sign Up Users', ids: creditFunnel.signUp })}
                            />
                            <FunnelConnector
                                percentage={((creditFunnel.plusOne?.length && creditFunnel.signUp?.length) ? ((creditFunnel.plusOne.length / creditFunnel.signUp.length) * 100).toFixed(1) + '%' : '0%')}
                                label="1 More Credit"
                            />
                            <FunnelStep
                                label="1 More Credit"
                                value={(creditFunnel.plusOne?.length || 0).toLocaleString()}
                                color="#8b5cf6"
                                onClick={() => setSelectedUsers({ label: 'Users using 1 More Credit', ids: creditFunnel.plusOne })}
                            />
                            <FunnelConnector
                                percentage={((creditFunnel.plusTwo?.length && creditFunnel.signUp?.length) ? ((creditFunnel.plusTwo.length / creditFunnel.signUp.length) * 100).toFixed(1) + '%' : '0%')}
                                label="2 Credits"
                            />
                            <FunnelStep
                                label="2 Credits"
                                value={(creditFunnel.plusTwo?.length || 0).toLocaleString()}
                                color="#d946ef"
                                onClick={() => setSelectedUsers({ label: 'Users using 2 Credits', ids: creditFunnel.plusTwo })}
                            />
                            <FunnelConnector
                                percentage={((creditFunnel.plusThree?.length && creditFunnel.signUp?.length) ? ((creditFunnel.plusThree.length / creditFunnel.signUp.length) * 100).toFixed(1) + '%' : '0%')}
                                label="3 Credits"
                            />
                            <FunnelStep
                                label="3 Credits"
                                value={(creditFunnel.plusThree?.length || 0).toLocaleString()}
                                color="#ec4899"
                                onClick={() => setSelectedUsers({ label: 'Users using 3 Credits', ids: creditFunnel.plusThree })}
                            />
                            <FunnelConnector
                                percentage={((creditFunnel.plusFour?.length && creditFunnel.signUp?.length) ? ((creditFunnel.plusFour.length / creditFunnel.signUp.length) * 100).toFixed(1) + '%' : '0%')}
                                label="4 Credits"
                            />
                            <FunnelStep
                                label="4 Credits"
                                value={(creditFunnel.plusFour?.length || 0).toLocaleString()}
                                color="#f43f5e"
                                onClick={() => setSelectedUsers({ label: 'Users using 4 Credits', ids: creditFunnel.plusFour })}
                            />
                            <FunnelConnector
                                percentage={((creditFunnel.limitReached?.length && creditFunnel.signUp?.length) ? ((creditFunnel.limitReached.length / creditFunnel.signUp.length) * 100).toFixed(1) + '%' : '0%')}
                                label="Limit"
                            />
                            <FunnelStep
                                label="Reached Limit"
                                value={(creditFunnel.limitReached?.length || 0).toLocaleString()}
                                color="#10b981"
                                onClick={() => setSelectedUsers({ label: 'Users hitting Limit', ids: creditFunnel.limitReached })}
                                isLast
                            />
                        </div>
                    </div>

                    {/* Scroll Depth Section */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Scroll Depth (To Be Developed)</h2>
                        <div style={{ height: '250px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={scrollDepthData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)' }} width={50} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} name="Visitors" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}

            {/* Clickable Users Modal */}
            {selectedUsers && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1f2937', padding: '2rem', borderRadius: '12px', minWidth: '300px', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#fff' }}>{selectedUsers.label} ({selectedUsers.ids.length})</h3>
                            <button onClick={() => setSelectedUsers(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><XCircle size={24} /></button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#fff' }}>
                            {selectedUsers.ids.length > 0 ? selectedUsers.ids.map(id => (
                                <div key={id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                    {id}
                                </div>
                            )) : (
                                <div style={{ color: 'rgba(255,255,255,0.5)', padding: '1rem', textAlign: 'center' }}>No users found for this stage.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FunnelStep({ label, value, color, isLast, onClick }: any) {
    return (
        <div style={{ flex: 1, minWidth: '120px', textAlign: 'left', position: 'relative' }}>
            <div
                onClick={onClick}
                style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: color,
                    marginBottom: '0.5rem',
                    cursor: onClick ? 'pointer' : 'default',
                    textDecoration: onClick ? 'underline' : 'none'
                }}>
                {value}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                {label}
            </div>
        </div>
    );
}

function FunnelConnector({ percentage, label }: any) {
    return (
        <div style={{
            flex: 1,
            minWidth: '100px',
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
        <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
