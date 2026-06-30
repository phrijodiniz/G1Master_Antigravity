"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import QuestionEditor from "@/components/admin/QuestionEditor";
import { Search, Filter, CheckCircle, Clock, ArrowLeft } from "lucide-react";

export default function QuestionsReviewPage() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const searchTermRef = useRef(""); // Stores the actual applied search term
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [chapterFilter, setChapterFilter] = useState("All");
    const [difficultyFilter, setDifficultyFilter] = useState("All");
    const [sortBy, setSortBy] = useState("Newest");
    const [availableChapters, setAvailableChapters] = useState<string[]>([]);

    const PAGE_SIZE = 20;

    const fetchQuestions = useCallback(async (pageIndex: number, reset = false) => {
        setLoading(true);
        const term = searchTermRef.current;

        try {
            let query = supabase
                .from('view_admin_questions')
                .select('*', { count: 'exact' });

            if (term && term.trim() !== "") {
                console.log("Applying search filter:", term);
                query = query.ilike('text', `%${term}%`);
            }

            if (categoryFilter !== "All") {
                query = query.eq('category', categoryFilter);
            }

            if (statusFilter !== "All") {
                if (statusFilter === "Validated") {
                    query = query.eq('is_validated', true);
                } else {
                    query = query.eq('is_validated', false); // Pending
                }
            }

            if (chapterFilter !== "All") {
                query = query.eq('chapter', chapterFilter);
            }

            // Apply difficulty filter
            if (difficultyFilter !== "All") {
                if (difficultyFilter === "Easy") {
                    query = query.gt('difficulty_percentage', 85).gte('first_attempts_count', 10);
                } else if (difficultyFilter === "Medium") {
                    query = query.gte('difficulty_percentage', 60).lte('difficulty_percentage', 85).gte('first_attempts_count', 10);
                } else if (difficultyFilter === "Hard") {
                    query = query.lt('difficulty_percentage', 60).gte('first_attempts_count', 10);
                } else if (difficultyFilter === "Unsampled") {
                    query = query.lt('first_attempts_count', 10);
                }
            }

            const from = pageIndex * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            query = query.range(from, to);

            // Apply sorting order
            if (sortBy === "Newest") {
                query = query.order('created_at', { ascending: false });
            } else if (sortBy === "Oldest") {
                query = query.order('created_at', { ascending: true });
            } else if (sortBy === "Hardest") {
                query = query.order('difficulty_percentage', { ascending: true, nullsFirst: false })
                             .order('first_attempts_count', { ascending: false });
            } else if (sortBy === "Easiest") {
                query = query.order('difficulty_percentage', { ascending: false, nullsFirst: false })
                             .order('first_attempts_count', { ascending: false });
            } else if (sortBy === "Most Attempted") {
                query = query.order('first_attempts_count', { ascending: false });
            }

            const { data, count, error } = await query;
            console.log("Supabase response - Data Length:", data?.length, "Count:", count, "Error:", error);

            if (count !== null) {
                setTotalCount(count);
            }

            if (error) throw error;

            if (reset) {
                setQuestions(data || []);
                setPage(1); // Next page will be 1
            } else {
                setQuestions(prev => [...prev, ...(data || [])]);
                setPage(prev => prev + 1);
            }

            if (count && (from + (data?.length || 0) >= count)) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            console.error("Error fetching questions:", err);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, statusFilter, chapterFilter, difficultyFilter, sortBy]); // Stable dependencies

    const handleSearch = () => {
        searchTermRef.current = searchTerm; // Apply the new search term
        fetchQuestions(0, true);
    };

    // Fetch chapters on mount
    useEffect(() => {
        const fetchChapters = async () => {
            const { data } = await supabase.from('questions').select('chapter');
            if (data) {
                // Unique chapters
                const unique = Array.from(new Set(data.map(d => d.chapter).filter(Boolean))).sort();
                setAvailableChapters(unique);
            }
        };
        fetchChapters();
    }, []);

    // Initial fetch and re-fetch on filter change
    useEffect(() => {
        // Reset search term ref if desired on filter change? Or keep it?
        // Let's keep it. Users expect search + filter to work together.
        fetchQuestions(0, true);
    }, [fetchQuestions]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchQuestions(page, false);
        }
    };

    const handleQuestionUpdated = () => {
        // Simple refresh strategy: reload the whole list or just update the item locally?
        // Let's reload to be safe and consistent.
        setSelectedQuestion(null);
        fetchQuestions(0, true);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <button
                onClick={() => window.location.href = '/admin'}
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
                Back to Dashboard
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Questions Review <span style={{ fontSize: '1rem', opacity: 0.5, marginLeft: '1rem' }}>{totalCount} total</span></h1>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                        <input
                            type="text"
                            placeholder="Search question text..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem 0.8rem 2.8rem',
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: '0 1.5rem',
                            background: 'var(--primary)',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Search
                    </button>
                </div>

                <div style={{ position: 'relative', width: '200px' }}>
                    <Filter style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            background: 'white',
                            cursor: 'pointer',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'black',
                            appearance: 'none'
                        }}
                    >
                        <option value="All">All Categories</option>
                        <option value="Rules of the Road">Rules of the Road</option>
                        <option value="Road Signs">Road Signs</option>
                    </select>
                </div>

                <div style={{ position: 'relative', width: '200px' }}>
                    <Filter style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            background: 'white',
                            cursor: 'pointer',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'black',
                            appearance: 'none'
                        }}
                    >
                        <option value="All">All Status</option>
                        <option value="Validated">Validated</option>
                        <option value="Pending">Pending Review</option>
                    </select>
                </div>

                <div style={{ position: 'relative', width: '200px' }}>
                    <Filter style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                    <select
                        value={chapterFilter}
                        onChange={(e) => setChapterFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            background: 'white',
                            cursor: 'pointer',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'black',
                            appearance: 'none'
                        }}
                    >
                        <option value="All">All Chapters</option>
                        {availableChapters.map(chap => (
                            <option key={chap} value={chap}>{chap}</option>
                        ))}
                    </select>
                </div>

                <div style={{ position: 'relative', width: '200px' }}>
                    <Filter style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                    <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            background: 'white',
                            cursor: 'pointer',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'black',
                            appearance: 'none'
                        }}
                    >
                        <option value="All">All Difficulties</option>
                        <option value="Hard">Hard (&lt;60%)</option>
                        <option value="Medium">Medium (60–85%)</option>
                        <option value="Easy">Easy (&gt;85%)</option>
                        <option value="Unsampled">Unsampled (&lt;10 attempts)</option>
                    </select>
                </div>

                <div style={{ position: 'relative', width: '200px' }}>
                    <Filter style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.8rem',
                            background: 'white',
                            cursor: 'pointer',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'black',
                            appearance: 'none'
                        }}
                    >
                        <option value="Newest">Newest First</option>
                        <option value="Oldest">Oldest First</option>
                        <option value="Hardest">Hardest First</option>
                        <option value="Easiest">Easiest First</option>
                        <option value="Most Attempted">Most Attempted</option>
                    </select>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'row' }}>

                {/* List */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {
                        questions.map((q) => (
                            <div
                                key={q.id}
                                onClick={() => setSelectedQuestion(q)}
                                className={`glass-panel question-card ${selectedQuestion?.id === q.id ? 'active' : ''}`}
                                style={{
                                    padding: '1.2rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '100px',
                                            background: q.category === 'Road Signs' ? 'rgba(255,0,0,0.1)' : 'rgba(0,0,255,0.1)',
                                            color: q.category === 'Road Signs' ? '#ff6b6b' : '#6b93ff',
                                            border: `1px solid ${q.category === 'Road Signs' ? '#ff6b6b40' : '#6b93ff40'}`
                                        }}>
                                            {q.category}
                                        </span>
                                        {/* Difficulty Badge */}
                                        {q.first_attempts_count >= 10 ? (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 8px',
                                                borderRadius: '100px',
                                                background: q.difficulty_percentage > 85 ? 'rgba(34,197,94,0.1)' : q.difficulty_percentage >= 60 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: q.difficulty_percentage > 85 ? '#22c55e' : q.difficulty_percentage >= 60 ? '#eab308' : '#ef4444',
                                                border: `1px solid ${q.difficulty_percentage > 85 ? 'rgba(34,197,94,0.25)' : q.difficulty_percentage >= 60 ? 'rgba(234,179,8,0.25)' : 'rgba(239,68,68,0.25)'}`
                                            }}>
                                                {q.difficulty_percentage > 85 ? 'Easy' : q.difficulty_percentage >= 60 ? 'Medium' : 'Hard'} ({q.difficulty_percentage}%)
                                            </span>
                                        ) : (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '2px 8px',
                                                borderRadius: '100px',
                                                background: 'rgba(148,163,184,0.1)',
                                                color: '#94a3b8',
                                                border: '1px solid rgba(148,163,184,0.25)'
                                            }}>
                                                Unsampled
                                            </span>
                                        )}
                                        {/* Attempt Count & Confidence */}
                                        {q.first_attempts_count > 0 && (
                                            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                                {q.first_attempts_count} {q.first_attempts_count === 1 ? 'attempt' : 'attempts'}
                                                {q.first_attempts_count >= 20 ? ' (High Conf.)' : ' (Low Conf.)'}
                                            </span>
                                        )}
                                    </div>
                                    {q.is_validated ?
                                        <CheckCircle size={16} color="var(--success)" /> :
                                        <Clock size={16} color="#F59E0B" />
                                    }
                                </div>
                                <p style={{ fontWeight: '500', lineHeight: '1.4', marginBottom: '0.5rem' }}>{q.text}</p>
                                <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                                    {q.chapter} • Correct: {q.options[q.correct_index]}
                                </div>
                            </div>
                        ))
                    }

                    {
                        questions.length === 0 && !loading && (
                            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                No questions found matching your criteria.
                            </div>
                        )
                    }

                    {
                        hasMore && (
                            <button
                                onClick={handleLoadMore}
                                disabled={loading}
                                style={{
                                    padding: '1rem',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    marginTop: '1rem'
                                }}
                            >
                                {loading ? 'Loading...' : 'Load More Questions'}
                            </button>
                        )
                    }
                </div >

                {/* Editor Panel (Sticky/Fixed on large screens, or Overlay on small) */}
                {
                    selectedQuestion && (
                        <div style={{ flex: 1, minWidth: '400px', position: 'sticky', top: '2rem', height: 'fit-content' }}>
                            <QuestionEditor
                                key={selectedQuestion.id}
                                question={selectedQuestion}
                                onSave={handleQuestionUpdated}
                                onCancel={() => setSelectedQuestion(null)}
                                onDelete={handleQuestionUpdated}
                            />
                        </div>
                    )
                }
            </div>
        </div>
    );
}
