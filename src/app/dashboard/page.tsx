"use client";

import { supabase } from "@/lib/supabaseClient";
import styles from "./dashboard.module.css";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import { Clock, Book, Video, FileText, Car } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
    const { user } = useAuth();
    // Helper to capitalize
    const formatName = (name: string) => {
        if (!name) return "";
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const meta = user?.user_metadata || {};
    const firstName = meta.first_name || "";
    const lastName = meta.last_name || "";

    let displayName = "User";
    if (firstName) {
        displayName = `${formatName(firstName)} ${formatName(lastName)}`.trim();
    } else if (user?.email) {
        displayName = user.email.split('@')[0];
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
    return (
        <div className={styles.mainLayout}>
            <Sidebar />
            <div className={styles.contentWrapper}>
                <TopBar />

                <div className={styles.dashboardGrid}>
                    {/* Middle Column */}
                    <div className={styles.leftColumn}>
                        <div className={styles.banner}>
                            <div className={styles.bannerDate}>{formattedDate}</div>
                            <div>
                                <h1 className={styles.bannerTitle}>Hello {displayName}</h1>
                                <p className={styles.bannerSubtitle}>
                                    Success on your G1 test comes from steady practice, not last-minute cramming.
                                </p>
                            </div>
                        </div>

                        <h2 className={styles.sectionTitle}>How do you feel like studying today?</h2>
                        <div className={styles.actionCardsGrid}>
                            <div className={styles.actionCard}>
                                <div className={styles.cardIcon}>
                                    <FileText size={48} strokeWidth={1.5} />
                                </div>
                                <h3 className={styles.actionTitle}>Practice Tests</h3>
                                <p className={styles.actionSubtitle}>Build confidence at your own pace.</p>
                                <p className={styles.actionDescription}>
                                    Start building your knowledge the smart way. Review Road Signs or Rules of the Road with instant feedback after every question.
                                </p>
                                <Link href="/practice">
                                    <button className={styles.actionBtn}>Practice Now</button>
                                </Link>
                            </div>

                            <div className={styles.actionCard}>
                                <div className={styles.cardIcon}>
                                    <Car size={48} strokeWidth={1.5} />
                                </div>
                                <h3 className={styles.actionTitle}>G1 Test Simulation</h3>
                                <p className={styles.actionSubtitle}>Test yourself just like the real exam.</p>
                                <p className={styles.actionDescription}>
                                    A true G1-style test with timed, mixed questions and no hints. Covers both Road Signs and Rules of the Road. See if you're ready to pass.
                                </p>
                                <Link href="/quiz/simulation">
                                    <button className={styles.actionBtn}>Take a Full Test</button>
                                </Link>
                            </div>
                        </div>

                    </div>

                    {/* Right Column */}
                    <div className={styles.widgetsColumn}>
                        {/* Exam Readiness Meter */}
                        <div className={`${styles.widget} glass-panel`}>
                            <h3 className={styles.sectionTitle}>Exam Readiness Meter</h3>
                            <ReadinessGauge />
                        </div>

                        {/* Test History */}
                        <div className={`${styles.widget} glass-panel`}>
                            <h3 className={styles.sectionTitle}>Test History</h3>
                            <TestHistoryTable />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function TestHistoryTable() {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        async function fetchHistory() {
            if (!user) return;
            // Fetch last 10 results
            const { data } = await supabase
                .from('simulation_results')
                .select('created_at, passed, score, test_type')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                // TEMP: Mock data to ensure 10 items are shown for visualization if user has few tests
                let allData = [...data];
                while (allData.length > 0 && allData.length < 10) {
                    allData = [...allData, ...data].slice(0, 10);
                }
                setHistory(allData);
            }
        }
        fetchHistory();
    }, [user]);

    if (history.length === 0) {
        return <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem' }}>No tests taken yet.</div>;
    }

    return (
        <div className={styles.historyListContainer}>
            <table className={styles.historyTable}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Test</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item, idx) => (
                        <tr key={idx}>
                            <td>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td>{item.test_type || 'Simulation'}</td>
                            <td>
                                <span className={`${styles.statusBadge} ${item.passed ? styles.passBadge : styles.failBadge}`}>
                                    {item.passed ? 'Pass' : 'Fail'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ReadinessGauge() {
    const { user } = useAuth();
    const [score, setScore] = useState(0);
    const [hasData, setHasData] = useState(false);
    // Imports for supabase are needed if not globally available, but here I can use the imported client
    // Waiting for 'supabase' to be available in scope or passed. 
    // Usually standard to import in file. I'll assume 'supabase' is not imported in global scope of this file yet if I didn't verify imports.
    // Wait, checking imports...

    useEffect(() => {
        async function fetchScore() {
            if (!user) return;

            const { data } = await supabase
                .from('simulation_results')
                .select('score')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10); // Last 10 simulations

            if (data && data.length > 0) {
                const avg = data.reduce((acc, curr) => acc + Number(curr.score), 0) / data.length;
                setScore(Math.round(avg)); // Integer
                setHasData(true);
            }
        }
        fetchScore();
    }, [user]);

    // Geometry Config - Standard SVG Angles
    // 0 = 3 o'clock. 90 = 6 o'clock. 180 = 9 o'clock. 270 = 12 o'clock.
    // We want a gauge from Bottom Left to Bottom Right.
    // Start: 160 degrees (approx 8 o'clock position)
    // End: 380 degrees (approx 4 o'clock position, 360+20)
    // Span: 220 degrees.
    const cx = 100;
    const cy = 100;
    const r = 80;
    const startDeg = 160;
    const endDeg = 380;

    const valueToAngle = (val: number) => {
        const v = Math.min(Math.max(val, 0), 100);
        return startDeg + (v / 100) * (endDeg - startDeg);
    };

    const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
        return {
            x: Number((cx + (r * Math.cos(angleInRadians))).toFixed(4)),
            y: Number((cy + (r * Math.sin(angleInRadians))).toFixed(4))
        };
    };

    // Draw Arc Helper
    const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, r, endAngle);
        const end = polarToCartesian(x, y, r, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        // Sweep flag 1 for clockwise direction in SVG
        return [
            "M", start.x, start.y,
            "A", r, r, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
    };

    // Needle
    const currentAngle = valueToAngle(score);
    const needleTip = polarToCartesian(cx, cy, r - 15, currentAngle);

    // Ticks
    const renderTicks = () => {
        const ticks = [];
        for (let i = 0; i <= 100; i += 2) {
            const isMajor = i % 10 === 0;
            const a = valueToAngle(i);
            // Ticks inside arc radius
            // r=80. Ticks from 68 to 78.
            const p1 = polarToCartesian(cx, cy, 68, a);
            const p2 = polarToCartesian(cx, cy, 78, a);

            ticks.push(
                <line
                    key={i}
                    x1={p1.x} y1={p1.y}
                    x2={p2.x} y2={p2.y}
                    stroke={isMajor ? "#334155" : "#cbd5e1"}
                    strokeWidth={isMajor ? 2 : 1}
                />
            );
        }
        return ticks;
    };

    return (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className={styles.gaugeContainer} style={{ marginBottom: 0 }}>
                <svg viewBox="0 0 200 130" width="200" height="130">
                    {/* Color Segments 
                        Red: 0-30 (Left)
                        Yellow: 30-80
                        Green: 80-100 (Right)
                        Stroke width 8 puts it centered on r=84 roughly? 
                        Band can be r=84 width=8.
                    */}
                    <path d={describeArc(cx, cy, 84, valueToAngle(0), valueToAngle(30))}
                        fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="butt" />

                    <path d={describeArc(cx, cy, 84, valueToAngle(30), valueToAngle(80))}
                        fill="none" stroke="#eab308" strokeWidth="8" strokeLinecap="butt" />

                    <path d={describeArc(cx, cy, 84, valueToAngle(80), valueToAngle(100))}
                        fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="butt" />

                    {/* Ticks */}
                    {renderTicks()}

                    {/* Score Text - Spaced out from arc, smaller size */}
                    {/* Placed below center to balance */}
                    <text x="100" y="125" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">
                        {hasData ? `${score}%` : "--"}
                    </text>

                    {/* Needle - On Top */}
                    <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                    <circle cx={cx} cy={cy} r="6" fill="#0f172a" />
                </svg>
            </div>
            <p className={styles.readinessText}>
                Your Readiness Meter reflects your latest G1 Test Simulations. Your score appears after your first simulation, but completing 10 simulations gives a more accurate view of your exam readiness.
            </p>
        </div>
    );
}
