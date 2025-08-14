import "~/styles/globals.css";

import { type Metadata } from "next";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
    title: "Xellanix PreMark",
    description: "Simple web app to mark presence with QR codes",
    icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                {children}
                <Toaster richColors={true} />
            </body>
        </html>
    );
}
