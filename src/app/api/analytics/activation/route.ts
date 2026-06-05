import { NextResponse } from 'next/server';
import { getActivationDataFromSheet } from '@/services/sheets';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let startStr = searchParams.get('startDate') || undefined;
        let endStr = searchParams.get('endDate') || undefined;

        // If no dates provided, default to last 30 days formatted as YYYY-MM-DD local
        if (!startStr || !endStr) {
            const now = new Date();
            const lastMonth = new Date(now.setDate(now.getDate() - 30));
            startStr = lastMonth.toLocaleDateString('en-CA');
            endStr = new Date().toLocaleDateString('en-CA');
        }

        // Fetch real data from Google Sheets
        const sheetData = await getActivationDataFromSheet(startStr, endStr);

        // Fallback to empty structure if sheet fetch fails
        const freeTest = sheetData?.freeTest || {
            started: 0,
            abandoned: 0,
            completed: 0,
            conversions: 0,
            completionRate: 0,
            conversionRate: 0
        };

        const dailyTrends = sheetData?.dailyTrends || [];

        // Generate mock data for Landing Page Engagement (Scroll Depth)
        const totalLandingPageViews = Math.floor(Math.random() * 5000) + 2000;

        const landingPage = {
            views: totalLandingPageViews,
            ctaClicks: 0, // Migrated to daily trends/mock not needed here
            scrollDepth: {
                '25%': Math.floor(totalLandingPageViews * 0.90),
                '50%': Math.floor(totalLandingPageViews * 0.65),
                '75%': Math.floor(totalLandingPageViews * 0.40),
                '100%': Math.floor(totalLandingPageViews * 0.20),
            }
        };

        let activationFunnel = {
            signUp: [] as string[],
            tookFreeTest: [] as string[],
            tookAtLeastOnePractice: [] as string[],
            tookTwoOrMorePractice: [] as string[]
        };

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        // Query profiles created within the date range
        let query = supabase.from('profiles').select('id, email, created_at');
        if (startStr) query = query.gte('created_at', `${startStr}T00:00:00Z`);
        if (endStr) query = query.lte('created_at', `${endStr}T23:59:59Z`);

        const { data: profiles, error: profileError } = await query;

        if (!profileError && profiles && profiles.length > 0) {
            const userIds = profiles.map(p => p.id);
            activationFunnel.signUp = profiles.map(p => p.email || p.id);

            const userCounts: Record<string, number> = {};
            const userTestTypes: Record<string, string[]> = {};
            const chunkSize = 200;

            for (let i = 0; i < userIds.length; i += chunkSize) {
                const chunk = userIds.slice(i, i + chunkSize);
                const { data: simResults } = await supabase
                    .from('simulation_results')
                    .select('user_id, test_type')
                    .in('user_id', chunk);

                if (simResults) {
                    simResults.forEach(res => {
                        userCounts[res.user_id] = (userCounts[res.user_id] || 0) + 1;
                        if (!userTestTypes[res.user_id]) {
                            userTestTypes[res.user_id] = [];
                        }
                        userTestTypes[res.user_id].push(res.test_type);
                    });
                }
            }

            // Tally the users into the activation funnel using their email addresses
            profiles.forEach(p => {
                const userEmail = p.email || p.id;
                const tests = userTestTypes[p.id] || [];

                const hasFreeTest = tests.some(t => t === 'Practice (First Try)' || t === 'Free Test');
                const practiceTests = tests.filter(t => t === 'Rules of the Road' || t === 'Road Signs');

                if (hasFreeTest) {
                    activationFunnel.tookFreeTest.push(userEmail);

                    if (practiceTests.length >= 1) {
                        activationFunnel.tookAtLeastOnePractice.push(userEmail);
                    }
                    if (practiceTests.length >= 2) {
                        activationFunnel.tookTwoOrMorePractice.push(userEmail);
                    }
                }
            });
        }

        return NextResponse.json({
            landingPage,
            freeTest,
            dailyTrends,
            activationFunnel
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

