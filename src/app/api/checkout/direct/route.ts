import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')?.trim()
        const userId = searchParams.get('userId')?.trim()

        if (!email && !userId) {
            return NextResponse.json({ error: 'Missing email or userId parameter' }, { status: 400 })
        }

        // 1. Fetch user profile
        let query = supabaseAdmin.from('profiles').select('id, email, is_premium')
        if (userId) {
            query = query.eq('id', userId)
        } else {
            query = query.ilike('email', email!)
        }

        const { data: profile, error } = await query.maybeSingle()
        if (error) {
            console.error('Error fetching user profile:', error)
            return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
        }

        if (!profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Determine base URL dynamically
        const protocol = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http')
        const host = request.headers.get('host') || 'localhost:3000'
        const appUrl = `${protocol}://${host}`

        // 2. If already premium, redirect to account
        if (profile.is_premium) {
            return NextResponse.redirect(`${appUrl}/account?alreadyPremium=true`)
        }

        // 3. Ensure Coupon exists in Stripe
        const couponId = 'CAMPAIGN30'
        try {
            await stripe.coupons.retrieve(couponId)
        } catch (err: any) {
            if (err.statusCode === 404 || err.code === 'resource_missing' || (err.message && err.message.includes('No such coupon'))) {
                // Create coupon if it doesn't exist
                try {
                    await stripe.coupons.create({
                        id: couponId,
                        percent_off: 30,
                        duration: 'forever',
                        name: '30% OFF Campaign Offer',
                    })
                    console.log(`Created Stripe coupon ${couponId} dynamically.`)
                } catch (createErr) {
                    console.error('Error creating Stripe coupon:', createErr)
                }
            } else {
                console.error('Error retrieving Stripe coupon:', err)
            }
        }

        // 4. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'cad',
                        product_data: {
                            name: 'Premium Upgrade (One-Time Payment)',
                            description: 'Unlock all features, unlimited practice tests, and timed G1 simulations. One-time payment, lifetime access.',
                        },
                        unit_amount: 1997, // $19.97 CAD
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
            success_url: `${appUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/account`,
            client_reference_id: profile.id,
            customer_email: profile.email,
            discounts: [
                {
                    coupon: couponId,
                },
            ],
            metadata: {
                userId: profile.id,
                source: 'email_campaign'
            },
        })

        // Redirect directly to Stripe Checkout
        return NextResponse.redirect(session.url!)

    } catch (err: any) {
        console.error('Unexpected error in checkout direct:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
