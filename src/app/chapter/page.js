"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';
import styles from '../quiz/shared_quiz_layout.module.css';

export default function ChapterSelect() {
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchChapters() {
            // Fetch all chapters
            const { data, error } = await supabase
                .from('questions')
                .select('chapter');

            if (error) {
                console.error(error);
            } else {
                // Extract distinct chapters
                const uniqueChapters = [...new Set(data.map(item => item.chapter))].filter(Boolean).sort();
                setChapters(uniqueChapters);
            }
            setLoading(false);
        }
        fetchChapters();
    }, []);

    if (loading) return (
        <div className={styles.quizLayout}>
            <Sidebar />
            <div className={styles.mainWrapper}>
                <div style={{ padding: '3rem', color: '#64748b' }}>Loading Chapters...</div>
            </div>
        </div>
    );

    return (
        <div className={styles.quizLayout}>
            <Sidebar />
            <div className={styles.mainWrapper}>
                <div className={styles.header}>
                    <div className={styles.title}>Chapters</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href="/study" style={{ textDecoration: 'none' }}>
                            <button className={styles.exitBtn}>Back to Study</button>
                        </Link>
                    </div>
                </div>

                <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                    {chapters.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#64748b' }}>No chapters found.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {chapters.map((chapter) => (
                                <Link key={chapter} href={`/quiz/chapter?chapter=${encodeURIComponent(chapter)}`} style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        background: 'white',
                                        padding: '2rem',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{
                                            width: '50px', height: '50px', background: '#f1f5f9', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                                            fontSize: '1.5rem'
                                        }}>
                                            📖
                                        </div>
                                        <h3 style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 600 }}>{chapter}</h3>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>Start Practice</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
