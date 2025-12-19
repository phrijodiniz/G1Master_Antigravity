"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./TopBar.module.css";

export default function TopBar() {
    const { user } = useAuth();

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

    // Get initials
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className={styles.topbar}>
            <div></div>

            <div className={styles.profileSection}>
                <div className={styles.profileInfo}>
                    <div>
                        <span className={styles.userName}>{displayName}</span>
                        <span className={styles.userRole}>{user?.email || "No Email"}</span>
                    </div>
                    <div className={styles.avatarPlaceholder}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: '#334155',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600
                        }}>
                            {initials}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
