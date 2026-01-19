import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-poppins",
    display: "swap",
});

export const metadata = {
    title: "G1 Master - Ace Your Ontario Driving Test",
    description: "Realistic G1 practice and simulation tests.",
    icons: {
        icon: '/G1MasterApp_Logo.png',
    }
};

import { AuthProvider } from "@/context/AuthContext";
import LockedOverlay from "@/components/LockedOverlay";

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${poppins.variable}`} suppressHydrationWarning={true}>
            <body suppressHydrationWarning={true}>
                <AuthProvider>
                    <LockedOverlay />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
