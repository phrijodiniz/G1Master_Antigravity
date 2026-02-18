import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = {
            get(name: string) {
                // @ts-ignore
                return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
                // @ts-ignore
                request.cookies.set({
                    name,
                    value,
                    ...options,
                })
            },
            remove(name: string, options: CookieOptions) {
                // @ts-ignore
                request.cookies.set({
                    name,
                    value: '',
                    ...options,
                })
            },
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        // @ts-ignore
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // @ts-ignore - The callback doesn't set cookies on the request, but we need to pass a setter
                        // This is a temporary instance just to exchange the code
                    },
                    remove(name: string, options: CookieOptions) {
                        // @ts-ignore
                    },
                },
            }
        )

        // We need to use a slightly different approach for the route handler 
        // because we need to construct a response with the cookies.
        // The standard createServerClient in the docs for route handlers creates a response first?
        // Actually, let's follow the standard Next.js Server Actions / Route Handler pattern for @supabase/ssr

        const redirectUrl = `${origin}${next}`
        console.log(`Auth Callback: Code present. Origin: ${origin}, Next: ${next}`)
        console.log(`Auth Callback: Redirecting to ${redirectUrl}`)

        const response = NextResponse.redirect(redirectUrl)

        const supabaseWithResponse = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        // @ts-ignore
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        const { error } = await supabaseWithResponse.auth.exchangeCodeForSession(code)

        if (!error) {
            return response
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
