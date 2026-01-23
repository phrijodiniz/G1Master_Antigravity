"use client";

import styles from "./history.module.css";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function HistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function fetchHistory() {
            if (authLoading) return;

            if (!user) {
                if (mounted) setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('simulation_results')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;

                if (mounted && data) {
                    setHistory(data);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchHistory();

        return () => {
            mounted = false;
        };
    }, [user, authLoading]);

    const getTestTypeLabel = (type: string) => {
        if (!type || type === 'Simulation') return <span className={`${styles.typeBadge} ${styles.typeSimulation}`}>G1 Simulation</span>;
        if (type === 'Road Signs') return <span className={`${styles.typeBadge} ${styles.typeRoadSigns}`}>Road Signs</span>;
        if (type === 'Rules of the Road') return <span className={`${styles.typeBadge} ${styles.typeRules}`}>Rules of Road</span>;
        return <span className={styles.typeBadge}>{type}</span>;
    };

    return (
        <DashboardLayout>
            <h1 className={styles.title}>Test History</h1>

            <div className={styles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading history...</div>
                ) : history.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        You haven't taken any tests yet.
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Test Type</th>
                                <th>Percentage</th>
                                <th>Rules Score</th>
                                <th>Signs Score</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        {new Date(item.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td>{getTestTypeLabel(item.test_type)}</td>
                                    <td style={{ fontWeight: 'bold' }}>{item.score}%</td>
                                    <td>{item.rules_score || 0} / 20</td>
                                    <td>{item.signs_score || 0} / 20</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${item.passed ? styles.passBadge : styles.failBadge}`}>
                                            {item.passed ? 'Passed' : 'Failed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>

    );
}
