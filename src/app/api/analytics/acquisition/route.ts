import { NextResponse } from 'next/server';
import { getAcquisitionDataFromSheet } from '@/services/sheets';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;

        const data = await getAcquisitionDataFromSheet(startDate, endDate);

        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch data from Google Sheets' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
