import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient'; // We need the auth one to identify the user
import { appendActivityToSheet } from '@/services/sheets';

export async function POST(req) {
    try {
        // 1. Get the current user from Supabase Auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create a new Supabase client strictly for Auth validation if needed, 
        // or trust the token logic. 
        // However, the standard way in Next.js App Router with Supabase checks the session.
        // For simplicity, we'll assume the frontend sends the user's ID or we verify the session.
        // Better security: Verify the session on the server.

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const source = body.source || 'unknown';

        // Log Checkout Initiated event to Google Sheets (America/Toronto timezone)
        try {
            const dateObj = new Date();
            const localTimeString = dateObj.toLocaleString('en-CA', {
                timeZone: 'America/Toronto',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(/,/g, '');

            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name')
                .eq('id', user.id)
                .single();

            const firstName = profile?.first_name || user.user_metadata?.first_name || 'User';

            await appendActivityToSheet([
                localTimeString,
                user.email || 'unknown_email',
                firstName,
                `Checkout Initiated - Button: ${source}`
            ]);
            console.log(`Appended Checkout Initiated event to sheet for user ${user.id} from source: ${source}`);
        } catch (sheetError) {
            console.error("Failed to append Checkout Initiated to sheet:", sheetError);
        }

        const tier = body.tier || 'lifetime';

        // 3. Define pricing configuration based on requested tier
        let unitAmount = 1997; // Default: Lifetime Premium Upgrade
        let name = 'Premium Upgrade (Lifetime Access)';
        let description = 'Unlock all features, unlimited practice tests, and timed G1 simulations with no expiration.';

        if (tier === '2_weeks') {
            unitAmount = 597; // $5.97 CAD
            name = 'Premium Upgrade (2 Weeks Access)';
            description = 'Unlock all features, unlimited practice tests, and timed G1 simulations for 14 days.';
        } else if (tier === '30_days') {
            unitAmount = 997; // $9.97 CAD
            name = 'Premium Upgrade (1 Month Access)';
            description = 'Unlock all features, unlimited practice tests, and timed G1 simulations for 1 month.';
        }

        const sessionConfig = {
            line_items: [
                {
                    price_data: {
                        currency: 'cad',
                        product_data: {
                            name,
                            description,
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            custom_text: {
                submit: {
                    message: 'This is a **one-time charge**. You will not be enrolled in any subscription or recurring fees.',
                },
            },
            success_url: `${req.headers.get('origin')}/account?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
            cancel_url: `${req.headers.get('origin')}/account`,
            client_reference_id: user.id, // Critical: Attach User ID to the session
            customer_email: user.email, // Pre-fill and lock the email field
            metadata: {
                userId: user.id,
                tier: tier,
                source: source
            },
            allow_promotion_codes: true,
        };

        // 2. Create Checkout Session
        const session = await stripe.checkout.sessions.create(sessionConfig);

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
