import { Poppins } from "next/font/google";
import Script from "next/script";
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
            <head>
                <Script
                    id="gtm-script"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer', '${process.env.NEXT_PUBLIC_GTM_ID || 'GTM-WS7NZ35R'}');
          `,
                    }}
                />
            </head>
            <body suppressHydrationWarning={true}>
                <AuthProvider>
                    <LockedOverlay />
                    {children}
                </AuthProvider>
                <noscript>
                    <iframe
                        src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID || 'GTM-WS7NZ35R'}`}
                        height="0"
                        width="0"
                        style={{ display: 'none', visibility: 'hidden' }}
                    />
                </noscript>
            </body>
        </html>
    );
}
