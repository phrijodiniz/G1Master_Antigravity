import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to calculate median
function getMedian(numbers: number[]) {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
}

// Maps the raw test_type from DB to UI display names
function mapTestType(type: string): string {
    if (type.includes('Practice') || type === 'Free Test') return 'Free Test';
    if (type === 'Rules of the Road') return 'Rules of the Road';
    if (type === 'Road Signs') return 'Road Signs';
    if (type === 'Simulation') return 'Simulation';

    return 'Other';
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Verify Environment Variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase credentials missing.');
            return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        // Initialize variables to fetch all results
        let allResults: any[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        // Parse local dates
        let start: Date | null = null;
        let end: Date | null = null;

        if (startDateParam) {
            const [year, month, day] = startDateParam.split('-').map(Number);
            start = new Date(year, month - 1, day, 0, 0, 0);
        }
        if (endDateParam) {
            const [year, month, day] = endDateParam.split('-').map(Number);
            end = new Date(year, month - 1, day, 23, 59, 59, 999);
        }

        // Fetch paginated loop
        while (hasMore) {
            let query = supabase
                .from('simulation_results')
                .select('user_id, score, test_type, created_at')
                .range(from, from + limit - 1);

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching simulation_results:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                hasMore = false;
            } else {
                // Manually filter by date since DB uses UTC
                const filteredChunk = data.filter((row: any) => {
                    const rowDate = new Date(row.created_at);
                    if (start && rowDate < start) return false;
                    if (end && rowDate > end) return false;
                    return true;
                });

                allResults = allResults.concat(filteredChunk);

                if (data.length < limit) {
                    hasMore = false;
                } else {
                    from += limit;
                }
            }
        }

        // Initialize Aggregation Structures
        const testTypesToTrack = ['All Tests', 'Free Test', 'Rules of the Road', 'Road Signs', 'Simulation'];

        type Aggregation = {
            scores: number[];
            uniqueUsers: Set<string>;
            userTestCounts: Record<string, number>;
            userDates: Record<string, { first: number, last: number }>;
            buckets: {
                '0–39%': number;
                '40–59%': number;
                '60–69%': number;
                '70–79%': number;
                '80–100%': number;
            };
        };

        const aggregations: Record<string, Aggregation> = {};

        testTypesToTrack.forEach(type => {
            aggregations[type] = {
                scores: [],
                uniqueUsers: new Set(),
                userTestCounts: {},
                userDates: {},
                buckets: {
                    '0–39%': 0,
                    '40–59%': 0,
                    '60–69%': 0,
                    '70–79%': 0,
                    '80–100%': 0,
                }
            };
        });

        // Populate Aggregations
        allResults.forEach((row) => {
            const mappedType = mapTestType(row.test_type);
            if (!aggregations[mappedType]) return; // Skip if 'Other'

            const score = row.score || 0;

            // Helper function to update a specific aggregate
            const updateAgg = (aggKey: string) => {
                const agg = aggregations[aggKey];
                agg.scores.push(score);
                if (row.user_id) {
                    const uid = row.user_id;
                    const rowTime = new Date(row.created_at).getTime();

                    agg.uniqueUsers.add(uid);
                    agg.userTestCounts[uid] = (agg.userTestCounts[uid] || 0) + 1;

                    if (!agg.userDates[uid]) {
                        agg.userDates[uid] = { first: rowTime, last: rowTime };
                    } else {
                        if (rowTime < agg.userDates[uid].first) agg.userDates[uid].first = rowTime;
                        if (rowTime > agg.userDates[uid].last) agg.userDates[uid].last = rowTime;
                    }
                }

                if (score <= 39) agg.buckets['0–39%']++;
                else if (score <= 59) agg.buckets['40–59%']++;
                else if (score <= 69) agg.buckets['60–69%']++;
                else if (score <= 79) agg.buckets['70–79%']++;
                else agg.buckets['80–100%']++;
            };

            // Update specific type
            updateAgg(mappedType);

            // Update All Tests
            updateAgg('All Tests');
        });

        // Format Output for UI
        const performanceData = testTypesToTrack.map(type => {
            const agg = aggregations[type];
            const testsTaken = agg.scores.length;
            const uniqueUsers = agg.uniqueUsers.size;

            const sumScores = agg.scores.reduce((a, b) => a + b, 0);
            const avgScore = testsTaken > 0 ? Math.round(sumScores / testsTaken) : 0;
            const medianScore = testsTaken > 0 ? Math.round(getMedian(agg.scores)) : 0;

            const over80Count = agg.scores.filter(s => s >= 80).length;
            const over80Percent = testsTaken > 0 ? Math.round((over80Count / testsTaken) * 100) : 0;

            return {
                type,
                avgScore: `${avgScore}%`,
                testsTaken,
                uniqueUsers,
                medianScore: `${medianScore}%`,
                over80: `${over80Percent}%`
            };
        });

        const distributionData: Record<string, any[]> = {};
        const engagementData: Record<string, any[]> = {};
        const lifespanData: Record<string, any[]> = {};

        testTypesToTrack.forEach(type => {
            const agg = aggregations[type];
            distributionData[type] = [
                { bucket: '0–39%', count: agg.buckets['0–39%'] },
                { bucket: '40–59%', count: agg.buckets['40–59%'] },
                { bucket: '60–69%', count: agg.buckets['60–69%'] },
                { bucket: '70–79%', count: agg.buckets['70–79%'] },
                { bucket: '80–100%', count: agg.buckets['80–100%'] },
            ];

            const counts = { '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
            const lifespans = { 'Same Day': 0, '1-2 Days': 0, '3-7 Days': 0, '1+ Week': 0 };

            Object.entries(agg.userTestCounts).forEach(([uid, count]) => {
                // Tracking total tests
                if (count === 1) counts['1']++;
                else if (count === 2) counts['2']++;
                else if (count === 3) counts['3']++;
                else if (count === 4) counts['4']++;
                else if (count >= 5) counts['5+']++;

                // Tracking Lifespan dates
                if (agg.userDates[uid]) {
                    const firstDate = agg.userDates[uid].first;
                    const lastDate = agg.userDates[uid].last;

                    const diffMs = lastDate - firstDate;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                    if (diffDays === 0) lifespans['Same Day']++;
                    else if (diffDays <= 2) lifespans['1-2 Days']++;
                    else if (diffDays <= 7) lifespans['3-7 Days']++;
                    else lifespans['1+ Week']++;
                }
            });

            engagementData[type] = [
                { bucket: '1 Test', count: counts['1'] },
                { bucket: '2 Tests', count: counts['2'] },
                { bucket: '3 Tests', count: counts['3'] },
                { bucket: '4 Tests', count: counts['4'] },
                { bucket: '5+ Tests', count: counts['5+'] },
            ];

            lifespanData[type] = [
                { bucket: 'Same Day', count: lifespans['Same Day'] },
                { bucket: '1-2 Days', count: lifespans['1-2 Days'] },
                { bucket: '3-7 Days', count: lifespans['3-7 Days'] },
                { bucket: '1+ Week', count: lifespans['1+ Week'] },
            ];
        });

        return NextResponse.json({ performanceData, distributionData, engagementData, lifespanData });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
