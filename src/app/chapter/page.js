"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import styles from '../practice/practice.module.css';
import { BookOpen } from "lucide-react";

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
                // Calculate counts
                const counts = {};
                data.forEach(item => {
                    if (item.chapter) {
                        counts[item.chapter] = (counts[item.chapter] || 0) + 1;
                    }
                });

                // Create chapter objects
                const chapterList = Object.keys(counts).sort().map(name => ({
                    name,
                    count: counts[name]
                }));

                setChapters(chapterList);
            }
            setLoading(false);
        }
        fetchChapters();
    }, []);

    if (loading) return (
        <DashboardLayout>
            <div className={styles.contentWrapper} style={{ marginLeft: 0 }}>
                <h1 className={styles.title}>Chapters</h1>
                <div style={{ color: '#64748b' }}>Loading Chapters...</div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <h1 className={styles.title}>Chapters</h1>

            <div className={styles.grid}>
                {chapters.length === 0 ? (
                    <p style={{ color: '#64748b' }}>No chapters found.</p>
                ) : (
                    chapters.map((chapter) => (
                        <Link key={chapter.name} href={`/quiz/chapter?chapter=${encodeURIComponent(chapter.name)}`} style={{ textDecoration: 'none' }}>
                            <div className={styles.card}>
                                <div className={styles.cardIcon}>
                                    <BookOpen size={32} />
                                </div>
                                <h2 className={styles.cardTitle}>{chapter.name}</h2>
                                <p className={styles.cardDescription}>
                                    {chapter.count} Questions
                                </p>
                                <div className={styles.cardBtn}>
                                    Start Practice
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
}
