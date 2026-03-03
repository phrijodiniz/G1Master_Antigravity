import { NextResponse } from 'next/server';
import { appendActivityToSheet } from '@/services/sheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { eventData } = body;

        if (!eventData || !Array.isArray(eventData)) {
            return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
        }

        // Convert ISO UTC timestamp (e.g. 2026-02-27T01:43:44.000Z) to Local Time (EST/EDT)
        // so Google Sheets can accurately compare it against its native NOW() function
        try {
            if (eventData[0] && typeof eventData[0] === 'string' && eventData[0].includes('Z')) {
                const dateObj = new Date(eventData[0]);
                // Format: YYYY-MM-DD HH:MM:SS (Universal Standard)
                // We use 'en-CA' because it intrinsically formats as YYYY-MM-DD,
                // which Google Sheets universally parses correctly regardless of sheet locale.
                const localTimeString = dateObj.toLocaleString('en-CA', {
                    timeZone: 'America/Toronto', // Standard EST/EDT
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false // 24-hour clock for easier Sheets math
                });

                // Remove commas to make it perfectly compatible with Sheets date parsing
                eventData[0] = localTimeString.replace(/,/g, '');
            }
        } catch (e) {
            console.warn("Failed to convert timezone for sheet activity", e);
        }

        const result = await appendActivityToSheet(eventData);
        if (result) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: 'Failed to append to sheet' }, { status: 500 });
        }
    } catch (error) {
        console.error('Activity API Error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
