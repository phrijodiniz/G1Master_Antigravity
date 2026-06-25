import { NextResponse } from 'next/server';
import { getActivationDataFromSheet, getCheckoutInitiatorsFromSheet } from '@/services/sheets';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    console.log('GET /api/analytics/activation called');
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
            tookTwoOrMorePractice: [] as string[],
            tookThreeOrMorePractice: [] as string[],
            initiatedCheckout: [] as string[],
            paid: [] as string[]
        };

        let checkoutDetails: { email: string, creditsUsed: number }[] = [];
        let checkoutInitiators: any[] = [];
        let checkoutSet = new Set<string>();

        let creditRenewalStats = {
            exhaustedUsers: [] as string[],
            exhaustedDetails: [] as { email: string, hasFreeTest: boolean }[],
            returnedUsers: [] as string[],
            exhaustedUsersCount: 0,
            returnedUsersCount: 0,
            returnedDetails: [] as { email: string, firstTestTime: string, renewalTime: string, additionalTestsCount: number }[]
        };

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        // Query profiles created within the date range
        let query = supabase.from('profiles').select('id, email, created_at, is_premium, is_test_account, admin');
        if (startStr) query = query.gte('created_at', `${startStr}T00:00:00Z`);
        if (endStr) query = query.lte('created_at', `${endStr}T23:59:59Z`);

        const { data: profiles, error: profileError } = await query;

        if (!profileError && profiles && profiles.length > 0) {
            // Exclude test, admin, and developer accounts from activation analytics
            const filteredProfiles = profiles.filter(p => {
                const emailLower = (p.email || '').toLowerCase().trim();
                const isEmailTest = emailLower.includes('test') || emailLower.endsWith('@example.com') || emailLower.includes('demo') || emailLower === 'pedro.rijo.diniz@hotmail.com' || emailLower === 'hello@alberdinni.com' || emailLower === 'g1masterapp@gmail.com';
                const isTest = isEmailTest || p.is_test_account === true || p.admin === 'YES' || p.admin === 'yes';
                return !isTest;
            });

            const userIds = filteredProfiles.map(p => p.id);
            activationFunnel.signUp = filteredProfiles.map(p => p.email || p.id);

            const userCounts: Record<string, number> = {};
            const userTestTypes: Record<string, string[]> = {};
            const chunkSize = 200;

            const userTests: Record<string, { test_type: string, created_at: string }[]> = {};

            for (let i = 0; i < userIds.length; i += chunkSize) {
                const chunk = userIds.slice(i, i + chunkSize);
                const { data: simResults } = await supabase
                    .from('simulation_results')
                    .select('user_id, test_type, created_at')
                    .in('user_id', chunk);

                if (simResults) {
                    simResults.forEach(res => {
                        userCounts[res.user_id] = (userCounts[res.user_id] || 0) + 1;
                        if (!userTestTypes[res.user_id]) {
                            userTestTypes[res.user_id] = [];
                        }
                        userTestTypes[res.user_id].push(res.test_type);

                        if (!userTests[res.user_id]) {
                            userTests[res.user_id] = [];
                        }
                        userTests[res.user_id].push({
                            test_type: res.test_type,
                            created_at: res.created_at
                        });
                    });
                }
            }

            // Fetch checkout initiations from sheets
            checkoutInitiators = await getCheckoutInitiatorsFromSheet(startStr, endStr);
            checkoutSet = new Set(checkoutInitiators.map(ci => ci.email.toLowerCase().trim()));

            // Tally the users into the activation funnel using their email addresses
            filteredProfiles.forEach(p => {
                const userEmail = p.email || p.id;
                const tests = userTestTypes[p.id] || [];

                const hasFreeTest = tests.some(t => t === 'Practice (First Try)' || t === 'Free Test');
                const practiceTests = tests.filter(t => t === 'Rules of the Road' || t === 'Road Signs' || t === 'Mixed Practice');

                if (hasFreeTest) {
                    activationFunnel.tookFreeTest.push(userEmail);

                    if (practiceTests.length >= 1) {
                        activationFunnel.tookAtLeastOnePractice.push(userEmail);
                    }
                    if (practiceTests.length >= 2) {
                        activationFunnel.tookTwoOrMorePractice.push(userEmail);
                    }
                    if (practiceTests.length >= 3) {
                        activationFunnel.tookThreeOrMorePractice.push(userEmail);
                    }
                }

                // Check for checkout initiation and premium status regardless of whether they saved the free test
                const normalizedEmail = (p.email || '').toLowerCase().trim();
                
                if (normalizedEmail && checkoutSet.has(normalizedEmail)) {
                    activationFunnel.initiatedCheckout.push(userEmail);

                    // Find all checkout timestamps for this user
                    const userEvents = checkoutInitiators.filter(ci => ci.email.toLowerCase().trim() === normalizedEmail);
                    let earliestCheckoutTime = Infinity;
                    userEvents.forEach(evt => {
                        const formatted = evt.timestamp.replace(' ', 'T') + '-04:00';
                        const time = new Date(formatted).getTime();
                        if (!isNaN(time) && time < earliestCheckoutTime) {
                            earliestCheckoutTime = time;
                        }
                    });

                    // Count how many practice tests this user took BEFORE the earliest checkout time
                    const userAllTests = userTests[p.id] || [];
                    const practiceTestsBeforeCheckout = userAllTests.filter(t => {
                        const isPractice = t.test_type === 'Rules of the Road' || t.test_type === 'Road Signs' || t.test_type === 'Mixed Practice';
                        const testTime = new Date(t.created_at).getTime();
                        return isPractice && testTime < earliestCheckoutTime;
                    });

                    checkoutDetails.push({
                        email: p.email || p.id,
                        creditsUsed: practiceTestsBeforeCheckout.length
                    });
                }
                if (p.is_premium) {
                    activationFunnel.paid.push(userEmail);
                } else {
                    // Calculate credit renewal and retention for non-premium users
                    const userPracticeTests = (userTests[p.id] || [])
                        .filter(t => t.test_type === 'Rules of the Road' || t.test_type === 'Road Signs' || t.test_type === 'Mixed Practice')
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                    if (userPracticeTests.length >= 3) {
                        creditRenewalStats.exhaustedUsers.push(userEmail);
                        creditRenewalStats.exhaustedDetails.push({
                            email: userEmail,
                            hasFreeTest
                        });
                        
                        const firstTestTime = new Date(userPracticeTests[0].created_at).getTime();
                        const renewalTime = firstTestTime + 3 * 60 * 60 * 1000; // 3 hours

                        // Check if they took at least 1 more test after credit renewal
                        const additionalTests = userPracticeTests.slice(3).filter(t => new Date(t.created_at).getTime() >= renewalTime);
                        if (additionalTests.length > 0) {
                            creditRenewalStats.returnedUsers.push(userEmail);
                            creditRenewalStats.returnedDetails.push({
                                email: userEmail,
                                firstTestTime: userPracticeTests[0].created_at,
                                renewalTime: new Date(renewalTime).toISOString(),
                                additionalTestsCount: additionalTests.length
                            });
                        }
                    }
                }
            });
            creditRenewalStats.exhaustedUsersCount = creditRenewalStats.exhaustedUsers.length;
            creditRenewalStats.returnedUsersCount = creditRenewalStats.returnedUsers.length;
        }

        return NextResponse.json({
            landingPage,
            freeTest,
            dailyTrends,
            activationFunnel,
            checkoutDetails,
            creditRenewalStats
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

