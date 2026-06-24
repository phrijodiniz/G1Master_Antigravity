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
        let query = supabaseAdmin.from('profiles').select('id, email, is_premium, premium_until')
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

        // 2. If already premium (active), redirect to account
        const isPremiumActive = profile.is_premium && (
            profile.premium_until === null || 
            profile.premium_until === undefined ||
            new Date(profile.premium_until).getTime() > Date.now()
        )
        if (isPremiumActive) {
            return NextResponse.redirect(`${appUrl}/account?alreadyPremium=true`)
        }

        // 3. Define pricing configuration based on requested tier
        const tier = searchParams.get('tier')?.trim() || 'lifetime'
        let unitAmount = 1997 // Default: Lifetime Premium Upgrade
        let name = 'Premium Upgrade (Lifetime Access)'
        let description = 'Unlock all features, unlimited practice tests, and timed G1 simulations with no expiration.'

        if (tier === '2_weeks') {
            unitAmount = 597 // $5.97 CAD
            name = 'Premium Upgrade (2 Weeks Access)'
            description = 'Unlock all features, unlimited practice tests, and timed G1 simulations for 14 days.'
        } else if (tier === '30_days') {
            unitAmount = 997 // $9.97 CAD
            name = 'Premium Upgrade (1 Month Access)'
            description = 'Unlock all features, unlimited practice tests, and timed G1 simulations for 1 month.'
        }

        // 4. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
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
            success_url: `${appUrl}/account?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
            cancel_url: `${appUrl}/account`,
            client_reference_id: profile.id,
            customer_email: profile.email,
            metadata: {
                userId: profile.id,
                tier: tier,
                source: 'direct_link'
            },
        })

        // Redirect directly to Stripe Checkout
        return NextResponse.redirect(session.url!)

    } catch (err: any) {
        console.error('Unexpected error in checkout direct:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
