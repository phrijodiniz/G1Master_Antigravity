"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./TopBar.module.css";
import { useSidebar } from "./DashboardLayout";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendGTMEvent } from "@/lib/gtm";

export default function TopBar() {
    const { user, isPremium } = useAuth();
    const { toggleSidebar } = useSidebar();
    const router = useRouter();

    return (
        <div className={styles.topbar}>
            <button className={styles.hamburger} onClick={toggleSidebar}>
                <Menu size={24} />
            </button>
            
                {/* Temporarily hidden */}
                {false && user && !isPremium && (
                    <button 
                        onClick={() => {
                            sendGTMEvent('view_promotion', { source: 'topbar' });
                            router.push('/account');
                        }}
                        style={{
                            background: '#D4FF00',
                            color: '#000',
                            border: 'none',
                            padding: '0.4rem 1rem',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 2px 10px rgba(212, 255, 0, 0.2)'
                        }}
                    >
                        👑 Upgrade to PREMIUM
                    </button>
                )}

            {/* User profile removed as per request */}
        </div>
    );
}
