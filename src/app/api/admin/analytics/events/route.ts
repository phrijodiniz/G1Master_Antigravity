import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const includeArchived = searchParams.get('includeArchived') === 'true'

        let query = supabaseAdmin
            .from('analytics_events')
            .select('*')

        // Filter out archived unless explicitly included (like in management UI)
        if (!includeArchived) {
            query = query.eq('is_archived', false)
        }

        // Filter by date overlap if dates are provided
        if (startDate && endDate) {
            query = query
                .lte('start_date', endDate)
                .or(`end_date.gte.${startDate},end_date.is.null`)
        }

        const { data, error } = await query.order('start_date', { ascending: false })

        if (error) {
            console.error('Error fetching analytics events:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ events: data })
    } catch (err: any) {
        console.error('Unexpected error in GET events:', err)
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
        const { name, description, startDate, endDate, category } = json

        if (!name || !startDate || !category) {
            return NextResponse.json({ error: 'Name, startDate, and category are required' }, { status: 400 })
        }

        const validCategories = ['Feature Release', 'Marketing Campaign', 'Pricing Change', 'Product Update', 'Other']
        if (!validCategories.includes(category)) {
            return NextResponse.json({ error: 'Invalid category value' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('analytics_events')
            .insert([{
                name,
                description: description || null,
                start_date: startDate,
                end_date: endDate || null,
                category,
                is_archived: false
            }])
            .select()

        if (error) {
            console.error('Error creating analytics event:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, event: data[0] })
    } catch (err: any) {
        console.error('Unexpected error in POST events:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const authStatus = await verifyAdmin(request)
        if (!authStatus.authorized) {
            return authStatus.errorResponse!
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Event ID is required as query parameter' }, { status: 400 })
        }

        const json = await request.json()
        const { name, description, startDate, endDate, category, isArchived } = json

        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (description !== undefined) updates.description = description
        if (startDate !== undefined) updates.start_date = startDate
        if (endDate !== undefined) updates.end_date = endDate
        if (category !== undefined) {
            const validCategories = ['Feature Release', 'Marketing Campaign', 'Pricing Change', 'Product Update', 'Other']
            if (!validCategories.includes(category)) {
                return NextResponse.json({ error: 'Invalid category value' }, { status: 400 })
            }
            updates.category = category
        }
        if (isArchived !== undefined) updates.is_archived = !!isArchived

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('analytics_events')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) {
            console.error('Error updating analytics event:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, event: data[0] })
    } catch (err: any) {
        console.error('Unexpected error in PUT events:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const authStatus = await verifyAdmin(request)
        if (!authStatus.authorized) {
            return authStatus.errorResponse!
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Event ID is required as query parameter' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('analytics_events')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting analytics event:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Unexpected error in DELETE events:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
