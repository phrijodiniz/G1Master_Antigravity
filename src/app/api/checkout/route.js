import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient'; // We need the auth one to identify the user

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

        // 2. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd', // Adjust currency as needed
                        product_data: {
                            name: 'Premium Upgrade',
                            description: 'Unlock all features and unlimited practice tests.',
                        },
                        unit_amount: 1999, // $19.99 (Adjust price as needed)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/account?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/account`,
            client_reference_id: user.id, // Critical: Attach User ID to the session
            metadata: {
                userId: user.id,
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
