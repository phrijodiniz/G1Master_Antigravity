import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const {
            id,
            text,
            options,
            correct_index,
            category,
            chapter,
            explanation,
            is_validated,
            media_url
        } = json

        if (!id) {
            return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
        }

        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        // 1. Verify User
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: No user found' }, { status: 401 })
        }

        // 2. Verify Admin Status
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('admin')
            .eq('id', user.id)
            .single()

        if (profileError || profile?.admin !== 'YES') { // Assuming 'YES' based on prev file reads
            return NextResponse.json({ error: 'Forbidden: User is not admin' }, { status: 403 })
        }

        // 3. Perform Update
        const { error: updateError } = await supabase
            .from('questions')
            .update({
                text,
                options,
                correct_index,
                category,
                chapter,
                explanation,
                is_validated,
                media_url
            })
            .eq('id', id)

        if (updateError) {
            console.error('Server-side question update error:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Unexpected error in question update route:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
