"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, DollarSign, Activity, RefreshCw, TrendingUp, CreditCard, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/services/analyticsExample';
import AnalyticsDatePicker from '@/components/admin/AnalyticsDatePicker';
import EventTimelineWidget from '@/components/admin/EventTimelineWidget';

export default function ReportPage() {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [acquisitionData, setAcquisitionData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [activationData, setActivationData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [revenueData, setRevenueData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Comparison Mode States
    const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [acquisitionDataB, setAcquisitionDataB] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [activationDataB, setActivationDataB] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [revenueDataB, setRevenueDataB] = useState<any>(null);

    // Default Date Range: June 6th, 2026 to Today
    const [dateRange, setDateRange] = useState({
        startDate: new Date('2026-06-06'),
        endDate: new Date(), // Today
        label: 'Custom Range'
    });

    // Default Date Range B helper (preceding offset matching duration of Range A)
    const getDefaultRangeB = (rangeA: { startDate: Date; endDate: Date }) => {
        const durationMs = rangeA.endDate.getTime() - rangeA.startDate.getTime();
        const end = new Date(rangeA.startDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before A start
        const start = new Date(end.getTime() - durationMs);
        return {
            startDate: start,
            endDate: end,
            label: 'Previous Period'
        };
    };

    const [dateRangeB, setDateRangeB] = useState<{ startDate: Date; endDate: Date; label: string }>(() => {
        return getDefaultRangeB({ startDate: new Date('2026-06-06'), endDate: new Date() });
    });

    const startStr = dateRange.startDate.toLocaleDateString('en-CA');
    const endStr = dateRange.endDate.toLocaleDateString('en-CA');

    const startStrB = dateRangeB.startDate.toLocaleDateString('en-CA');
    const endStrB = dateRangeB.endDate.toLocaleDateString('en-CA');

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
                const acqJson = await acqRes.json();

                // Fetch Activation data
                const actRes = await fetch(`/api/analytics/activation?startDate=${startStr}&endDate=${endStr}`);
                if (!actRes.ok) {
                    throw new Error('Failed to load activation data');
                }
                const actJson = await actRes.json();

                // Fetch Revenue data
                const revRes = await fetch(`/api/analytics/revenue?startDate=${startStr}&endDate=${endStr}`);
                if (!revRes.ok) {
                    throw new Error('Failed to load revenue data');
                }
                const revJson = await revRes.json();

                setAcquisitionData(acqJson);
                setActivationData(actJson);
                setRevenueData(revJson);

                if (isComparisonEnabled) {
                    // Fetch Acquisition data B
                    const acqResB = await fetch(`/api/analytics/acquisition?startDate=${startStrB}&endDate=${endStrB}`);
                    if (!acqResB.ok) {
                        throw new Error('Failed to load comparison acquisition data');
                    }
                    const acqJsonB = await acqResB.json();

                    // Fetch Activation data B
                    const actResB = await fetch(`/api/analytics/activation?startDate=${startStrB}&endDate=${endStrB}`);
                    if (!actResB.ok) {
                        throw new Error('Failed to load comparison activation data');
                    }
                    const actJsonB = await actResB.json();

                    // Fetch Revenue data B
                    const revResB = await fetch(`/api/analytics/revenue?startDate=${startStrB}&endDate=${endStrB}`);
                    if (!revResB.ok) {
                        throw new Error('Failed to load comparison revenue data');
                    }
                    const revJsonB = await revResB.json();

                    setAcquisitionDataB(acqJsonB);
                    setActivationDataB(actJsonB);
                    setRevenueDataB(revJsonB);
                } else {
                    setAcquisitionDataB(null);
                    setActivationDataB(null);
                    setRevenueDataB(null);
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'An unexpected error occurred while fetching report data.');
            } finally {
                setLoading(false);
            }
        }

        fetchReportData();
    }, [startStr, endStr, isComparisonEnabled, startStrB, endStrB]);

    const handlePrint = () => {
        window.print();
    };

    // Calculation variables
    const acqSummary = acquisitionData?.summary || {};
    const actFunnel = activationData?.activationFunnel || {};
    const freeTest = activationData?.freeTest || {};
    const creditStats = activationData?.creditRenewalStats || {};
    const revSummary = revenueData?.summary || {};

    const grossRevenue = revSummary.totalGross || 0;
    const refundedRevenue = revSummary.totalRefunded || 0;
    const totalCosts = revSummary.totalOutflow || 0;
    const netProfit = revSummary.netProfit || 0;
    const paidUpgrades = revSummary.totalPaidConversions || 0;

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

    // Calculation variables B
    const acqSummaryB = acquisitionDataB?.summary || {};
    const actFunnelB = activationDataB?.activationFunnel || {};
    const freeTestB = activationDataB?.freeTest || {};
    const creditStatsB = activationDataB?.creditRenewalStats || {};
    const revSummaryB = revenueDataB?.summary || {};

    const grossRevenueB = revSummaryB.totalGross || 0;
    const refundedRevenueB = revSummaryB.totalRefunded || 0;
    const totalCostsB = revSummaryB.totalOutflow || 0;
    const netProfitB = revSummaryB.netProfit || 0;
    const paidUpgradesB = revSummaryB.totalPaidConversions || 0;

    const totalAdSpentB = acqSummaryB.totalSpend || 0;
    const totalSignupsB = acqSummaryB.totalSignups || 0;
    const costPerSignupB = totalSignupsB > 0 ? totalAdSpentB / totalSignupsB : 0;
    const googleSignupsB = acqSummaryB.totalGoogleSignups || 0;
    const emailSignupsB = acqSummaryB.totalEmailSignups || 0;

    const freeTestStartsB = freeTestB.started || 0;
    const completedFreeTestsB = freeTestB.completed || 0;
    const usersInitiatedSignUpB = freeTestB.conversions || 0;
    const totalSignUpsActivationB = actFunnelB.signUp?.length || 0;

    const signUpCountB = actFunnelB.signUp?.length || 0;
    const tookFreeTestCountB = actFunnelB.tookFreeTest?.length || 0;
    const tookAtLeastOnePracticeCountB = actFunnelB.tookAtLeastOnePractice?.length || 0;
    const tookTwoOrMorePracticeCountB = actFunnelB.tookTwoOrMorePractice?.length || 0;
    const tookThreeOrMorePracticeCountB = actFunnelB.tookThreeOrMorePractice?.length || 0;
    const initiatedCheckoutCountB = actFunnelB.initiatedCheckout?.length || 0;
    const paidCountB = actFunnelB.paid?.length || 0;

    const exhaustedFreeCreditsB = creditStatsB.exhaustedUsersCount || 0;
    const returnedAfterCreditRenewalB = creditStatsB.returnedUsersCount || 0;
    const retentionRateB = exhaustedFreeCreditsB > 0 ? (returnedAfterCreditRenewalB / exhaustedFreeCreditsB) * 100 : 0;

    // Date range details & scaling helpers
    const getDaysDifference = (start: Date, end: Date) => {
        const timeDiff = Math.abs(end.getTime() - start.getTime());
        return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    };

    const daysA = getDaysDifference(dateRange.startDate, dateRange.endDate);
    const daysB = getDaysDifference(dateRangeB.startDate, dateRangeB.endDate);
    const durationScaleFactor = isComparisonEnabled ? daysA / daysB : 1;
    const isDurationMismatch = isComparisonEnabled && daysA !== daysB;

    const getPercentageChange = (valA: number, valB: number, shouldScale: boolean = false) => {
        const normalizedB = shouldScale ? valB * durationScaleFactor : valB;
        if (normalizedB === 0) {
            return valA > 0 ? 100 : 0;
        }
        return Math.round(((valA - normalizedB) / normalizedB) * 100);
    };

    const renderVarianceBadge = (valA: number, valB: number, shouldScale: boolean = false, inverse: boolean = false) => {
        if (!isComparisonEnabled) return null;
        const change = getPercentageChange(valA, valB, shouldScale);
        const isPositive = change >= 0;
        const isGood = inverse ? !isPositive : isPositive;
        const sign = isPositive ? '▲' : '▼';
        const color = change === 0 ? '#94a3b8' : (isGood ? '#10b981' : '#ef4444');
        
        return (
            <span style={{ color, fontSize: '0.8rem', fontWeight: 'bold', marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                {sign} {Math.abs(change)}%
            </span>
        );
    };

    const renderKPICard = (
        title: string,
        valA: number,
        valB: number,
        formatFn: (v: number) => string,
        shouldScale: boolean = false,
        inverse: boolean = false,
        subtextA: string = '',
        subtextB: string = ''
    ) => {
        return (
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="kpi-title" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{title}</span>
                    {renderVarianceBadge(valA, valB, shouldScale, inverse)}
                </div>
                {!isComparisonEnabled ? (
                    <>
                        <div className="kpi-val" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginTop: '0.25rem' }}>
                            {formatFn(valA)}
                        </div>
                        {subtextA && (
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.4rem' }}>
                                {subtextA}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', marginBottom: '0.4rem' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Period A</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{formatFn(valA)}</div>
                                {subtextA && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{subtextA}</div>}
                            </div>
                            <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Period B</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>{formatFn(valB)}</div>
                                {subtextB && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{subtextB}</div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const getStepPercentage = (current: number, previous: number) => {
        if (!previous) return '0.0%';
        return `${((current / previous) * 100).toFixed(1)}%`;
    };

    const getConversionAndDropStr = (current: number, previous: number) => {
        if (!previous) return 'Conversion: 0.0% | Drop: 100.0%';
        const conversionVal = (current / previous) * 100;
        const dropVal = Math.max(0, 100 - conversionVal);
        return `Conversion: ${conversionVal.toFixed(1)}% | Drop: ${dropVal.toFixed(1)}%`;
    };

    const getTotalPercentage = (current: number, total: number = signUpCount) => {
        if (!total) return '0.0%';
        return `${((current / total) * 100).toFixed(1)}%`;
    };

    const renderPercentageDiff = (pctStrA: string, pctStrB: string) => {
        if (!isComparisonEnabled) return null;
        const valA = parseFloat(pctStrA);
        const valB = parseFloat(pctStrB);
        if (isNaN(valA) || isNaN(valB)) return null;
        const diff = valA - valB;
        if (Math.abs(diff) < 0.05) {
            return <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>0.0%</span>;
        }
        const isPositive = diff > 0;
        const sign = isPositive ? '▲ +' : '▼ ';
        const color = isPositive ? '#10b981' : '#ef4444';
        return (
            <span style={{ color, fontWeight: 'bold', fontSize: '0.8rem' }}>
                {sign}{Math.abs(diff).toFixed(1)}%
            </span>
        );
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
                    .kpi-sub {
                        color: #64748b !important;
                        font-size: 0.7rem !important;
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
                @media screen and (min-width: 768px) {
                    .grid-4-cols-desktop {
                        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 0.8rem', borderRadius: '8px', color: 'white' }}>
                        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}>
                            <input 
                                type="checkbox" 
                                checked={isComparisonEnabled} 
                                onChange={(e) => setIsComparisonEnabled(e.target.checked)} 
                                style={{ cursor: 'pointer' }}
                            />
                            Compare Ranges
                        </label>
                    </div>
                    <AnalyticsDatePicker 
                        onDateChange={(newRange) => {
                            setDateRange(newRange);
                            // Auto-suggest preceding range B
                            const durationMs = newRange.endDate.getTime() - newRange.startDate.getTime();
                            const end = new Date(newRange.startDate.getTime() - 24 * 60 * 60 * 1000);
                            const start = new Date(end.getTime() - durationMs);
                            setDateRangeB({
                                startDate: start,
                                endDate: end,
                                label: 'Previous Period'
                            });
                        }} 
                        currentLabel={dateRange.label} 
                    />
                    {isComparisonEnabled && (
                        <>
                            <span style={{ opacity: 0.5, fontSize: '0.9rem', color: 'white' }}>vs</span>
                            <AnalyticsDatePicker 
                                onDateChange={setDateRangeB} 
                                currentLabel={dateRangeB.label} 
                            />
                        </>
                    )}
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
                    
                    {isDurationMismatch && (
                        <div className="no-print" style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', color: '#f59e0b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>⚠️</span>
                            <span><strong>Duration Mismatch:</strong> Period A ({daysA} days) and Period B ({daysB} days) have different lengths. Cumulative metrics for Period B are scaled by <strong>{durationScaleFactor.toFixed(2)}x</strong> to ensure comparison validity.</span>
                        </div>
                    )}

                    {/* Cover Header Section */}
                    <div className="report-card glass-panel" style={{ padding: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px', color: 'var(--primary)', fontWeight: 'bold' }}>Executive Summary</span>
                                <h1 style={{ fontSize: '2.25rem', marginTop: '0.25rem', fontWeight: 700 }}>
                                    {isComparisonEnabled ? 'G1 Master Comparison Report' : 'G1 Master Performance Report'}
                                </h1>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>GENERATED ON</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{formatDate(new Date())}</div>
                            </div>
                        </div>
                        <div className="grid-3-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div>
                                <div className="kpi-title" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>PERIOD A RANGE</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.25rem' }}>
                                    {formatDate(dateRange.startDate)} — {formatDate(dateRange.endDate)}{isToday(dateRange.endDate) ? ' (Today)' : ''}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '2px' }}>Duration: {daysA} {daysA === 1 ? 'day' : 'days'}</div>
                            </div>
                            {isComparisonEnabled ? (
                                <div>
                                    <div className="kpi-title" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>PERIOD B RANGE</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.25rem', color: 'rgba(255,255,255,0.8)' }}>
                                        {formatDate(dateRangeB.startDate)} — {formatDate(dateRangeB.endDate)}{isToday(dateRangeB.endDate) ? ' (Today)' : ''}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '2px' }}>Duration: {daysB} {daysB === 1 ? 'day' : 'days'}</div>
                                </div>
                            ) : (
                                <div>
                                    <div className="kpi-title" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>REPORT SCOPE</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.25rem' }}>Single Period Evaluation</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '2px' }}>No comparison target selected</div>
                                </div>
                            )}
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
                            {renderKPICard('Total Ad Spent', totalAdSpent, totalAdSpentB, formatCurrency, true, true)}
                            {renderKPICard('Total Sign Ups', totalSignups, totalSignupsB, (v) => v.toLocaleString(), true, false)}
                            {renderKPICard('Cost per Sign Up (CAC)', costPerSignup, costPerSignupB, formatCurrency, false, true)}
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

                    {/* Financial Performance */}
                    <div className="report-card glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', color: '#3b82f6' }}>
                                <TrendingUp size={20} />
                            </div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 600 }}>Financial Performance</h2>
                        </div>

                        <div className="grid-4-cols grid-4-cols-desktop" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {renderKPICard(
                                'Gross Revenue',
                                grossRevenue,
                                grossRevenueB,
                                formatCurrency,
                                true,
                                false,
                                `Refunds: ${formatCurrency(refundedRevenue)}`,
                                `Refunds: ${formatCurrency(refundedRevenueB)}`
                            )}
                            {renderKPICard(
                                'Total Costs',
                                totalCosts,
                                totalCostsB,
                                formatCurrency,
                                true,
                                true,
                                `Ad Spend: ${formatCurrency(revSummary.totalAdSpend || 0)} | Stripe: ${formatCurrency(revSummary.totalStripeFees || 0)}`,
                                `Ad Spend: ${formatCurrency(revSummaryB.totalAdSpend || 0)} | Stripe: ${formatCurrency(revSummaryB.totalStripeFees || 0)}`
                            )}
                            {renderKPICard(
                                'Net Profit',
                                netProfit,
                                netProfitB,
                                formatCurrency,
                                true,
                                false,
                                `ROAS: ${revSummary.roas || 0}x`,
                                `ROAS: ${revSummaryB.roas || 0}x`
                            )}
                            {renderKPICard(
                                'Paid Upgrades',
                                paidUpgrades,
                                paidUpgradesB,
                                (v) => v.toLocaleString(),
                                true,
                                false,
                                `AOV: ${formatCurrency(revSummary.aov || 0)} | CAC: ${formatCurrency(revSummary.cac || 0)}`,
                                `AOV: ${formatCurrency(revSummaryB.aov || 0)} | CAC: ${formatCurrency(revSummaryB.cac || 0)}`
                            )}
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
                            <div className="grid-4-cols grid-4-cols-desktop" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                {renderKPICard(
                                    'Free Landing Page Test Starts',
                                    freeTestStarts,
                                    freeTestStartsB,
                                    (v) => v.toLocaleString(),
                                    true,
                                    false,
                                    'Baseline',
                                    'Baseline'
                                )}
                                {renderKPICard(
                                    'Completed Free Tests',
                                    completedFreeTests,
                                    completedFreeTestsB,
                                    (v) => v.toLocaleString(),
                                    true,
                                    false,
                                    getConversionAndDropStr(completedFreeTests, freeTestStarts),
                                    getConversionAndDropStr(completedFreeTestsB, freeTestStartsB)
                                )}
                                {renderKPICard(
                                    '# Users Initiated Sign Up',
                                    usersInitiatedSignUp,
                                    usersInitiatedSignUpB,
                                    (v) => v.toLocaleString(),
                                    true,
                                    false,
                                    getConversionAndDropStr(usersInitiatedSignUp, completedFreeTests),
                                    getConversionAndDropStr(usersInitiatedSignUpB, completedFreeTestsB)
                                )}
                                {renderKPICard(
                                    '# Sign Ups',
                                    totalSignUpsActivation,
                                    totalSignUpsActivationB,
                                    (v) => v.toLocaleString(),
                                    true,
                                    false,
                                    getConversionAndDropStr(totalSignUpsActivation, usersInitiatedSignUp),
                                    getConversionAndDropStr(totalSignUpsActivationB, usersInitiatedSignUpB)
                                )}
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
                                            {!isComparisonEnabled ? (
                                                <>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Users</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Step-to-Step Conversion</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>% of Total Signups</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>A Users</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>B Users</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Variance</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>A Step Conv</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>B Step Conv</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Step Conv Var</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>A % Total</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>B % Total</th>
                                                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>% Total Var</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { 
                                                label: "1. Signed Up", 
                                                valA: signUpCount, 
                                                valB: signUpCountB, 
                                                stepA: "100.0%", 
                                                stepB: "100.0%", 
                                                totA: "100.0%", 
                                                totB: "100.0%", 
                                                color: "#6366f1" 
                                            },
                                            { 
                                                label: "2. Saved Free Test", 
                                                valA: tookFreeTestCount, 
                                                valB: tookFreeTestCountB, 
                                                stepA: getStepPercentage(tookFreeTestCount, signUpCount), 
                                                stepB: getStepPercentage(tookFreeTestCountB, signUpCountB), 
                                                totA: getTotalPercentage(tookFreeTestCount, signUpCount), 
                                                totB: getTotalPercentage(tookFreeTestCountB, signUpCountB), 
                                                color: "#8b5cf6" 
                                            },
                                            { 
                                                label: "3. Took >= 1 Practice", 
                                                valA: tookAtLeastOnePracticeCount, 
                                                valB: tookAtLeastOnePracticeCountB, 
                                                stepA: getStepPercentage(tookAtLeastOnePracticeCount, tookFreeTestCount), 
                                                stepB: getStepPercentage(tookAtLeastOnePracticeCountB, tookFreeTestCountB), 
                                                totA: getTotalPercentage(tookAtLeastOnePracticeCount, signUpCount), 
                                                totB: getTotalPercentage(tookAtLeastOnePracticeCountB, signUpCountB), 
                                                color: "#d946ef" 
                                            },
                                            { 
                                                label: "4. Took >= 2 Practice", 
                                                valA: tookTwoOrMorePracticeCount, 
                                                valB: tookTwoOrMorePracticeCountB, 
                                                stepA: getStepPercentage(tookTwoOrMorePracticeCount, tookAtLeastOnePracticeCount), 
                                                stepB: getStepPercentage(tookTwoOrMorePracticeCountB, tookAtLeastOnePracticeCountB), 
                                                totA: getTotalPercentage(tookTwoOrMorePracticeCount, signUpCount), 
                                                totB: getTotalPercentage(tookTwoOrMorePracticeCountB, signUpCountB), 
                                                color: "#ec4899" 
                                            },
                                            { 
                                                label: "5. Took All 3 Free Tests", 
                                                valA: tookThreeOrMorePracticeCount, 
                                                valB: tookThreeOrMorePracticeCountB, 
                                                stepA: getStepPercentage(tookThreeOrMorePracticeCount, tookTwoOrMorePracticeCount), 
                                                stepB: getStepPercentage(tookThreeOrMorePracticeCountB, tookTwoOrMorePracticeCountB), 
                                                totA: getTotalPercentage(tookThreeOrMorePracticeCount, signUpCount), 
                                                totB: getTotalPercentage(tookThreeOrMorePracticeCountB, signUpCountB), 
                                                color: "#f43f5e" 
                                            },
                                            { 
                                                label: "6. Initiated Checkout", 
                                                valA: initiatedCheckoutCount, 
                                                valB: initiatedCheckoutCountB, 
                                                stepA: getStepPercentage(initiatedCheckoutCount, tookThreeOrMorePracticeCount), 
                                                stepB: getStepPercentage(initiatedCheckoutCountB, tookThreeOrMorePracticeCountB), 
                                                totA: getTotalPercentage(initiatedCheckoutCount, signUpCount), 
                                                totB: getTotalPercentage(initiatedCheckoutCountB, signUpCountB), 
                                                color: "#fbbf24" 
                                            },
                                            { 
                                                label: "7. Paid for Unlimited Plan", 
                                                valA: paidCount, 
                                                valB: paidCountB, 
                                                stepA: getStepPercentage(paidCount, initiatedCheckoutCount), 
                                                stepB: getStepPercentage(paidCountB, initiatedCheckoutCountB), 
                                                totA: getTotalPercentage(paidCount, signUpCount), 
                                                totB: getTotalPercentage(paidCountB, signUpCountB), 
                                                color: "#10b981" 
                                            }
                                        ].map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color, display: 'inline-block' }} />
                                                        {row.label}
                                                    </div>
                                                </td>
                                                {!isComparisonEnabled ? (
                                                    <>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>{row.valA.toLocaleString()}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{row.stepA}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{row.totA}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold' }}>{row.valA.toLocaleString()}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>{row.valB.toLocaleString()}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                            {renderVarianceBadge(row.valA, row.valB, true, false)}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{row.stepA}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{row.stepB}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                            {renderPercentageDiff(row.stepA, row.stepB)}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{row.totA}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>{row.totB}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                            {renderPercentageDiff(row.totA, row.totB)}
                                                        </td>
                                                    </>
                                                )}
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
                                {renderKPICard('Exhausted Free Credits', exhaustedFreeCredits, exhaustedFreeCreditsB, (v) => v.toLocaleString(), true, true)}
                                {renderKPICard('Returned After Credit Renewal', returnedAfterCreditRenewal, returnedAfterCreditRenewalB, (v) => v.toLocaleString(), true, false)}
                                {renderKPICard('Retention Rate', retentionRate, retentionRateB, (v) => `${v.toFixed(1)}%`, false, false)}
                            </div>
                        </div>
                    </div>

                    {/* Business Event Timeline */}
                    <EventTimelineWidget startDate={dateRange.startDate} endDate={dateRange.endDate} />

                </div>
            )}
        </div>
    );
}
