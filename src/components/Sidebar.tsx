"use client";

import styles from "./Sidebar.module.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, BarChart2, Calendar, Settings, LogOut, FileText, User, History as HistoryIcon, GraduationCap } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

import { useSidebar } from "./DashboardLayout";

export default function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const router = useRouter();
    const { isSidebarOpen, closeSidebar } = useSidebar();

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/"); // Redirect to home/login after logout
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { name: "Account", icon: User, path: "/account" },
        { name: "History", icon: HistoryIcon, path: "/history" },
        { name: "Study Now", icon: GraduationCap, path: "/study" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`${styles.overlay} ${isSidebarOpen ? styles.open : ""}`}
                onClick={closeSidebar}
            />

            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.logoContainer}>
                    <Image src="/G1MasterApp_Logo.png" alt="G1 Master Logo" width={100} height={100} style={{ width: 'auto', height: 'auto', maxWidth: '100%' }} />
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path ||
                            (item.path === '/study' && (pathname === '/practice' || pathname === '/chapter' || pathname?.startsWith('/quiz')));

                        // Handler to close sidebar on navigation (mobile)
                        const handleClick = () => {
                            closeSidebar();
                        };

                        if (item.path === '/history' || item.path === '/dashboard') {
                            return (
                                <a
                                    key={item.path}
                                    href={item.path}
                                    className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                                    onClick={handleClick}
                                >
                                    <Icon size={20} />
                                    <span>{item.name}</span>
                                </a>
                            );
                        }
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                                onClick={handleClick}
                            >
                                <Icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <Link
                    href="/contact"
                    className={`${styles.navItem} ${pathname === '/contact' ? styles.active : ""}`}
                    onClick={() => closeSidebar()}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    <span>Contact</span>
                </Link>

                <button onClick={handleLogout} className={`${styles.navItem} ${styles.logout}`}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>
        </>
    );
}
