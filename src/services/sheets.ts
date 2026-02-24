import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const SHEET_DATE_FORMAT_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/; // YYYY-MM-DD

export async function getAcquisitionDataFromSheet(startDate?: string, endDate?: string) {
    try {
        // Authenticate with Google
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle newlines in env var
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // Fetch data from the sheet. Assuming 'Data' tab or similar. Fetching columns A to F.
        const ranges = [
            'GoogleAds!A:F',        // Date, Impressions, Clicks, Cost (Spend is likely F)
            'User Acquisition!A:B'  // Date, Sessions (Visits)
        ];

        const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges,
        });

        const valueRanges = response.data.valueRanges;

        if (!valueRanges || valueRanges.length !== 2) {
            console.warn('Incomplete data found in Google Sheet.');
            return null;
        }

        const adsRows = valueRanges[0].values || [];
        const acquisitionRows = valueRanges[1].values || [];

        // --- Supabase Integration ---
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        console.log('Initializing Supabase client (Service Role)...', supabaseUrl);
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        console.log('Fetching profiles from Supabase...');
        const { data: profiles, error: supabaseError } = await supabase
            .from('profiles')
            .select('created_at');

        if (supabaseError) {
            console.error('CRITICAL: Error fetching profiles from Supabase:', supabaseError);
        } else {
            console.log('Successfully fetched profiles. Count:', profiles?.length || 0);
            if (profiles && profiles.length > 0) {
                console.log('Sample profile created_at:', profiles[0].created_at);
            }
        }

        const signupsMap = new Map();
        if (profiles) {
            profiles.forEach((profile: any) => {
                if (profile.created_at) {
                    // Extract YYYY-MM-DD from timestamp using America/New_York timezone
                    // 'en-CA' locale formats as YYYY-MM-DD
                    const dateStr = new Date(profile.created_at).toLocaleDateString('en-CA', {
                        timeZone: 'America/New_York'
                    });
                    signupsMap.set(dateStr, (signupsMap.get(dateStr) || 0) + 1);
                }
            });
        }
        console.log('Signups aggregation result:', Object.fromEntries(signupsMap));
        // ---------------------------

        // Map rows to objects and merge by Date
        // Skip header row
        const adsData = adsRows.slice(1);
        const acquisitionData = acquisitionRows.slice(1);

        // Create maps for quick lookup by date
        const adsMap = new Map();
        adsData.forEach(row => {
            if (row[0]) adsMap.set(row[0], row);
        });

        const acquisitionMap = new Map();
        acquisitionData.forEach(row => {
            if (row[0]) acquisitionMap.set(row[0], row);
        });

        // Get all unique dates from all sources (Ads, Acquisition, Supabase)
        const allDates = new Set([...adsMap.keys(), ...acquisitionMap.keys(), ...signupsMap.keys()]);

        // Convert to array and sort chronologically (oldest first)
        const sortedDates = Array.from(allDates).sort((a: any, b: any) => {
            return new Date(a).getTime() - new Date(b).getTime();
        });

        console.log('Sheet Service received:', { startDate, endDate });

        // Filter dates based on startDate and endDate if provided
        let filteredDates = sortedDates;
        if (startDate || endDate) {
            // Helper to parse "YYYY-MM-DD" as local date (00:00:00)
            const parseDateLocal = (dateStr: string) => {
                const [year, month, day] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            };

            const start = startDate ? parseDateLocal(startDate) : new Date(2000, 0, 1);
            const end = endDate ? parseDateLocal(endDate) : new Date();

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            console.log('Filtering Sheet Dates with range:', {
                start: start.toString(),
                end: end.toString()
            });

            filteredDates = sortedDates.filter((dateStr: any) => {
                // Parse date string (YYYY-MM-DD) as local time
                // new Date("YYYY-MM-DD") uses UTC, which might shift to previous day
                const [year, month, day] = dateStr.split('-').map(Number);
                const currentDate = new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid boundary issues

                return currentDate >= start && currentDate <= end;
            });
        }

        console.log('Filtered Dates Result:', {
            count: filteredDates.length,
            first: filteredDates[0],
            last: filteredDates[filteredDates.length - 1]
        });

        let totalSpend = 0;
        let totalSignups = 0;
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalVisits = 0;

        const dailyData: any[] = [];

        filteredDates.forEach((date: any) => {
            const adsRow = adsMap.get(date);
            const acqRow = acquisitionMap.get(date);
            const dailySignups = signupsMap.get(date) || 0;

            // Google Ads Columns
            const impressions = adsRow ? parseInt(adsRow[1]?.replace(/,/g, '') || '0') : 0;
            const clicks = adsRow ? parseInt(adsRow[2]?.replace(/,/g, '') || '0') : 0;
            const spend = adsRow ? parseFloat(adsRow[5]?.replace(/[$,]/g, '') || '0') : 0;

            // User Acquisition Columns
            const visits = acqRow ? parseInt(acqRow[1]?.replace(/,/g, '') || '0') : 0;

            totalSpend += spend;
            totalSignups += dailySignups;
            totalImpressions += impressions;
            totalClicks += clicks;
            totalVisits += visits;

            dailyData.push({
                segment: date,
                date: date,
                spend,
                impressions,
                clicks,
                visits,
                signups: dailySignups
            });
        });

        // Calculate Summary KPIs
        const blendedCac = totalSignups > 0 ? totalSpend / totalSignups : 0;

        // Data is already sorted Oldest -> Newest (Left -> Right)

        return {
            summary: {
                totalSpend,
                totalSignups,
                blendedCac,
                marketingSpend: totalSpend,
                organicSignups: 0,
                paidSignups: totalSignups
            },
            funnelVariants: {
                all: {
                    impressions: totalImpressions,
                    clicks: totalClicks,
                    visits: totalVisits,
                    signups: totalSignups
                }
            },
            breakdownData: {
                day: dailyData
            }
        };

    } catch (error) {
        console.error('Error fetching data from Google Sheet:', error);
        return null;
    }
}

export async function getActivationDataFromSheet(startDate?: string, endDate?: string) {
    try {
        // Authenticate with Google
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // Fetch data from Landing Page Events tab (A: Date, B: Event Name)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Landing Page Events!A:C',
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            console.warn('No data found in Landing Page Events tab.');
            return null;
        }

        // Helper to parse "YYYY-MM-DD" as local date (00:00:00)
        const parseDateLocal = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const start = startDate ? parseDateLocal(startDate) : new Date(2000, 0, 1);
        const end = endDate ? parseDateLocal(endDate) : new Date();

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        let testStarts = 0;
        let testAbandons = 0;
        let testCompletes = 0;
        let testConversions = 0;

        // Map to hold daily aggregation: { 'YYYY-MM-DD': { ctaClicks, testStarts, testCompletes } }
        const dailyMap = new Map();

        // Skip header row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const dateStr = row[0];
            const eventName = row[1];
            // Event Count is in Column C
            const eventCountStr = row[2];

            if (!dateStr || !eventName || !eventCountStr) continue;

            const eventCount = parseInt(eventCountStr?.replace(/,/g, '') || '0', 10);
            if (isNaN(eventCount) || eventCount === 0) continue;

            const [year, month, day] = dateStr.split('-').map(Number);
            // Use 12:00 PM to avoid timezone boundary issues
            const rowDate = new Date(year, month - 1, day, 12, 0, 0);

            if (rowDate >= start && rowDate <= end) {
                // Initialize daily map entry if it doesn't exist
                if (!dailyMap.has(dateStr)) {
                    dailyMap.set(dateStr, { ctaClicks: 0, testStarts: 0, testCompletes: 0, testConversions: 0 });
                }
                const dailyStats = dailyMap.get(dateStr);

                if (eventName === 'free_test_start') {
                    testStarts += eventCount;
                    dailyStats.testStarts += eventCount;
                } else if (eventName === 'free_test_abandon') {
                    testAbandons += eventCount;
                    // Abandons usually aren't plotted on the daily chart, but tracked in totals
                } else if (eventName === 'free_test_complete') {
                    testCompletes += eventCount;
                    dailyStats.testCompletes += eventCount;
                } else if (eventName === 'free_test_conversion') {
                    testConversions += eventCount;
                    dailyStats.testConversions += eventCount;
                }
                // Note: Keeping ctaClicks in dailyStats at 0 since it's not in this tab yet, 
                // but reserving the space so the chart doesn't break if we add it later.
            }
        }

        const freeTest = {
            started: testStarts,
            abandoned: testAbandons,
            completed: testCompletes,
            conversions: testConversions,
            completionRate: testStarts > 0 ? (testCompletes / testStarts) : 0,
            conversionRate: testCompletes > 0 ? (testConversions / testCompletes) : 0
        };

        // Convert map to sorted array
        const sortedDates = Array.from(dailyMap.keys()).sort((a: string, b: string) => {
            return new Date(a).getTime() - new Date(b).getTime();
        });

        const dailyTrends = sortedDates.map(date => {
            const stats = dailyMap.get(date);
            return {
                date: date,
                ctaClicks: stats.ctaClicks,
                testStarts: stats.testStarts,
                testCompletes: stats.testCompletes,
                testConversions: stats.testConversions
            };
        });

        return {
            freeTest,
            dailyTrends
        };

    } catch (error) {
        console.error('Error fetching Activation data from Google Sheet:', error);
        return null;
    }
}
