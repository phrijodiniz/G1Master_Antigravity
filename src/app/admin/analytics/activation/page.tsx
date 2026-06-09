"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MousePointerClick, PlayCircle, XCircle, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    const activationFunnel = data?.activationFunnel || {};

    const signUpCount = activationFunnel.signUp?.length || 0;
    const tookFreeTestCount = activationFunnel.tookFreeTest?.length || 0;
    const tookAtLeastOnePracticeCount = activationFunnel.tookAtLeastOnePractice?.length || 0;
    const tookTwoOrMorePracticeCount = activationFunnel.tookTwoOrMorePractice?.length || 0;
    const tookThreeOrMorePracticeCount = activationFunnel.tookThreeOrMorePractice?.length || 0;
    const initiatedCheckoutCount = activationFunnel.initiatedCheckout?.length || 0;
    const paidCount = activationFunnel.paid?.length || 0;

    const getStepPercentage = (current: number, previous: number) => {
        if (!previous) return '0.0%';
        return `${((current / previous) * 100).toFixed(1)}%`;
    };

    const getTotalPercentage = (current: number) => {
        if (!signUpCount) return '0.0%';
        return `${((current / signUpCount) * 100).toFixed(1)}%`;
    };

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


                        {/* Funnel Section */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'rgba(255,255,255,0.7)' }}>
                                Free Test Funnel
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <FunnelStep
                                    label="Started Test"
                                    value={(freeTest.started || 0).toLocaleString()}
                                    color="#6366f1"
                                />
                                <FunnelConnector
                                    percentage={((freeTest.completed && freeTest.started) ? ((freeTest.completed / freeTest.started) * 100).toFixed(1) + '%' : '0%')}
                                    label="Completed"
                                />
                                <FunnelStep
                                    label="Completed Test"
                                    value={(freeTest.completed || 0).toLocaleString()}
                                    color="#ec4899"
                                />
                                <FunnelConnector
                                    percentage={((freeTest.conversions && freeTest.completed) ? ((freeTest.conversions / freeTest.completed) * 100).toFixed(1) + '%' : '0%')}
                                    label="Sign Up Rate"
                                />
                                <FunnelStep
                                    label="Initiated Sign Up"
                                    value={(freeTest.conversions || 0).toLocaleString()}
                                    color="#fbbf24"
                                />
                                <FunnelConnector
                                    percentage={((signUpCount && freeTest.conversions) ? ((signUpCount / freeTest.conversions) * 100).toFixed(1) + '%' : '0%')}
                                    label="Registration Rate"
                                />
                                <FunnelStep
                                    label="Sign Up"
                                    value={(signUpCount || 0).toLocaleString()}
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

                    {/* Signup Activation & Behavior Funnel Card */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Signup Activation & Behavior Funnel</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            Click on any funnel stage label or user count to view the list of users at that stage.
                        </p>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Funnel Stage</th>
                                        <th style={{ textAlign: 'right', padding: '1rem 1.5rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Users</th>
                                        <th style={{ textAlign: 'right', padding: '1rem 1.5rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Step-to-Step Conversion</th>
                                        <th style={{ textAlign: 'right', padding: '1rem 1.5rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>% of Total Signups</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        {
                                            label: "1. Signed Up",
                                            value: signUpCount,
                                            stepConv: "100.0%",
                                            totalConv: "100.0%",
                                            color: "#6366f1",
                                            onClick: () => setSelectedUsers({ label: 'Signed Up Users', ids: activationFunnel.signUp || [] })
                                        },
                                        {
                                            label: "2. Saved Free Test",
                                            value: tookFreeTestCount,
                                            stepConv: getStepPercentage(tookFreeTestCount, signUpCount),
                                            totalConv: getTotalPercentage(tookFreeTestCount),
                                            color: "#8b5cf6",
                                            onClick: () => setSelectedUsers({ label: 'Users who saved homepage Free Test', ids: activationFunnel.tookFreeTest || [] })
                                        },
                                        {
                                            label: "3. Took >= 1 Practice",
                                            value: tookAtLeastOnePracticeCount,
                                            stepConv: getStepPercentage(tookAtLeastOnePracticeCount, tookFreeTestCount),
                                            totalConv: getTotalPercentage(tookAtLeastOnePracticeCount),
                                            color: "#d946ef",
                                            onClick: () => setSelectedUsers({ label: 'Users who took at least 1 practice test', ids: activationFunnel.tookAtLeastOnePractice || [] })
                                        },
                                        {
                                            label: "4. Took >= 2 Practice",
                                            value: tookTwoOrMorePracticeCount,
                                            stepConv: getStepPercentage(tookTwoOrMorePracticeCount, tookAtLeastOnePracticeCount),
                                            totalConv: getTotalPercentage(tookTwoOrMorePracticeCount),
                                            color: "#ec4899",
                                            onClick: () => setSelectedUsers({ label: 'Users who took at least 2 practice tests', ids: activationFunnel.tookTwoOrMorePractice || [] })
                                        },
                                        {
                                            label: "5. Took All 3 Free Tests",
                                            value: tookThreeOrMorePracticeCount,
                                            stepConv: getStepPercentage(tookThreeOrMorePracticeCount, tookTwoOrMorePracticeCount),
                                            totalConv: getTotalPercentage(tookThreeOrMorePracticeCount),
                                            color: "#f43f5e",
                                            onClick: () => setSelectedUsers({ label: 'Users who took all 3 free practice tests', ids: activationFunnel.tookThreeOrMorePractice || [] })
                                        },
                                        {
                                            label: "6. Initiated Checkout",
                                            value: initiatedCheckoutCount,
                                            stepConv: getStepPercentage(initiatedCheckoutCount, tookThreeOrMorePracticeCount),
                                            totalConv: getTotalPercentage(initiatedCheckoutCount),
                                            color: "#fbbf24",
                                            onClick: () => setSelectedUsers({ label: 'Users who initiated checkout', ids: activationFunnel.initiatedCheckout || [] })
                                        },
                                        {
                                            label: "7. Paid for Unlimited Plan",
                                            value: paidCount,
                                            stepConv: getStepPercentage(paidCount, initiatedCheckoutCount),
                                            totalConv: getTotalPercentage(paidCount),
                                            color: "#10b981",
                                            onClick: () => setSelectedUsers({ label: 'Premium Users (Paid)', ids: activationFunnel.paid || [] })
                                        }
                                    ].map((row, idx) => (
                                        <tr 
                                            key={idx} 
                                            style={{ 
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                                            }}
                                        >
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 500 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: row.color, display: 'inline-block' }} />
                                                    <span 
                                                        onClick={row.onClick}
                                                        style={{ 
                                                            cursor: 'pointer', 
                                                            textDecoration: 'underline',
                                                            color: '#fff'
                                                        }}
                                                    >
                                                        {row.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                <span 
                                                    onClick={row.onClick}
                                                    style={{ 
                                                        cursor: 'pointer', 
                                                        textDecoration: 'underline',
                                                        color: row.color
                                                    }}
                                                >
                                                    {row.value.toLocaleString()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'rgba(255,255,255,0.8)' }}>
                                                {row.stepConv}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'rgba(255,255,255,0.8)' }}>
                                                {row.totalConv}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Retention & Credit Refill Engagement Section */}
                    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Credit Renewal & Retention (Non-Premium Users)</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Track the retention behavior of users who exhausted their initial 3 free practice tests without upgrading to Premium.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                            <div 
                                onClick={() => setSelectedUsers({ 
                                    label: 'Users who exhausted free credits (Non-Premium)', 
                                    ids: data?.creditRenewalStats?.exhaustedUsers || [] 
                                })}
                                style={{ 
                                    padding: '1.5rem', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    border: '1px solid rgba(255,255,255,0.05)', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Exhausted Free Credits</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f43f5e' }}>
                                    {(data?.creditRenewalStats?.exhaustedUsersCount || 0).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                                    Took all 3 free practice tests & have not upgraded.
                                </div>
                            </div>

                            <div 
                                onClick={() => setSelectedUsers({ 
                                    label: 'Users who returned after credit renewal (Non-Premium)', 
                                    ids: data?.creditRenewalStats?.returnedUsers || [] 
                                })}
                                style={{ 
                                    padding: '1.5rem', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    border: '1px solid rgba(255,255,255,0.05)', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Returned After Credit Renewal</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {(data?.creditRenewalStats?.returnedUsersCount || 0).toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                                    Took at least 1 more practice test after their 3-hour credit replenishment.
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Retention Rate</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                                    {data?.creditRenewalStats?.exhaustedUsersCount 
                                        ? `${((data.creditRenewalStats.returnedUsersCount / data.creditRenewalStats.exhaustedUsersCount) * 100).toFixed(1)}%` 
                                        : '0.0%'
                                    }
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                                    % of credit-exhausted users who returned.
                                </div>
                            </div>
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
                            {selectedUsers.ids.length > 0 ? selectedUsers.ids.map(id => {
                                const isCheckout = selectedUsers.label === 'Users who initiated checkout';
                                const detail = isCheckout 
                                    ? data?.checkoutDetails?.find((d: any) => d.email.toLowerCase() === id.toLowerCase())
                                    : null;
                                const creditsUsed = detail ? detail.creditsUsed : null;

                                const isReturned = selectedUsers.label === 'Users who returned after credit renewal (Non-Premium)';
                                const returnedDetail = isReturned
                                    ? data?.creditRenewalStats?.returnedDetails?.find((d: any) => d.email.toLowerCase() === id.toLowerCase())
                                    : null;

                                const isExhaustedOrReturned = 
                                    selectedUsers.label === 'Users who exhausted free credits (Non-Premium)' ||
                                    selectedUsers.label === 'Users who returned after credit renewal (Non-Premium)';
                                const exhaustedDetail = isExhaustedOrReturned
                                    ? data?.creditRenewalStats?.exhaustedDetails?.find((d: any) => d.email.toLowerCase() === id.toLowerCase())
                                    : null;

                                return (
                                    <div 
                                        key={id} 
                                        style={{ 
                                            padding: '1rem', 
                                            background: 'rgba(255,255,255,0.03)', 
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '8px', 
                                            fontSize: '0.9rem', 
                                            wordBreak: 'break-all',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <div style={{ color: '#f3f4f6', fontWeight: 500 }}>
                                            {id}
                                        </div>
                                        {creditsUsed !== null && (
                                            <div style={{ display: 'flex' }}>
                                                <span 
                                                    style={{ 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 600,
                                                        color: '#fbbf24',
                                                        backgroundColor: 'rgba(251, 191, 36, 0.1)', 
                                                        padding: '0.25rem 0.5rem', 
                                                        borderRadius: '4px',
                                                        border: '1px solid rgba(251, 191, 36, 0.2)'
                                                    }}
                                                >
                                                    {creditsUsed} {creditsUsed === 1 ? 'credit' : 'credits'} used before checkout
                                                </span>
                                            </div>
                                        )}
                                        {returnedDetail && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                                                    ⏱️ Credit Replenished: {new Date(returnedDetail.renewalTime).toLocaleString('en-CA', {
                                                        timeZone: 'America/New_York',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false
                                                    })} EST
                                                </div>
                                                <div style={{ display: 'flex' }}>
                                                    <span 
                                                        style={{ 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: 600,
                                                            color: '#3b82f6',
                                                            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                                                            padding: '0.25rem 0.5rem', 
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(59, 130, 246, 0.2)'
                                                        }}
                                                    >
                                                        Returned and took {returnedDetail.additionalTestsCount} more practice test{returnedDetail.additionalTestsCount === 1 ? '' : 's'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {exhaustedDetail && (
                                            <div style={{ display: 'flex' }}>
                                                <span 
                                                    style={{ 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 600,
                                                        color: exhaustedDetail.hasFreeTest ? '#10b981' : '#ef4444',
                                                        backgroundColor: exhaustedDetail.hasFreeTest ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                                        padding: '0.25rem 0.5rem', 
                                                        borderRadius: '4px',
                                                        border: exhaustedDetail.hasFreeTest ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                                                    }}
                                                >
                                                    {exhaustedDetail.hasFreeTest ? '✅ Took Homepage Free Mock Test' : '❌ Skipped Homepage Free Mock Test'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
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
