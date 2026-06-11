"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/services/analyticsExample';
import AnalyticsDatePicker from '@/components/admin/AnalyticsDatePicker';

export default function ReportPage() {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [acquisitionData, setAcquisitionData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [activationData, setActivationData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Default Date Range: June 6th, 2026 to Today
    const [dateRange, setDateRange] = useState({
        startDate: new Date('2026-06-06'),
        endDate: new Date(), // Today
        label: 'Custom Range'
    });

    const startStr = dateRange.startDate.toLocaleDateString('en-CA');
    const endStr = dateRange.endDate.toLocaleDateString('en-CA');

    useEffect(() => {
        async function fetchReportData() {
            setLoading(true);
            setError(null);
            try {
                // Fetch Acquisition data
                const acqRes = await fetch(`/api/analytics/acquisition?startDate=${startStr}&endDate=${endStr}`);
                if (!acqRes.ok) {
                    throw new Error('Failed to load acquisition data');
                }
                const acqJson = await acqRes.ok ? await acqRes.json() : null;

                // Fetch Activation data
                const actRes = await fetch(`/api/analytics/activation?startDate=${startStr}&endDate=${endStr}`);
                if (!actRes.ok) {
                    throw new Error('Failed to load activation data');
                }
                const actJson = await actRes.ok ? await actRes.json() : null;

                setAcquisitionData(acqJson);
                setActivationData(actJson);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'An unexpected error occurred while fetching report data.');
            } finally {
                setLoading(false);
            }
        }

        fetchReportData();
    }, [startStr, endStr]);

    const handlePrint = () => {
        window.print();
    };

    // Calculation variables
    const acqSummary = acquisitionData?.summary || {};
    const actFunnel = activationData?.activationFunnel || {};
    const freeTest = activationData?.freeTest || {};
    const creditStats = activationData?.creditRenewalStats || {};

    const totalAdSpent = acqSummary.totalSpend || 0;
    const totalSignups = acqSummary.totalSignups || 0;
    const costPerSignup = totalSignups > 0 ? totalAdSpent / totalSignups : 0;
    const googleSignups = acqSummary.totalGoogleSignups || 0;
    const emailSignups = acqSummary.totalEmailSignups || 0;

    const freeTestStarts = freeTest.started || 0;
    const completedFreeTests = freeTest.completed || 0;
    const usersInitiatedSignUp = freeTest.conversions || 0;
    const totalSignUpsActivation = actFunnel.signUp?.length || 0;

    const signUpCount = actFunnel.signUp?.length || 0;
    const tookFreeTestCount = actFunnel.tookFreeTest?.length || 0;
    const tookAtLeastOnePracticeCount = actFunnel.tookAtLeastOnePractice?.length || 0;
    const tookTwoOrMorePracticeCount = actFunnel.tookTwoOrMorePractice?.length || 0;
    const tookThreeOrMorePracticeCount = actFunnel.tookThreeOrMorePractice?.length || 0;
    const initiatedCheckoutCount = actFunnel.initiatedCheckout?.length || 0;
    const paidCount = actFunnel.paid?.length || 0;

    const exhaustedFreeCredits = creditStats.exhaustedUsersCount || 0;
    const returnedAfterCreditRenewal = creditStats.returnedUsersCount || 0;
    const retentionRate = exhaustedFreeCredits > 0 ? (returnedAfterCreditRenewal / exhaustedFreeCredits) * 100 : 0;

    const getStepPercentage = (current: number, previous: number) => {
        if (!previous) return '0.0%';
        return `${((current / previous) * 100).toFixed(1)}%`;
    };

    const getTotalPercentage = (current: number) => {
        if (!signUpCount) return '0.0%';
        return `${((current / signUpCount) * 100).toFixed(1)}%`;
    };

    // Check if a date is today
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Format display dates
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Custom Print CSS */}
            <style jsx global>{`
                @media print {
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        font-size: 11px !important;
                    }
                    header, .no-print, button, .back-button {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .report-wrapper {
                        padding: 0 !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        gap: 1rem !important;
                    }
                    .report-card {
                        background: #ffffff !important;
                        border: 1px solid #cbd5e1 !important;
                        color: #000000 !important;
                        box-shadow: none !important;
                        margin-bottom: 1rem !important;
                        page-break-inside: avoid;
                        padding: 1rem !important;
                    }
                    h1 {
                        font-size: 1.5rem !important;
                    }
                    h2 {
                        font-size: 1.15rem !important;
                    }
                    h3 {
                        font-size: 0.95rem !important;
                    }
                    table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        color: #000000 !important;
                    }
                    th {
                        color: #334155 !important;
                        border-bottom: 2px solid #475569 !important;
                        background-color: #f1f5f9 !important;
                        padding: 0.4rem 0.6rem !important;
                    }
                    td {
                        color: #000000 !important;
                        border-bottom: 1px solid #e2e8f0 !important;
                        padding: 0.4rem 0.6rem !important;
                    }
                    .kpi-title {
                        color: #475569 !important;
                        font-size: 0.75rem !important;
                    }
                    .kpi-val {
                        color: #0f172a !important;
                        font-size: 1.2rem !important;
                    }
                    .grid-3-cols, .grid-4-cols {
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 0.75rem !important;
                        width: 100% !important;
                    }
                    .grid-3-cols > div, .grid-4-cols > div {
                        flex: 1 !important;
                        min-width: 0 !important;
                        padding: 0.5rem 0.75rem !important;
                    }
                }
            `}</style>

            {/* Back to Analytics Button */}
            <button
                onClick={() => router.push('/admin/analytics')}
                className="back-button no-print"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                    padding: 0
                }}
            >
                <ArrowLeft size={16} />
                Back to Analytics
            </button>

            {/* Actions Bar */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Analytics PDF Report</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                        Generate and print a formatted performance report.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <AnalyticsDatePicker onDateChange={setDateRange} currentLabel={dateRange.label} />
                    {!loading && !error && (
                        <button
                            onClick={handlePrint}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.95rem',
                                padding: '0.6rem 1.2rem'
                            }}
                        >
                            <Printer size={18} />
                            Download PDF Report
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="glass-panel" style={{ padding: '4rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                    <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                    Loading report metrics and sheets data...
                </div>
            ) : error ? (
                <div className="glass-panel" style={{ padding: '3rem', color: '#ef4444', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Failed to Load Report Data</h3>
                    <p style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '1.5rem' }}>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn-secondary">
                        Retry Fetch
                    </button>
                </div>
            ) : (
                <div className="report-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Cover Header Section */}
                    <div className="report-card glass-panel" style={{ padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px', color: 'var(--primary)', fontWeight: 'bold' }}>Executive Summary</span>
                                <h1 style={{ fontSize: '2.25rem', marginTop: '0.25rem', fontWeight: 700 }}>G1 Master Performance Report</h1>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>GENERATED ON</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{formatDate(new Date())}</div>
                            </div>
                        </div>
                        <div className="grid-3-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <div className="kpi-title" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>START DATE</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.25rem' }}>{formatDate(dateRange.startDate)}</div>
                            </div>
                            <div>
                                <div className="kpi-title" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>END DATE</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.25rem' }}>{formatDate(dateRange.endDate)}{isToday(dateRange.endDate) ? ' (Today)' : ''}</div>
                            </div>
                            <div>
                                <div className="kpi-title" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>STATUS</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10b981', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                    Active / Compiled
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Acquisition Analytics */}
                    <div className="report-card glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(225,255,33,0.1)', borderRadius: '8px', color: 'var(--primary)' }}>
                                <DollarSign size={20} />
                            </div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Acquisition Analytics</h2>
                        </div>

                        <div className="grid-3-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Total Ad Spent</div>
                                <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginTop: '0.25rem' }}>
                                    {formatCurrency(totalAdSpent)}
                                </div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Total Sign Ups</div>
                                <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginTop: '0.25rem' }}>
                                    {totalSignups.toLocaleString()}
                                </div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Cost per Sign Up (CAC)</div>
                                <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginTop: '0.25rem' }}>
                                    {formatCurrency(costPerSignup)}
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Google and Email Sign Up */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>Signup Method Breakdown</h3>
                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                        <span>Google Sign In</span>
                                        <span style={{ fontWeight: 'bold' }}>{googleSignups} ({totalSignups > 0 ? Math.round(googleSignups / totalSignups * 100) : 0}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${totalSignups > 0 ? (googleSignups / totalSignups * 100) : 0}%`, background: '#4285F4' }} />
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                        <span>Email Sign Up</span>
                                        <span style={{ fontWeight: 'bold' }}>{emailSignups} ({totalSignups > 0 ? Math.round(emailSignups / totalSignups * 100) : 0}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${totalSignups > 0 ? (emailSignups / totalSignups * 100) : 0}%`, background: '#10B981' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activation & Behavior */}
                    <div className="report-card glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', color: '#10b981' }}>
                                <Activity size={20} />
                            </div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Activation & Behavior</h2>
                        </div>

                        {/* Free Test Engagement Sub-Section */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                                Free Test Engagement
                            </h3>
                            <div className="grid-4-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Free Landing Page Test Starts</div>
                                    <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{freeTestStarts.toLocaleString()}</div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Completed Free Tests</div>
                                    <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{completedFreeTests.toLocaleString()}</div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}># Users Initiated Sign Up</div>
                                    <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{usersInitiatedSignUp.toLocaleString()}</div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}># Sign Ups</div>
                                    <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{totalSignUpsActivation.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Signup Activation & Behavior Funnel Sub-Section */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                                Signup Activation & Behavior Funnel
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                                            <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Funnel Stage</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Users</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Step-to-Step Conversion</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>% of Total Signups</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { label: "1. Signed Up", value: signUpCount, stepConv: "100.0%", totalConv: "100.0%", color: "#6366f1" },
                                            { label: "2. Saved Free Test", value: tookFreeTestCount, stepConv: getStepPercentage(tookFreeTestCount, signUpCount), totalConv: getTotalPercentage(tookFreeTestCount), color: "#8b5cf6" },
                                            { label: "3. Took >= 1 Practice", value: tookAtLeastOnePracticeCount, stepConv: getStepPercentage(tookAtLeastOnePracticeCount, tookFreeTestCount), totalConv: getTotalPercentage(tookAtLeastOnePracticeCount), color: "#d946ef" },
                                            { label: "4. Took >= 2 Practice", value: tookTwoOrMorePracticeCount, stepConv: getStepPercentage(tookTwoOrMorePracticeCount, tookAtLeastOnePracticeCount), totalConv: getTotalPercentage(tookTwoOrMorePracticeCount), color: "#ec4899" },
                                            { label: "5. Took All 3 Free Tests", value: tookThreeOrMorePracticeCount, stepConv: getStepPercentage(tookThreeOrMorePracticeCount, tookTwoOrMorePracticeCount), totalConv: getTotalPercentage(tookThreeOrMorePracticeCount), color: "#f43f5e" },
                                            { label: "6. Initiated Checkout", value: initiatedCheckoutCount, stepConv: getStepPercentage(initiatedCheckoutCount, tookThreeOrMorePracticeCount), totalConv: getTotalPercentage(initiatedCheckoutCount), color: "#fbbf24" },
                                            { label: "7. Paid for Unlimited Plan", value: paidCount, stepConv: getStepPercentage(paidCount, initiatedCheckoutCount), totalConv: getTotalPercentage(paidCount), color: "#10b981" }
                                        ].map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color, display: 'inline-block' }} />
                                                        {row.label}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>{row.value.toLocaleString()}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{row.stepConv}</td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{row.totalConv}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Credit Renewal & Retention Sub-Section */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.25rem' }}>
                                Credit Renewal & Retention (Non-Premium Users)
                            </h3>
                            <div className="grid-3-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Exhausted Free Credits</div>
                                    <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f43f5e', marginTop: '0.25rem' }}>
                                        {exhaustedFreeCredits.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Returned After Credit Renewal</div>
                                    <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '0.25rem' }}>
                                        {returnedAfterCreditRenewal.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div className="kpi-title" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Retention Rate</div>
                                    <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.25rem' }}>
                                        {retentionRate.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
