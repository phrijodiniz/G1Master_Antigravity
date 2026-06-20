"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, DollarSign, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsDatePicker from '@/components/admin/AnalyticsDatePicker';

// Helper to format currency in CAD
const formatCAD = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
    }).format(amount);
};

export default function RevenueAnalyticsPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Helper to format Date to YYYY-MM-DD local timezone
    const formatDateYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Default to last 180 days to display mock/sandbox data on load
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 180)),
        endDate: new Date(),
        label: 'Last 180 Days'
    });

    useEffect(() => {
        async function fetchRevenueData() {
            setLoading(true);
            try {
                const start = formatDateYYYYMMDD(dateRange.startDate);
                const end = formatDateYYYYMMDD(dateRange.endDate);
                const res = await fetch(`/api/analytics/revenue?startDate=${start}&endDate=${end}`);
                
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    console.error('Failed to fetch revenue analytics data');
                }
            } catch (err) {
                console.error('Error fetching revenue data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchRevenueData();
    }, [dateRange]);

    const handleDateChange = (range: { startDate: Date; endDate: Date; label: string }) => {
        setDateRange(range);
    };

    const summary = data?.summary || {
        totalGross: 0,
        totalRefunded: 0,
        totalNetRevenue: 0,
        totalAdSpend: 0,
        totalStripeFees: 0,
        totalOutflow: 0,
        netProfit: 0,
        totalPaidConversions: 0,
        aov: 0,
        cac: 0,
        roas: 0
    };

    const dailyTrends = data?.dailyTrends || [];
    const promoDistribution = data?.promoDistribution || [];
    const ledger = data?.ledger || [];

    // Colors for the promo mix chart
    const COLORS = ['#e1ff21', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b', '#3b82f6'];

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
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Revenue & Profitability</h1>
                <AnalyticsDatePicker onDateChange={handleDateChange} currentLabel={dateRange.label} />
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.6 }}>
                    <div style={{
                        width: '30px',
                        height: '30px',
                        border: '3px solid rgba(225, 255, 33, 0.1)',
                        borderTop: '3px solid var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem auto'
                    }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    Loading financial data...
                </div>
            ) : !data ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
                    Failed to fetch financial transactions. Ensure Stripe credentials and Google Sheet configs are valid.
                </div>
            ) : (
                <>
                    {/* Financial KPI Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <KpiCard
                            title="Gross Revenue"
                            value={formatCAD(summary.totalGross)}
                            icon={DollarSign}
                            subtitle={`Refunds: ${formatCAD(summary.totalRefunded)}`}
                            color="#3b82f6"
                        />
                        <KpiCard
                            title="Total Costs"
                            value={formatCAD(summary.totalOutflow)}
                            icon={CreditCard}
                            subtitle={`Ad Spend: ${formatCAD(summary.totalAdSpend)} | Stripe: ${formatCAD(summary.totalStripeFees)}`}
                            color="#ef4444"
                        />
                        <KpiCard
                            title="Net Profit"
                            value={formatCAD(summary.netProfit)}
                            icon={TrendingUp}
                            subtitle={`ROAS: ${summary.roas}x`}
                            color={summary.netProfit >= 0 ? '#10b981' : '#ef4444'}
                        />
                        <KpiCard
                            title="Paid Upgrades"
                            value={`${summary.totalPaidConversions}`}
                            icon={ShieldCheck}
                            subtitle={`AOV: ${formatCAD(summary.aov)} | CAC: ${formatCAD(summary.cac)}`}
                            color="#e1ff21"
                        />
                    </div>

                    {/* Chart Section */}
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                        {/* Daily Trends Chart */}
                        <div className="glass-panel" style={{ flex: 2, minWidth: '350px', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.8 }}>Daily Financial Breakdown</h3>
                            <div style={{ height: '350px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailyTrends} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis 
                                            dataKey="date" 
                                            stroke="rgba(255,255,255,0.4)" 
                                            fontSize={11}
                                            tickFormatter={(str) => {
                                                const parts = str.split('-');
                                                return parts.length > 2 ? `${parts[1]}/${parts[2]}` : str;
                                            }}
                                        />
                                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            formatter={(value: any) => [formatCAD(value), '']}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" strokeWidth={2} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="marketingCost" stroke="#ef4444" name="Ad Spend" strokeWidth={2} />
                                        <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" strokeWidth={2.5} strokeDasharray="4 4" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Coupon Distribution Mix */}
                        <div className="glass-panel" style={{ flex: 1, minWidth: '280px', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.8 }}>Offer & Conversion Mix</h3>
                            <div style={{ height: '350px', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {promoDistribution.length === 0 ? (
                                    <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>No conversions in this period</p>
                                ) : (
                                    <>
                                        <div style={{ height: '240px', width: '100%' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={promoDistribution} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                                                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={10} width={80} />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                    />
                                                    <Bar dataKey="value" name="Upgrades">
                                                        {promoDistribution.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Simple Legend Breakdown */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
                                            {promoDistribution.map((entry: any, index: number) => (
                                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                    <span>{entry.name}: <strong>{entry.value}</strong></span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Transaction Ledger Table */}
                    <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.8 }}>Transaction Ledger</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', opacity: 0.6 }}>
                                        <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>User Email</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Promo Applied</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Gross</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Stripe Fee</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledger.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                                No transactions found in this period.
                                            </td>
                                        </tr>
                                    ) : (
                                        ledger.map((tx: any) => {
                                            const isRefund = tx.status === 'Refunded';
                                            return (
                                                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                                        {new Date(tx.date).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{tx.email}</td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                            {tx.coupon}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 'bold',
                                                            padding: '2px 8px',
                                                            borderRadius: '100px',
                                                            background: isRefund ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                            color: isRefund ? '#ef4444' : '#10b981',
                                                            border: isRefund ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)'
                                                        }}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: isRefund ? '#ef4444' : '#ffffff' }}>
                                                        {formatCAD(tx.gross)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', opacity: 0.6 }}>
                                                        {tx.fees > 0 ? formatCAD(tx.fees) : '—'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: isRefund ? '#ef4444' : '#10b981' }}>
                                                        {formatCAD(tx.net)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ComponentType<{ size: number }>;
    subtitle?: string;
    color: string;
}

function KpiCard({ title, value, icon: Icon, subtitle, color }: KpiCardProps) {
    return (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: `4px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{title}</span>
                <div style={{ color: color }}>
                    <Icon size={18} />
                </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{value}</div>
            {subtitle && <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{subtitle}</div>}
        </div>
    );
}
