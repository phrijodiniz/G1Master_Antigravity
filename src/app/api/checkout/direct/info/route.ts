import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

        let query = supabaseAdmin.from('profiles').select('id, email, is_premium')

        if (userId) {
            query = query.eq('id', userId)
        } else if (email) {
            query = query.ilike('email', email)
        }

        const { data: profile, error } = await query.maybeSingle()

        if (error) {
            console.error('Error fetching public info:', error)
            return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
        }

        if (!profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Fetch user metadata from Auth Admin API to get the first name
        let firstName = ''
        try {
            const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
            if (!authError && user) {
                firstName = user.user_metadata?.first_name || ''
                if (!firstName && user.user_metadata?.full_name) {
                    const parts = user.user_metadata.full_name.trim().split(/\s+/)
                    firstName = parts[0] || ''
                } else if (!firstName && user.user_metadata?.name) {
                    const parts = user.user_metadata.name.trim().split(/\s+/)
                    firstName = parts[0] || ''
                }
            }
        } catch (authErr) {
            console.error('Error fetching Auth user details:', authErr)
        }

        return NextResponse.json({
            id: profile.id,
            email: profile.email,
            firstName,
            isPremium: !!profile.is_premium
        })

    } catch (err: any) {
        console.error('Unexpected error in checkout direct info:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
