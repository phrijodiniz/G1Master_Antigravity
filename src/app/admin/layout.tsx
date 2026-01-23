"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin/login';

    // Redirect logic
    useEffect(() => {
        console.log("AdminLayout Check:", { loading, user: user?.email, isAdmin, isLoginPage });

        if (!loading && !isLoginPage) {
            if (!user) {
                console.log("Redirecting to login: No user");
                router.push(`/admin/login?next=${encodeURIComponent(pathname)}`);
            } else if (!isAdmin) {
                console.log("Redirecting to home: Not admin");
                // Not authorized
                router.push('/');
            } else {
                console.log("Admin authorized.");
            }
        }
    }, [user, loading, isAdmin, router, pathname, isLoginPage]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Loading Admin Area...</p>
            </div>
        );
    }

    // Allow Login Page to render without checks
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (!user || !isAdmin) {
        return null; // Will redirect
    }

    // Admin Shell
    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            {/* Top Bar */}
            <header
                className="glass-panel"
                style={{
                    height: '70px',
                    margin: '1rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 2rem',
                    justifyContent: 'space-between',
                    borderRadius: 'var(--radius-lg)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link href="/admin" style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>G1</div>
                        Master Admin
                    </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{user.email}</span>
                    <Link href="/" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                        Back to App
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main>
                {children}
            </main>
        </div>
    );
}
