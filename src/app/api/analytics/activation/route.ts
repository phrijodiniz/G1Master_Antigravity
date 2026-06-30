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
            const userTopicProgress: Record<string, { topic_id: string, completed: boolean, attempts: number, questions_attempted: number, questions_correct: number, created_at: string, updated_at: string }[]> = {};

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

                const { data: topicData } = await supabase
                    .from('user_topic_progress')
                    .select('user_id, topic_id, completed, attempts, questions_attempted, questions_correct, created_at, updated_at')
                    .in('user_id', chunk);

                if (topicData) {
                    topicData.forEach(row => {
                        if (!userTopicProgress[row.user_id]) {
                            userTopicProgress[row.user_id] = [];
                        }
                        userTopicProgress[row.user_id].push({
                            topic_id: row.topic_id,
                            completed: row.completed,
                            attempts: row.attempts || 0,
                            questions_attempted: row.questions_attempted || 0,
                            questions_correct: row.questions_correct || 0,
                            created_at: row.created_at,
                            updated_at: row.updated_at
                        });
                    });
                }
            }

            // Fetch checkout initiations from sheets
            checkoutInitiators = await getCheckoutInitiatorsFromSheet(startStr, endStr);
            checkoutSet = new Set(checkoutInitiators.map(ci => ci.email.toLowerCase().trim()));

            // Define the 11 topics in order
            const topicOrder = [
                'essentials_test_1',
                'essentials_test_2',
                'essentials_test_3',
                'essentials_test_4',
                'complicated_test_1',
                'complicated_test_2',
                'complicated_test_3',
                'trouble_test_1',
                'trouble_test_2',
                'trouble_test_3',
                'final_simulation'
            ];

            const topicUserCompletions: Record<string, string[]> = {};
            const topicUserAttempts: Record<string, { attempts: number, questions_attempted: number, questions_correct: number }[]> = {};
            topicOrder.forEach(tid => {
                topicUserCompletions[tid] = [];
                topicUserAttempts[tid] = [];
            });

            // Path preference tallies
            let mapOnlyCount = 0;
            let standaloneOnlyCount = 0;
            let hybridCount = 0;
            let inactiveCount = 0;

            const mapOnlyEmails: string[] = [];
            const standaloneOnlyEmails: string[] = [];
            const hybridEmails: string[] = [];
            const inactiveEmails: string[] = [];

            // Completion Velocity lists
            const completionTimes: number[] = [];

            // Upgrade funnel tallies (for users who completed all 3 free tests)
            let completedFree3Count = 0;
            let completedFree3Emails: string[] = [];
            let free3InitiatedCheckoutCount = 0;
            let free3InitiatedCheckoutEmails: string[] = [];
            let free3PaidCount = 0;
            let free3PaidEmails: string[] = [];

            // Tally the users into the activation funnel using their email addresses
            filteredProfiles.forEach(p => {
                const userEmail = p.email || p.id;
                const tests = userTestTypes[p.id] || [];
                const progressList = userTopicProgress[p.id] || [];
                const simList = userTests[p.id] || [];

                // Check path preference
                const hasMap = progressList.some(r => r.attempts > 0);
                const hasStandalone = simList.some(t => 
                    t.test_type === 'Rules of the Road' || 
                    t.test_type === 'Road Signs' || 
                    t.test_type === 'Mixed Practice' || 
                    t.test_type === 'Practice' || 
                    t.test_type === 'Simulation'
                );

                if (hasMap && !hasStandalone) {
                    mapOnlyCount++;
                    mapOnlyEmails.push(userEmail);
                } else if (!hasMap && hasStandalone) {
                    standaloneOnlyCount++;
                    standaloneOnlyEmails.push(userEmail);
                } else if (hasMap && hasStandalone) {
                    hybridCount++;
                    hybridEmails.push(userEmail);
                } else {
                    inactiveCount++;
                    inactiveEmails.push(userEmail);
                }

                // Process topic-level metrics
                let completedEssentials1 = false;
                let completedEssentials2 = false;
                let completedEssentials3 = false;
                let earliestTime = Infinity;
                let latestTime = -Infinity;
                let completedFinalSim = false;

                progressList.forEach(r => {
                    const tid = r.topic_id;
                    if (topicUserAttempts[tid]) {
                        topicUserAttempts[tid].push({
                            attempts: r.attempts,
                            questions_attempted: r.questions_attempted,
                            questions_correct: r.questions_correct
                        });
                    }

                    if (r.completed) {
                        if (topicUserCompletions[tid]) {
                            topicUserCompletions[tid].push(userEmail);
                        }

                        if (tid === 'essentials_test_1') completedEssentials1 = true;
                        if (tid === 'essentials_test_2') completedEssentials2 = true;
                        if (tid === 'essentials_test_3') completedEssentials3 = true;
                        if (tid === 'final_simulation') completedFinalSim = true;

                        const compTime = new Date(r.updated_at).getTime();
                        if (compTime > latestTime) latestTime = compTime;
                    }

                    const createTime = new Date(r.created_at).getTime();
                    if (createTime < earliestTime) earliestTime = createTime;
                });

                // Completion Velocity
                if (completedFinalSim && earliestTime !== Infinity && latestTime !== -Infinity && latestTime > earliestTime) {
                    const diffHours = (latestTime - earliestTime) / (1000 * 60 * 60);
                    completionTimes.push(diffHours);
                }

                // Free-to-Premium Upgrade Funnel
                if (completedEssentials1 && completedEssentials2 && completedEssentials3) {
                    completedFree3Count++;
                    completedFree3Emails.push(userEmail);

                    const normalizedEmail = (p.email || '').toLowerCase().trim();
                    const hasInitiated = normalizedEmail && checkoutSet.has(normalizedEmail);
                    if (hasInitiated) {
                        free3InitiatedCheckoutCount++;
                        free3InitiatedCheckoutEmails.push(userEmail);
                    }
                    if (p.is_premium) {
                        free3PaidCount++;
                        free3PaidEmails.push(userEmail);
                    }
                }

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

            // Calculate Node Difficulty & Retake averages
            const topicStats = topicOrder.map(tid => {
                const attemptsData = topicUserAttempts[tid] || [];
                const completions = topicUserCompletions[tid] || [];
                
                const totalAttempts = attemptsData.reduce((sum, item) => sum + item.attempts, 0);
                const uniqueAttempted = attemptsData.length;
                const avgAttempts = uniqueAttempted > 0 ? Number((totalAttempts / uniqueAttempted).toFixed(1)) : 0;

                const totalQAttempted = attemptsData.reduce((sum, item) => sum + item.questions_attempted, 0);
                const totalQCorrect = attemptsData.reduce((sum, item) => sum + item.questions_correct, 0);
                const avgAccuracy = totalQAttempted > 0 ? Math.round((totalQCorrect / totalQAttempted) * 100) : null;

                return {
                    topic_id: tid,
                    uniqueCompletions: completions.length,
                    uniqueAttempted,
                    avgAttempts,
                    avgAccuracy
                };
            });

            // Bucketing Completion Velocity
            const velocityBuckets = {
                under1Hour: completionTimes.filter(t => t < 1).length,
                hours1To12: completionTimes.filter(t => t >= 1 && t < 12).length,
                hours12To24: completionTimes.filter(t => t >= 12 && t < 24).length,
                days1To3: completionTimes.filter(t => t >= 24 && t < 72).length,
                over3Days: completionTimes.filter(t => t >= 72).length
            };

            const avgVelocity = completionTimes.length > 0
                ? Number((completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length).toFixed(1))
                : 0;

            const medianVelocity = completionTimes.length > 0
                ? Number(completionTimes.sort((a, b) => a - b)[Math.floor(completionTimes.length / 2)].toFixed(1))
                : 0;

            const masteryMapStats = {
                topicOrder,
                funnel: topicOrder.reduce((acc, tid) => {
                    acc[tid] = topicUserCompletions[tid] || [];
                    return acc;
                }, {} as Record<string, string[]>),
                topicStats,
                pathPreferences: {
                    mapOnlyCount,
                    standaloneOnlyCount,
                    hybridCount,
                    inactiveCount,
                    mapOnlyEmails,
                    standaloneOnlyEmails,
                    hybridEmails,
                    inactiveEmails
                },
                velocity: {
                    avgHours: avgVelocity,
                    medianHours: medianVelocity,
                    buckets: velocityBuckets,
                    completedCount: completionTimes.length
                },
                upgradeFunnel: {
                    completedFree3Count,
                    completedFree3Emails,
                    free3InitiatedCheckoutCount,
                    free3InitiatedCheckoutEmails,
                    free3PaidCount,
                    free3PaidEmails
                }
            };

            creditRenewalStats.exhaustedUsersCount = creditRenewalStats.exhaustedUsers.length;
            creditRenewalStats.returnedUsersCount = creditRenewalStats.returnedUsers.length;

            return NextResponse.json({
                landingPage,
                freeTest,
                dailyTrends,
                activationFunnel,
                checkoutDetails,
                creditRenewalStats,
                masteryMapStats
            });
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

