
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const { email } = json

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const cookieStore = await cookies()

        // Use SERVICE_ROLE_KEY to bypass RLS and check purely for existence
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                        }
                    },
                },
            }
        )

        // Check profiles table for the email
        // We use maybeSingle() to avoid error if 0 rows, but we need to check if data exists
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (error) {
            console.error('Error checking email existence:', error)
            return NextResponse.json({ error: 'Database error checking email' }, { status: 500 })
        }

        return NextResponse.json({ exists: !!data })

    } catch (err: any) {
        console.error('Unexpected error in check-email route:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
