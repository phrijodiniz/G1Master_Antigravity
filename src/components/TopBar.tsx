"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./TopBar.module.css";
import { useSidebar } from "./DashboardLayout";
import { Menu } from "lucide-react";

export default function TopBar() {
    const { user } = useAuth();
    const { toggleSidebar } = useSidebar();

    // Get display name or part of email
    // Helper
    const formatName = (name: string) => {
        if (!name) return "";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    const meta = user?.user_metadata || {};
    const firstName = meta.first_name || "";
    const lastName = meta.last_name || "";

    let displayName = "Guest User";
    if (firstName) {
        displayName = `${formatName(firstName)} ${formatName(lastName)}`.trim();
    } else if (user?.email) {
        displayName = user.email.split('@')[0];
    }

    return (
        <div className={styles.topbar}>
            <button className={styles.hamburger} onClick={toggleSidebar}>
                <Menu size={24} />
            </button>
            <div></div>

            {/* User profile removed as per request */}

        </div>
    );
}
