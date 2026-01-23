"use client";

import { useState, createContext, useContext } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import styles from "./DashboardLayout.module.css";

// Context to manage sidebar state
const SidebarContext = createContext({
    isSidebarOpen: false,
    toggleSidebar: () => { },
    closeSidebar: () => { }
});

export const useSidebar = () => useContext(SidebarContext);

export default function DashboardLayout({ children, fullWidth = false, hideTopBar = false }: { children: React.ReactNode, fullWidth?: boolean, hideTopBar?: boolean }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar }}>
            <div className={styles.container}>
                {/* Sidebar - Controlled by internal state for mobile */}
                <Sidebar />

                {/* Main Content Area */}
                <div className={styles.mainContent}>
                    {!hideTopBar && <TopBar />}
                    <main className={fullWidth ? styles.contentInnerFull : styles.contentInner}>
                        {children}
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
