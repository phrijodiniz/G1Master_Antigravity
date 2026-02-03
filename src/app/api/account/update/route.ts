
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const {
            first_name,
            last_name,
            password
        } = json

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
            return NextResponse.json({ error: 'Unauthorized: No user session found' }, { status: 401 })
        }

        // 2. Prepare Updates
        // Split updates to ensure profile metadata update succeeds even if password update (likely auto-filled same password) fails

        // A. Update Metadata (Name)
        const { error: profileError } = await supabase.auth.updateUser({
            data: {
                first_name,
                last_name
            }
        })

        if (profileError) {
            console.error('Server-side profile update error:', profileError)
            return NextResponse.json({ error: profileError.message }, { status: 500 })
        }

        // B. Update Password (if provided)
        if (password) {
            const { error: passwordError } = await supabase.auth.updateUser({ password })

            if (passwordError) {
                console.warn('Server-side password update warning:', passwordError)
                // If the error is "same password", we can ignore it or treating it as soft warning.
                // For now, if profile updated but password failed, we should probably let the user know, 
                // OR since it's likely autofill, just swallow it if it's the specific "same password" error.

                // Let's decide: If profile succeeded, we return success but maybe log it.
                // If the user REALLY wanted to change password and it failed, they might be confused.
                // But the "New password should be different" error IS the confusing part.

                // Let's return success but with a warning note? 
                // Or just return success. If they typed a NEW password and it failed for other reasons (weak), they should know.
                // But if they typed nothing (autofill), they shouldn't be blocked.

                if (passwordError.message.includes("different from the old")) {
                    // Ignore this specific error as it likely means autofill matched current pass
                } else {
                    return NextResponse.json({ error: `Profile updated, but password failed: ${passwordError.message}` }, { status: 400 })
                }
            }
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Unexpected error in account update route:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
