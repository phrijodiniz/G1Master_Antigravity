import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;

        if (!userId) {
            console.error('No user_id found in session.');
            return NextResponse.json({ error: 'No user_id found' }, { status: 400 });
        }

        console.log(`Processing Premium upgrade for user: ${userId}`);

        // Update the user's profile in the 'profiles' table
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ is_premium: true, updated_at: new Date() })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating profile:', updateError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(`Successfully upgraded user ${userId} to Premium in profiles table.`);

        console.log(`Supabase User Updated Successfully`);
    }

    return NextResponse.json({ received: true });
}
