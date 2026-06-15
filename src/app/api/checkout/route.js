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

        // Check if user is eligible for New Sign Up 35% OFF offer
        // Expires 3 hours after the first practice/simulation test, or 3 hours from registration if no tests taken.
        let isPromoActive = false;
        const { data: results, error: resultsError } = await supabase
            .from('simulation_results')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1);

        if (!resultsError) {
            let oldestTestTime = null;
            if (results && results.length > 0) {
                oldestTestTime = new Date(results[0].created_at).getTime();
            }

            let expiryTime = null;
            if (oldestTestTime) {
                expiryTime = oldestTestTime + 3 * 60 * 60 * 1000;
            } else if (user.created_at) {
                expiryTime = new Date(user.created_at).getTime() + 3 * 60 * 60 * 1000;
            }

            if (expiryTime && Date.now() < expiryTime) {
                isPromoActive = true;
            }
        }

        const couponId = 'NEWUSER35';
        if (isPromoActive) {
            // Check if coupon exists in Stripe
            try {
                await stripe.coupons.retrieve(couponId);
            } catch (err) {
                if (err.statusCode === 404 || err.code === 'resource_missing' || (err.message && err.message.includes('No such coupon'))) {
                    // Create coupon if it doesn't exist
                    try {
                        await stripe.coupons.create({
                            id: couponId,
                            percent_off: 35,
                            duration: 'forever',
                            name: '35% OFF New Sign Up Offer',
                        });
                    } catch (createErr) {
                        console.error('Error creating Stripe coupon:', createErr);
                    }
                } else {
                    console.error('Error retrieving Stripe coupon:', err);
                }
            }
        }

        const sessionConfig = {
            line_items: [
                {
                    price_data: {
                        currency: 'cad', // Updated to CAD
                        product_data: {
                            name: 'Premium Upgrade (One-Time Payment)',
                            description: 'Unlock all features, unlimited practice tests, and timed G1 simulations. One-time payment, lifetime access.',
                        },
                        unit_amount: 1997, // Always standard price $19.97 CAD
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
            success_url: `${req.headers.get('origin')}/account?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/account`,
            client_reference_id: user.id, // Critical: Attach User ID to the session
            customer_email: user.email, // Pre-fill and lock the email field
            metadata: {
                userId: user.id,
                source: source
            },
        };

        if (isPromoActive) {
            sessionConfig.discounts = [
                {
                    coupon: couponId,
                },
            ];
        } else {
            sessionConfig.allow_promotion_codes = true;
        }

        // 2. Create Checkout Session
        const session = await stripe.checkout.sessions.create(sessionConfig);

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
