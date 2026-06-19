import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCheckoutInitiatorsFromSheet } from '@/services/sheets'

// Initialize the Service Role admin client securely on the server
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

// Helper to verify if the requesting user is an authorized Admin
async function verifyAdmin(request: Request) {
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
                        // Safe to ignore in Server context
                    }
                },
            },
        }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { authorized: false, errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('admin')
        .eq('id', user.id)
        .single()

    if (profileError || profile?.admin !== 'YES') {
        return { authorized: false, errorResponse: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }

    return { authorized: true, user }
}

export async function GET(request: Request) {
    try {
        const authStatus = await verifyAdmin(request)
        if (!authStatus.authorized) {
            return authStatus.errorResponse!
        }

        // Fetch checkout initiations from sheets
        let checkoutSet = new Set<string>()
        try {
            const checkoutInitiators = await getCheckoutInitiatorsFromSheet()
            checkoutSet = new Set(checkoutInitiators.map((ci: any) => ci.email.toLowerCase().trim()))
        } catch (sheetError) {
            console.error('Error fetching checkout initiators from sheet in admin route:', sheetError)
        }

        // 1. Fetch all auth users using pagination
        let authUsers: any[] = []
        let page = 1
        const perPage = 1000
        let hasMoreUsers = true

        while (hasMoreUsers) {
            const { data: pageData, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers({
                page,
                perPage
            })
            if (authUsersError) {
                console.error('Error listing auth users:', authUsersError)
                return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 })
            }
            if (pageData && pageData.users && pageData.users.length > 0) {
                authUsers = [...authUsers, ...pageData.users]
                if (pageData.users.length < perPage) {
                    hasMoreUsers = false
                } else {
                    page++
                }
            } else {
                hasMoreUsers = false
            }
        }

        // 2. Fetch all public profiles using pagination
        let profiles: any[] = []
        let profilesOffset = 0
        const limit = 1000
        let hasMoreProfiles = true

        while (hasMoreProfiles) {
            const { data: pageData, error: profilesError } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .range(profilesOffset, profilesOffset + limit - 1)
            if (profilesError) {
                console.error('Error fetching profiles:', profilesError)
                return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
            }
            if (pageData && pageData.length > 0) {
                profiles = [...profiles, ...pageData]
                if (pageData.length < limit) {
                    hasMoreProfiles = false
                } else {
                    profilesOffset += limit
                }
            } else {
                hasMoreProfiles = false
            }
        }

        // 3. Fetch all simulation results using pagination
        let results: any[] = []
        let resultsOffset = 0
        let hasMoreResults = true

        while (hasMoreResults) {
            const { data: pageData, error: resultsError } = await supabaseAdmin
                .from('simulation_results')
                .select('*')
                .range(resultsOffset, resultsOffset + limit - 1)
                .order('created_at', { ascending: false })
            if (resultsError) {
                console.error('Error fetching simulation results:', resultsError)
                return NextResponse.json({ error: 'Failed to fetch simulation results' }, { status: 500 })
            }
            if (pageData && pageData.length > 0) {
                results = [...results, ...pageData]
                if (pageData.length < limit) {
                    hasMoreResults = false
                } else {
                    resultsOffset += limit
                }
            } else {
                hasMoreResults = false
            }
        }

        // 4. Map profiles and aggregate statistics
        const profileMap = new Map(profiles.map(p => [p.id, p]))

        // Group results by user_id to compute rolling metrics
        const userResultsMap = new Map<string, any[]>()
        results?.forEach(r => {
            if (!userResultsMap.has(r.user_id)) {
                userResultsMap.set(r.user_id, [])
            }
            userResultsMap.get(r.user_id)!.push(r)
        })

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

        const combinedUsers = authUsers.map(user => {
            const profile = profileMap.get(user.id)
            const userResults = userResultsMap.get(user.id) || []

            // A. Compute total test counts
            const totalTests = userResults.filter(r => r.test_type !== 'Practice (First Try)').length
            const simulationsCount = userResults.filter(r => r.test_type === 'Simulation').length
            const practiceCount = userResults.filter(r => r.test_type === 'Rules of the Road' || r.test_type === 'Road Signs').length

            // B. Compute active credits in the last 7 days (rolling window)
            const recentPracticeCount = userResults.filter(r => 
                (r.test_type === 'Rules of the Road' || r.test_type === 'Road Signs') &&
                new Date(r.created_at).getTime() >= sevenDaysAgo
            ).length
            const practiceCreditsLeft = Math.max(0, 3 - recentPracticeCount)

            // C. Compute category averages (last 3 tests)
            const rulesScores = userResults
                .filter(r => r.test_type === 'Rules of the Road')
                .slice(0, 3)
                .map(r => Number(r.score))
            
            const signsScores = userResults
                .filter(r => r.test_type === 'Road Signs')
                .slice(0, 3)
                .map(r => Number(r.score))

            const rulesAvg = rulesScores.length > 0
                ? Math.round(rulesScores.reduce((a, b) => a + b, 0) / rulesScores.length)
                : null
            
            const signsAvg = signsScores.length > 0
                ? Math.round(signsScores.reduce((a, b) => a + b, 0) / signsScores.length)
                : null

            // D. Compute readiness score (G1 pass probability)
            let passProbability = 40 // Base probability
            if (rulesAvg !== null && signsAvg !== null) {
                passProbability = Math.round(40 + ((rulesAvg + signsAvg) / 2) * 0.5)
            } else if (rulesAvg !== null) {
                passProbability = Math.round(40 + rulesAvg * 0.5)
            } else if (signsAvg !== null) {
                passProbability = Math.round(40 + signsAvg * 0.5)
            }

            // E. Compute average score of all tests excluding 'Practice (First Try)'
            const validTests = userResults.filter(r => r.test_type !== 'Practice (First Try)')
            const averageScore = validTests.length > 0
                ? Math.round(validTests.reduce((sum, r) => sum + Number(r.score), 0) / validTests.length)
                : null

            // Resolve firstName and lastName with fallbacks for Google OAuth and profiles table
            let firstName = user.user_metadata?.first_name || (profile as any)?.first_name || ''
            let lastName = user.user_metadata?.last_name || (profile as any)?.last_name || ''

            // Extract from full_name or name if first_name/last_name is not direct
            if (!firstName && user.user_metadata?.full_name) {
                const parts = user.user_metadata.full_name.trim().split(/\s+/)
                firstName = parts[0] || ''
                lastName = parts.slice(1).join(' ') || ''
            } else if (!firstName && user.user_metadata?.name) {
                const parts = user.user_metadata.name.trim().split(/\s+/)
                firstName = parts[0] || ''
                lastName = parts.slice(1).join(' ') || ''
            }

            const emailLower = (user.email || '').toLowerCase().trim()
            const isEmailTest = emailLower.includes('test') || emailLower.endsWith('@example.com') || emailLower.includes('demo')
            const isTest = isEmailTest || (profile as any)?.is_test_account === true

            const hasTakenFreeTest = userResults.some(r => r.test_type === 'Practice (First Try)')
            const initiatedCheckout = checkoutSet.has(emailLower)

            return {
                id: user.id,
                email: user.email,
                firstName,
                lastName,
                provider: user.app_metadata?.provider || 'email',
                createdAt: user.created_at,
                status: profile?.is_premium ? 'Premium' : 'Standard',
                admin: profile?.admin || 'NO',
                isTest,
                hasTakenFreeTest,
                initiatedCheckout,
                stats: {
                    totalTests,
                    simulationsCount,
                    practiceCount,
                    practiceCreditsLeft,
                    rulesAvg,
                    signsAvg,
                    passProbability,
                    averageScore
                }
            }
        })

        // Sort users by signup date descending (newest first)
        combinedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        return NextResponse.json({ users: combinedUsers })

    } catch (err: any) {
        console.error('Unexpected error in admin users route:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const authStatus = await verifyAdmin(request)
        if (!authStatus.authorized) {
            return authStatus.errorResponse!
        }

        const json = await request.json()
        const { userId, status, admin, isTestAccount } = json

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const updates: any = {}
        if (status !== undefined) {
            if (status !== 'Standard' && status !== 'Premium') {
                return NextResponse.json({ error: 'Invalid plan status' }, { status: 400 })
            }
            updates.is_premium = (status === 'Premium')
        }
        if (admin !== undefined) {
            if (admin !== 'YES' && admin !== 'NO') {
                return NextResponse.json({ error: 'Invalid admin role' }, { status: 400 })
            }
            updates.admin = admin
        }
        if (isTestAccount !== undefined) {
            updates.is_test_account = !!isTestAccount
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        // Perform the update using admin client to ensure bypass of RLS constraints if any
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', userId)

        if (updateError) {
            console.error('Error updating user profile:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Unexpected error in admin users update route:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
